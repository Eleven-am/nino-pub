const {getDetails, getSeasonInfo, getEpisode} = require("../base/tmdb-hook")
const {db, type, Sequelize} = require('../base/sqlize')
const {log: ln} = require('../base/baseFunctions.js')
const log = (line, info) => ln(line, 'episodes', info)
const TvShow = require('./tvShows');

const Entry = db.define('episode', {
    episode_id: {
        type: type.INTEGER,
        primaryKey: true,
        allowNull: false
    }, season_id: {
        type: type.INTEGER,
        allowNull: false
    }, episode: {
        type: type.INTEGER,
        allowNull: false
    }, gid: {
        type: type.STRING,
        allowNull: false
    }, eng: {
        type: type.STRING
    }, fre: {
        type: type.STRING
    }, ger: {
        type: type.STRING
    }, show_id: {
        type: type.INTEGER,
        allowNull: false
    }
});

class Episode extends TvShow {
    /**
     * @desc gets an episode for display purposes
     * @param episode_id
     * @param play
     * @returns {Promise<{overview: (*), name: string, poster: (string|*)}| {error: string}>}
     */
    async getEpisode(episode_id, play = false) {
        let episode = await Entry.findOne({
            where: {episode_id},
            include: [{model: db.models.show, attributes: ['tmdb_id', 'name']}]
        });

        if (episode) {
            let show = await db.models.show.findOne({where: {id: episode.show_id}});
            if (show) {
                let showInfo = await getDetails(0, show.tmdb_id)
                let episodeInfo = await getEpisode({...episode.get(), ...show.get()});
                let overview = episodeInfo.overview && episodeInfo.overview !== ''? episodeInfo.overview: showInfo.overview;
                let name = episodeInfo.name ? episodeInfo.name: 'Episode ' + episode.episode;
                let backdrop = episodeInfo.still_path ? 'https://image.tmdb.org/t/p/original'+ episodeInfo.still_path: episode.backdrop;
                return play ? {episodeInfo: episode.get(), show: show.get(), info: {name, overview, backdrop}} : {name, overview, backdrop};
            }
        }

        return play? null: {error: "No such episode exists"};
    }

    /**
     * @desc checks for the appropriate portrait tag for a given show
     * @returns {Promise<string>}
     */
    async getRecentTag() {
        let result = 'new show';
        let show = await db.models.show.findOne({where: this.obj});
        let episodes = await db.models.episode.findAll({
            where: {show_id: show.id},
            order: [['updatedAt', 'DESC']], raw: true,
            attributes: ['season_id', 'episode', 'episode_id', 'updatedAt']
        });

        let seasons = episodes.uniqueID('season_id');

        let tvShow = await getDetails(0, show.tmdb_id);
        if (tvShow.number_of_seasons === seasons.length && tvShow.number_of_episodes === episodes.length)
            result = "all " + (seasons.length > 1 ? 'seasons' : "episodes");

        else if (seasons.length > 1) {
            result = "new episodes";
            let lastSeason = seasons[0];
            let penUltSeason = seasons[1];

            lastSeason = episodes.filter(item => item.season_id === lastSeason.season_id);
            penUltSeason = episodes.filter(item => item.season_id === penUltSeason.season_id);

            let firstEpisode = lastSeason[lastSeason.length -1];
            let lastEpisode = lastSeason.length > 1 ? lastSeason[0] : firstEpisode;
            let lastPrevEpisode = penUltSeason[0];

            if ((((new Date(lastEpisode.updatedAt).getTime()) - (new Date(firstEpisode.updatedAt).getTime())) < (7 * 24 * 60 * 60 * 1000)) && firstEpisode.episode_id !== lastEpisode.episode_id) {
                let season = await getSeasonInfo({tmdb_id: show.tmdb_id, season_id: lastSeason[lastSeason.length -1].season_id});
                result = "new " + (season.episodes.length <= lastSeason.length ? "season" : "episode" + (lastSeason.length > 1 ? "s" : ""));
                result = (result === "new season" && (((new Date(lastEpisode.updatedAt).getTime()) - (new Date(lastPrevEpisode.updatedAt).getTime())) >= (7 * 24 * 60 * 60 * 1000))) ? result : result + "s";

            } else if (((new Date(lastEpisode.updatedAt).getTime()) - (new Date(firstEpisode.updatedAt).getTime())) >= (7 * 24 * 60 * 60 * 1000)) {
                let penUlt = lastSeason[1];
                result = "new episode" + ((((new Date(lastEpisode.updatedAt).getTime()) - (new Date(penUlt.updatedAt).getTime())) >= (7 * 24 * 60 * 60 * 1000)) ? "" : "s");
            }
        } else if (episodes.length) {
            let date = new Date(new Date(episodes[episodes.length -1].updatedAt).getTime() + (7 * 24 * 60 * 60 * 1000));
            result = (episodes.find(episode => episode.updatedAt >= date) === undefined) ? result : 'new episode';
            result = result + (!result.includes('epi') ? "" : episodes.length > 1 && (new Date(episodes[0].updatedAt).getTime() - new Date(episodes[1].updatedAt).getTime()) > (24 * 60 * 60 * 1000) ? "" : "s");
        }

        return result;
    }

