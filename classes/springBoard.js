const Show = require('./episodes')
const Movie = require('./movies')
const {takeFive, sFetch, log} = require("../base/baseFunctions");
const Views = require('./watched')
const Iframe = require("./iframe");
const {MyList: List, Editor} = require('./lists')
const {admin_mail} = require('../config/nino.json')
const {getDetails, trending, loadPortrait} = require("../base/tmdb-hook");
const {db, insert, queryDB} = require('../base/sqlize')
const {User} = require("../classes/auths");
const user = new User();
await user.createAdmin();

class SpringBoard extends Views {
    /**
     * @desc sFetches all relevant data from TMDB for a given movie/show on failure it returns an array
     * @param info_id
     * @param user_id
     * @returns {Promise<{error: string}|{overview, backdrop, production: *[], release: string, rating: string, runtime: string, type: string, recommendations, trailer, cast, review, genre: boolean, name, options, logo, id, poster}>}
     */
    async getInfo(info_id, user_id) {
        let result;
        let check = info_id.charAt(0) === "m";
        let myRating = await db.models.rating.findOne({
            where: {
                type: check,
                tmdb_id: info_id.replace(/[ms]/, ''),
                user_id
            }
        })
        myRating = myRating ? myRating.get('rate') * 10 : 5;
        if (check) {
            let movie = new Movie(info_id);
            result = await movie.getInfo();
            if (!result.hasOwnProperty('error')) {
                let position = await this.checkSeen(user_id, result.movie_id, true);
                result.seen = position > 919;

                if (position !== 0)
                    result.position = position >= 920 ? 100 : position / 10;

                delete result.movie_id;
            }

        } else {
            let show = new Show(info_id);
            result = await show.getInfo();
            if (!result.hasOwnProperty('error'))
                result.seen = await this.checkShowSeen(user_id, result.show_id);

            delete result.show_id;
        }

        let list = new List();
        if (!result.hasOwnProperty('error')) {
            result.myList = await list.checkOnList(user_id, info_id);
            result.section.push("Details");
            result.myRating = myRating + '%';
            result.rating = result.rating === '' ? 'unknown' : result.rating;
        }

        return result;
    }

    /**
     * @desc check if the user has seen the show
     * @param user_id
     * @param show_id
     * @returns {Promise<boolean>}
     */
    async checkShowSeen(user_id, show_id){
        let result = false;
        let user = await db.models.user.findOne({where: {user_id}});
        if (user) {
            let episodes = await db.models.episode.findAll({raw: true, where: {show_id}, order: [['episode_id', 'DESC']]});
            let seenEpisodes = await user.getWatches({where: {show_id}, order: [['episode_id', 'DESC']]});
            result = seenEpisodes.some(item => item.finished === 2);
            if (!result){
                let episode = episodes[0];
                result = seenEpisodes.some(item => item.episode_id === episode.episode_id && item.position > 919);
            }
        }

        return result;
    }

    /**
     * @desc helps to find entries, useful for when a user shares a link
     * @param info_id
     * @param tmdb_id determines if info_id is name or tmdb_id || optional
     * @returns {Promise<any>|{error: string}}
     */
    async findEntry(info_id, tmdb_id) {
        tmdb_id = tmdb_id || false;
        let type = info_id.charAt(0) === "m" ? 'movie': 'show';
        let model = info_id.charAt(0) === "m" ? db.models.movie: db.models.show;
        let name = info_id.replace(/[ms]/, '').replace(/\+/g, ' ');
        if (!tmdb_id){
            let table = `${type}s WHERE name like "${name}%"`;
            let item = await queryDB('*', table);
            item = item.map(entry => {
                let temp = entry;
                temp.diff = entry.name.levenstein(name);
                return temp;
            }).sortKey('diff', true);
            return item.length ? item[0]: {error: 'No such item exists'};

        } else {
            let entry = await model.findOne({where: {tmdb_id: name}});
            return entry ? entry.get() : {error: 'No such item exists'};

        }
    }

    /**
     * @desc gets items recently added to the database for the recently added section
     * @returns {Promise<[]>}
     */
    async getRecent() {
        let movies = await db.models.movie.findAll({
            order: [['updatedAt', 'DESC']],
            raw: true,
            attributes: ['tmdb_id', 'poster', 'type', 'updatedAt']
        });
        let shows = await db.models.show.findAll({
            order: [['updatedAt', 'DESC']],
            raw: true,
            attributes: ['tmdb_id', 'poster', 'type', 'updatedAt']
        });

        let result = [];
        movies = takeFive(movies, 7).result;
        shows = takeFive(shows, 3).result;
        let data = movies.concat(shows).sortKey('updatedAt', false);

        for (let item of data) {
            item.poster = await loadPortrait(item.tmdb_id, item.type);
            if (item.type === 0) {
                let show = new Show('s' + item.tmdb_id);
                item.tag = await show.getRecentTag();
            }

            delete item.updatedAt;
            result.push(item);
        }

        return result;
    }

