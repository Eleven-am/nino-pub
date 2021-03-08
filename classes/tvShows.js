const {getDetails, castCrew, pageTwo, getGenre, getProd, getTvRating} = require("../base/tmdb-hook");
const {db, type, insert} = require('../base/sqlize')
const {log: ln} = require('../base/baseFunctions.js')
const log = (line, info) => ln(line, 'tvShow', info)

const Entry = db.define('show', {
    name: {
        type: type.STRING,
        allowNull: false
    }, backdrop: {
        type: type.STRING,
        allowNull: false
    }, poster: {
        type: type.STRING,
        allowNull: false
    }, logo: {
        type: type.STRING
    }, trailer: {
        type: type.STRING
    }, gid: {
        type: type.STRING,
        allowNull: false
    }, tmdb_id: {
        type: type.INTEGER,
        allowNull: false
    }, type: {
        type: type.BOOLEAN,
        defaultValue: false
    }
});

Entry.sync().catch(err => console.error(err));

class TvShow {
    /**
     * @desc The TvShows class allows for most manipulation of shows and episodes as it is extended by episode that's itself extended by season
     * @param info_id isRequired for sql identification queries
     */
    constructor(info_id) {
        if (info_id === undefined)
            throw new Error('A valid show identifier must be provided');
        else {
            info_id = `${info_id}`;
            this.obj = info_id.charAt(0) !== 's' ? {id: info_id} : {tmdb_id: info_id.replace('s', '')};
        }
    }

    /**
     * @desc sFetches all relevant data from TMDB for a given tv show
     * @returns {Promise<{error: string}|{overview, backdrop, production: *[], release: string, rating: string, runtime: string, type: string, recommendations, trailer, cast, review, genre: boolean, name, options, logo, id, poster}>}
     */
    async getInfo() {
        let entry = await Entry.findOne({where: this.obj});
        if (entry) {
            let details = await getDetails(0, entry.get('tmdb_id'));
            let cast = (await castCrew(entry.get('tmdb_id'), 0)).cast.map(item => {
                return {
                    character: item.character,
                    name: item.name,
                    id: item.id
                }
            });

            let {overview, vote_average, first_air_date, episode_run_time} = details;
            let {logo, backdrop, trailer, name, poster, tmdb_id} = entry.get();

            let release = new Date(first_air_date).toUTCString().substr(8, 8);
            let rating = await getTvRating(tmdb_id);

            let genre = getGenre(details);
            let production = getProd(details);
            let {recommendations, options} = await this.getRecommendations();

            return {
                backdrop, cast, genre, id: tmdb_id, logo, name, show_id: entry.get('id'),
                section: options, overview, poster, production, rating, recommendations,
                release, review: vote_average, runtime: episode_run_time[0] + ' mins.', trailer, type: 'show'
            };

        } else {
            return {error: "No such show exists"};
        }
    }

    /**
     * @desc gets recommendations for show from the database
     * @param forPlay determines if the recommendation is for playback or for more info
     * @returns {Promise<{error: string}|{options: (string), recommendations: (*[]|[])}>}
     */
    async getRecommendations(forPlay) {
        forPlay = forPlay || false;
        let columns = ['poster', 'logo', 'tmdb_id', 'type'];

        if (forPlay)
            columns = ['poster', 'logo', 'tmdb_id', 'type', 'name', 'backdrop'];


        let entry = await Entry.findOne({where: this.obj});
        if (entry === null)
            return {error: "No such show exists"};
        else {
            entry = entry.get();
            let database = await Entry.findAll({
                attributes: columns,
                raw: true,
                order: db.literal('tmdb_id ASC')
            });
            let recommendations = await pageTwo(0, entry.tmdb_id, database, 1, 2);

            return {
                recommendations: recommendations.length ? recommendations : database.randomiseDB(10, entry.tmdb_id, 1),
                options: recommendations.length ? ["Seasons", "More like this"] : ["Seasons", "Surprise me!"]
            }
        }
    }
}

module.exports = TvShow;