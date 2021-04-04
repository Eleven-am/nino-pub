const {getEpisodeInfo, getDetails, getSeasonInfo} = require("../base/tmdb-hook")
const {db, type, insert, Sequelize} = require('../base/sqlize')
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
     * @returns {Promise<{error: string}|{overview: *, found: boolean, name: (string|*), poster: string}|{overview: *, found: boolean, name: (string|*), poster: (string|*)}>}
     */
    async getEpisode(episode_id) {
        let episode = await Entry.findOne({
            where: {episode_id},
            include: [{model: db.models.show, attributes: ['tmdb_id', 'name']}]
        });

        if (episode === null)
            return {error: "No such episode exists"};

        else {
            let video = {...episode.get(), ...episode.show.get()};
            return await getEpisodeInfo(video, true);
        }
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
     * @returns {Promise<{error: string}|{next: number, overview: *, backdrop, episodeName: string, name, logo, location: unknown, type: number}>}
     */
    async playEpisode(episode_id) {
        let episode = await Entry.findOne({
            where: {episode_id},
            include: [{model: db.models.show, attributes: ['tmdb_id', 'name', 'logo', 'backdrop']}]
        });

        if (episode === null)
            return {error: "No such episode exists"};

        else {
            let gid = episode.get('gid');
            let name = episode.show.get('name');
            let video = {...episode.get(), ...episode.show.get()};
            let {logo, backdrop} = video;
            let obj = await getEpisodeInfo(video, false);
            return {
                episodeName: obj.found ? `S${video.season_id}, E${video.episode}: ${obj.name}` : video.name + ": S" + video.season_id + ", E" + video.episode,
                overview: obj.overview, logo, backdrop, type: 0, next: parseInt(episode_id), name, location: gid
            }
        }
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
     * @returns {Promise<{error: string}|Model[]>}
     */
    async getEpisodes(season_id) {
        if (this.obj.hasOwnProperty('tmdb_id')) {
            let seasons = await Entry.findAll({
                where: {season_id},
                attributes: ['episode_id', 'episode'],
                raw: true,
                include: [{model: db.models.show, attributes: ['poster'], where: this.obj}]
            });

            if (seasons === null)
                return {error: "No such season exists"};

            return seasons;
        } else
            return await Entry.findAll({
                attributes: ['episode_id', 'episode'],
                where: {season_id, show_id: this.obj.id},
                raw: true,
                order: db.literal('episode_id ASC')
            });
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