    /**
     * @desc gets all episode of a show and it's season for display purposes
     * @param info_id
     * @param season_id
     * @param user_id
     * @returns {Promise<[]>}
     */
    async getEpisodes(info_id, season_id, user_id) {
        let show = new Show(info_id);
        let res = await show.getEpisodes(season_id);
        let episodes = [];
        let backdrop = '';

        if (res.length) {
            backdrop = await db.models.show.findOne({where: {tmdb_id: info_id.replace('s', '')}});
            backdrop = backdrop ? backdrop.get('backdrop') : '';
        }

        for (let item of res) {
            let temp = await show.getEpisode(item.episode_id);
            let position = await this.checkSeen(user_id, item.episode_id);
            temp.position = position >= 920 ? 100 : position / 10;

            delete temp.found;
            temp.poster = temp.poster === undefined ? backdrop : temp.poster;
            temp.name = item.episode + ' ' + temp.name;
            temp.id = item.episode_id;
            episodes.push(temp);

        }
        return episodes;
    }

    /**
     * @desc gets an array of either movies or tv
     * @param movie determines if array should be movie or not
     * @param backdropLogo determines if array[object].keys should include (backdrop, logo || poster)
     * @returns {Promise<*|*>}
     */
    async getLibrary(movie, backdropLogo) {
        backdropLogo = backdropLogo || false;
        let type = movie ? db.models.movie : db.models.show;
        return backdropLogo ? await type.findAll({
            attributes: ['tmdb_id', 'type', 'backdrop', 'logo', 'name'],
            raw: true,
            order: db.literal('RAND()')
        }) : await type.findAll({
            attributes: ['tmdb_id', 'type', 'poster', 'name'],
            raw: true,
            order: db.literal('RAND()')
        });
    }

    /**
     * @desc necessary for the 5 huge banners on the landing page
     * @returns {Promise<[]|*[]>}
     */
    async getBanner() {
        let movies = await this.getLibrary(true, true);
        let shows = await this.getLibrary(false, true);
        if (movies.length && shows.length) {
            movies = movies.splice(0, 3);
            shows = shows.splice(0, 2);
            movies = movies.concat(shows);
            return movies.randomiseDB(movies.length, 0, 3);

        } else return [];
    }

    /**
     * @desc returns the trending movies/shows on TMDB ATM that are available on the database, sorted by popularity
     * @returns {Promise<*[]>}
     */
    async getTrending() {
        let dBase = (await this.getLibrary(true, false)).concat(await this.getLibrary(false, false));
        return await trending(3, dBase);
    }

    /**
     * @desc loads the meta tags for the ejs renderer
     * @param type
     * @param value
     * @returns {Promise<{error: string}>}
     */
    async getMetaTags(type, value) {
        let result = {error: 'No such item exists'};
        if (type === "movie" || type === "show") {
            let table = `${type}s WHERE name like "${value}%"`;
            let item = await queryDB('*', table);
            item = item.map(entry => {
                let temp = entry;
                temp.diff = entry.name.levenstein(value);
                return temp;
            }).sortKey('diff', true);
            item = item.length ? item[0]: null;
            if (item) {
                let {overview} = await getDetails(item.type, item.tmdb_id);
                let {name, poster} = item;
                result = {overview, name, poster};
            }
        } else if (type === "watch")
            result = await this.getAuthTags(value);

        else if (type === "iframe") {
            let frame = new Iframe();
            result = await frame.getAuthTags(value);
        }

        return result;
    }

    /**
     * @desc updates the seen and suggestions tables with the user's new information
     * @param user_id
     * @returns {Promise<boolean>}
     */
    async saveSuggestion(user_id) {
        let {suggestion, again} = await this.loadSuggestions(user_id);
        log(187, 'suggestions', 'gotten');
        await db.models.seen.destroy({where: {user_id}});
        await db.models.suggestion.destroy({where: {user_id}});
        log(190, 'old suggestions', 'deleted');

        suggestion = suggestion.map(item => {
            let temp = item;
            temp.user_id = user_id;
            return temp;
        });

        let seen = again.map(item => {
            let temp = item;
            temp.user_id = user_id;
            return temp;
        });

        log(204, 'old suggestions', 'replaced');
        await db.models.seen.bulkCreate(seen);
        await db.models.suggestion.bulkCreate(suggestion);
        return true;
    }