    /**
     * @desc prepares and loads up the relevant information for nino player
     * @param episode_id
     * @returns {Promise<{error: string}|{next: number, overview: *, backdrop, episodeName: string, name, logo, location: string, type: number}>}
     */
    async playEpisode(episode_id) {
        let response = await this.getEpisode(episode_id, true);
        if (response) {
            let {episodeInfo, show, info} = response;
            let {name, backdrop, logo} = show;
            let {episode, season_id, gid} = episodeInfo;

            return {
                logo, backdrop, overview: info.overview, next: parseInt(episode_id), name, location: gid, type: 0,
                episodeName: /^Episode \d+/.test(info.name) ? `${name}: S${season_id}, E${episode}`: `S${season_id}, E${episode}: ${info.name}`
            }
        }

        return {error: "No such episode exists"};
    }
}

Entry.sync().then(() => {
    Entry.show = Entry.belongsTo(db.models.show, {
        foreignKey: 'show_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    db.models.show.episode = db.models.show.hasMany(Entry, {
        foreignKey: 'show_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

}).catch(err => console.error(err));

class Show extends Episode {
    /**
     * @desc gets all available seasons for a show for display purposes
     * @returns {Promise<{error: string}|[]>}
     */
    async getSeasons() {
        let show = await db.models.show.findOne({where: this.obj});
        if (show) {
            return await show.getEpisodes({
                raw: true,
                attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('season_id')), 'season_id']],
                order: [['season_id', 'ASC']]
            });
        } else {
            return {error: "No such show exists"};
        }
    }

    /**
     * @desc gets all episode of a show and it's season for display purposes
     * @param season_id
     * @returns {Promise<{show_id, episodes: (*)}|{error: string}>}
     */
    async getEpisodes(season_id) {
        let show = await db.models.show.findOne({where: this.obj});
        let episodes = await new Promise(resolve => {
            resolve(Entry.findAll({
                attributes: ['episode_id', 'episode'],
                where: {season_id, show_id: show.id},
                raw: true,
                order: db.literal('episode_id ASC')
            }))
        })

        if (show && episodes) {
            let showInfo = await getDetails(0, show.tmdb_id)
            episodes = episodes.map(item => {
                return {
                    season_id, tmdb_id: show.tmdb_id,
                    backdrop: show.backdrop, episode: item.episode, logo: show.logo,
                    episode_id: item.episode_id, name: show.name, poster: show.poster
                }
            })

            for (let item of episodes){
                let episode = await getEpisode(item);
                item.overview = episode.overview && episode.overview !== ''? episode.overview: showInfo.overview;
                item.name = episode.name ? episode.name: 'Episode ' + item.episode;
                item.backdrop = episode.still_path ? 'https://image.tmdb.org/t/p/original'+episode.still_path: item.backdrop;
            }

            return {episodes, show_id: show.id};
        } else
            return {error: "No such show or season exists"};
    }

    /**
     * @desc sFetches all relevant data from TMDB for a given tv show
     * @returns {Promise<{error: string}|{overview, backdrop, production: *[], release: string, rating: string, runtime: string, type: string, recommendations, trailer, cast, review, genre: boolean, name, options, logo, id, poster}>}
     */
    async getInfo() {
        let obj = await super.getInfo();
        let seasons = await this.getSeasons();
        if (!obj.hasOwnProperty('error') && !seasons.hasOwnProperty('error')) {
            obj.seasons = seasons.map(item => 'Season ' + item.season_id);
        }
        return obj
    }
}

module.exports = Show;