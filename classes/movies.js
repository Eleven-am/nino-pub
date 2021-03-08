const {getDetails, castCrew, getCollection, pageTwo, getGenre, getProd, getMovieRating} = require("../base/tmdb-hook");
const {db, type, insert} = require('../base/sqlize')
const {log: ln} = require('../base/baseFunctions.js')
const log = (line, info) => ln(line, 'movie', info)

const Entry = db.define('movie', {
    movie_id: {
        type: type.BIGINT(20),
        primaryKey: true,
        allowNull: false
    }, name: {
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
    }, eng: {
        type: type.STRING
    }, fre: {
        type: type.STRING
    }, ger: {
        type: type.STRING
    }, type: {
        type: type.BOOLEAN,
        defaultValue: true
    }
});

Entry.sync().catch(err => console.error(err));

class Movie {
    /**
     * @desc provides access to the movie type and for it's subsequent use
     * @param info_id info_id isRequired for sql identification queries
     */
    constructor(info_id) {
        if (info_id === undefined)
            throw new Error('A valid movie identifier must be provided');
        else
            this.obj = info_id.charAt(0) !== 'm' ? {movie_id: info_id} : {tmdb_id: info_id.replace('m', '')};
    }

    /**
     * @desc searches the database for a given movie
     * @returns {Promise<any|{error: string}>}
     */
    async findMovie() {
        const found = await Entry.findOne({where: this.obj});
        return found ? found.get() : {error: 'Movies does not exist'};
    }

    /**
     * @desc sFetches all relevant data from TMDB for a given movie
     * @returns {Promise<{error: string}|{overview, backdrop, production: *[], release: string, rating: string, runtime: string, type: string, recommendations, crew, trailer, cast, review, genre: boolean, name, options, logo, id, poster}>}
     */
    async getInfo() {
        let entry = await Entry.findOne({where: this.obj});
        if (entry) {
            let dBase = [];
            let details = await getDetails(1, entry.get('tmdb_id'));
            let {cast, crew} = await castCrew(entry.get('tmdb_id'), 1);
            let movies = await Entry.findAll({
                attributes: ['poster', 'tmdb_id', 'type'],
                raw: true,
                order: db.literal('tmdb_id ASC')
            });

            if (details.belongs_to_collection !== null) {
                let {parts} = await getCollection(details.belongs_to_collection.id);
                dBase = parts.sortKey('release_date', true).reduite(movies, 1);
                dBase = dBase.filter(item => item.tmdb_id !== entry.tmdb_id)
            }

            crew = crew.filter(person => person.job === "Director" || person.job === "Screenplay").map(item => {
                return {
                    name: item.name,
                    job: item.job,
                    id: item.id
                }
            });

            cast = cast.slice(0, 15).map(item => {
                return {
                    character: item.character,
                    name: item.name,
                    id: item.id
                }
            });

            let {overview, vote_average, runtime} = details;
            let {logo, backdrop, trailer, name, poster, tmdb_id, movie_id} = entry.get();

            let hours = Math.floor(runtime / 60);
            hours = hours !== 0 ? hours > 1 ? hours + " hours, " : hours + " hour, " : "";
            runtime = hours + (runtime % 60) + " mins.";

            let genre = getGenre(details);
            let production = getProd(details);
            let {rating, release} = await getMovieRating(tmdb_id);
            let recommendations = dBase.concat(await pageTwo(1, entry.tmdb_id, movies, 1, 2));
            let section = recommendations.length ? ["More like this"] : ["Surprise me!"];
            recommendations = recommendations.length ? recommendations : movies.randomiseDB(10, entry.tmdb_id, 0);

            return {
                backdrop, cast, crew, genre, id: tmdb_id, logo, movie_id, name,
                section, overview, poster, production, rating,
                recommendations: recommendations.uniqueID('tmdb_id'),
                release, review: vote_average, runtime, trailer, type: 'movie'
            };

        } else {
            return {error: "No such movie exists"};
        }
    }

    /**
     * @desc gets the next movie for playback for the current item being played
     * @returns {Promise<{error: string}|{play: string, overview, backdrop: *, name: *}>}
     */
    async upNext() {
        let entry = await Entry.findOne({where: this.obj});
        if (entry !== null) {
            let database = await Entry.findAll({
                attributes: ['logo', 'tmdb_id', 'type', 'name', 'backdrop'],
                raw: true,
                order: db.literal('tmdb_id ASC')
            });

            if (database.length) {
                let result;
                let details = await this.getNextFromCollection(entry.get('tmdb_id'), database);
                if (details === false) {
                    result = await this.getRecommendation(entry.get('tmdb_id'), database);
                    let {overview} = await getDetails(1, result[0].tmdb_id);
                    result = {
                        overview,
                        backdrop: result[0].backdrop,
                        name: result[0].name,
                        play: 'm' + result[0].tmdb_id
                    };
                } else {
                    let {overview} = await getDetails(1, details.tmdb_id);
                    result = {overview, backdrop: details.backdrop, name: details.name, play: 'm' + details.tmdb_id};

                }
                return result;
            }
        }
        return {error: "No such movie exists"};
    }

    /**
     * @desc gets the recommendations of a movie similar to movie provided from TMDB
     * @param tmdb_id
     * @param movies
     * @returns {Promise<*>}
     */
    async getRecommendation(tmdb_id, movies) {
        let recommendations = await pageTwo(1, tmdb_id, movies, 1, 2);
        let array = recommendations.length ? recommendations : movies;
        return array.randomiseDB(1, 1, 0);
    }

    /**
     * @desc gets the next movie on TMDB collection for playback
     * @param tmdb_id
     * @param movies
     * @returns {Promise<boolean|*>}
     */
    async getNextFromCollection(tmdb_id, movies) {
        let details = await getDetails(1, tmdb_id);
        if (details.belongs_to_collection !== null) {
            let {parts} = await getCollection(details.belongs_to_collection.id);
            let dBase = parts.reduite(movies, 1, 'release_date').sortKey('release_date', true);
            let index = dBase.find(item => item.release_date > details.release_date);
            return index || false
        }
        return false;
    }

    /**
     * @desc prepares and loads up the relevant information for nino player
     * @returns {Promise<{error: string}|{next, overview, backdrop, name, logo, location, type: number}>}
     */
    async playMovie() {
        let result;
        let response = await Entry.findOne({
            where: this.obj,
            attributes: ['name', 'gid', 'movie_id', 'backdrop', 'logo', 'tmdb_id']
        })
        if (response !== null) {
            let {overview} = await getDetails(1, response.get('tmdb_id'));
            let {name, gid, movie_id, backdrop, logo} = response.get();
            result = {location: gid, type: 1, name, logo, backdrop, overview, next: movie_id};

        } else result = {error: "No such movie exists"};

        return result;
    }
}

module.exports = Movie;