    /**
     * @desc gets suggestions for just for you section;
     * @param user_id
     * @returns {Promise<[]>}
     */
    async getSuggestion(user_id) {
        let movies = await db.models.suggestion.findAll({
            order: db.literal('RAND()'),
            raw: true,
            where: {user_id, type: 1},
            attributes: ['rep', 'poster', 'type', 'tmdb_id']
        })
        let shows = await db.models.suggestion.findAll({
            order: db.literal('RAND()'),
            raw: true,
            where: {user_id, type: 0},
            attributes: ['rep', 'poster', 'type', 'tmdb_id']
        })

        movies = takeFive(movies, 20).result;
        shows = takeFive(shows, 10).result;
        return movies.concat(shows).sortKey('rep', false);
    }

    /**
     * @desc gets items user has seen for the watch again section
     * @param user_id
     * @returns {Promise<[]>}
     */
    async getSeen(user_id) {
        let movies = await db.models.seen.findAll({
            order: db.literal('RAND()'),
            raw: true,
            where: {user_id, type: 1},
            attributes: ['rep', 'type', 'tmdb_id']
        })
        let shows = await db.models.seen.findAll({
            order: db.literal('RAND()'),
            raw: true,
            where: {user_id, type: 0},
            attributes: ['rep', 'type', 'tmdb_id']
        })

        let result = [];
        movies = takeFive(movies, 7).result;
        shows = takeFive(shows, 3).result;
        let data = movies.concat(shows).sortKey('rep', false);

        for (let item of data) {
            item.poster = await loadPortrait(item.tmdb_id, item.type);
            result.push(item);
        }

        return result;
    }

    /**
     * @desc returns the editors pick by a given category
     * @param category
     * @returns {Promise<{error: string}>}
     */
    async getList(category) {
        let editor = new Editor();
        return await editor.getList(category);
    }

    /**
     * @desc gets all items on a user's watch list
     * @param user_id
     * @returns {Promise<Model[]>}
     */
    async getMyList(user_id) {
        let list = new List();
        return await list.getList(user_id);
    }

    /**
     * @desc gets every item on the database for search
     * @returns {Promise<Model[]>}
     */
    async getSearch() {
        let movies = await db.models.movie.findAll({attributes: ['tmdb_id', 'type', 'poster', 'name'], raw: true});
        let shows = await db.models.show.findAll({attributes: ['tmdb_id', 'type', 'poster', 'name'], raw: true});
        return movies.concat(shows).sortKey('name', true);
    }

    /**
     * @desc allows a user to rate an entry, helps improve suggestions
     * @param info_id
     * @param user_id
     * @param rate
     * @returns {Promise<*>}
     */
    async rateEntry(info_id, user_id, rate) {
        let check = info_id.charAt(0) === "m";
        info_id = info_id.replace(/[ms]/, '');
        let obj = {
            tmdb_id: info_id, user_id, rate,
            type: check
        }

        let cond = {tmdb_id: info_id, user_id};
        return await insert(db.models.rating, obj, cond);
    }

    /**
     * @desc adds a new entry to a user's list on demand
     * @param info_id
     * @param user_id
     * @returns {Promise<*>}
     */
    async setList(info_id, user_id) {
        let list = new List();
        return await list.addToMyList(user_id, info_id);
    }

    /**
     * @desc gets server identity from homeBase
     * @returns {Promise<*|*[]|{}>}
     */
    async getIdentity() {
        return await sFetch('https://nino-homebase.herokuapp.com/auth/' + admin_mail);
    }

    /**
     * @desc marks every item for the corresponding show or movie as seen
     * @param user_id
     * @param info_id
     * @returns {Promise<any | {error: string}>}
     */
    async markAsSeen(user_id, info_id) {
        let check = false;
        let type = info_id.charAt(0) === 'm';
        let backup = info_id;
        info_id = info_id.replace(/[ms]/, '');
        let model = type ? db.models.movie: db.models.show;
        let entry = await model.findOne({where: {tmdb_id: info_id}});

        if (type && entry) {
            entry = await db.models.watch.findOne({where: {movie_id: entry.movie_id, user_id}});
            check = entry !== null && entry.position > 919;

        } else if (!type && entry)
            check = await this.checkShowSeen(user_id, entry.id);

        if (check) {
            if (type)
                await db.models.watch.destroy({where: {movie_id: entry.movie_id, user_id}});

            else
                await db.models.watch.destroy({where: {show_id: entry.id, user_id}});

        } else {
            let temp = await super.markAsSeen(user_id, backup);
            if (temp.hasOwnProperty('error'))
                return temp;
        }

        return check === false ? "out": true;
    }
}

module.exports = SpringBoard;