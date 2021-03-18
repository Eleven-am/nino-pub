const {db, type, insert, Op} = require('../base/sqlize')
const Show = require('./episodes')
const Movie = require('./movies')
const {User} = require('./auths')
const {getDetails, getEpisodeInfo, trending, pageTwo} = require("../base/tmdb-hook");
const {log: ln, create_UUID} = require("../base/baseFunctions")
const log = (line, info) => ln(line, 'watched', info)

const usr = new User();
const Entry = db.define('watch', {
    watched_id: {
        type: type.BIGINT(20),
        primaryKey: true,
        allowNull: false
    }, auth: {
        type: type.UUID,
        allowNull: false
    }, position: {
        type: type.INTEGER,
        allowNull: false
    }, user_id: {
        type: type.UUID,
        reference: {
            model: db.models.user,
            key: 'user_id',
        }
    }, type: {
        type: type.BOOLEAN,
        defaultValue: false
    }, finished: {
        type: type.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'watched'
});

Entry.episode = Entry.belongsTo(db.models.episode, {
    foreignKey: 'episode_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
})

Entry.show = Entry.belongsTo(db.models.show, {
    foreignKey: 'show_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
})

Entry.movie = Entry.belongsTo(db.models.movie, {
    foreignKey: 'movie_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
})

db.models.episode.watched = db.models.episode.hasMany(Entry, {
    foreignKey: 'episode_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

db.models.movie.watched = db.models.movie.hasMany(Entry, {
    foreignKey: 'movie_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

db.models.show.watched = db.models.show.hasMany(Entry, {
    foreignKey: 'show_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Entry.sync().then(() => {
    db.models.user.watched = db.models.user.hasMany(Entry, {foreignKey: 'user_id', sourceKey: 'user_id'});
    Entry.user = Entry.belongsTo(db.models.user, {foreignKey: 'user_id', targetKey: 'user_id'});
}).catch(err => console.error(err))

const ViewsDb = db.define('view', {
    auth: {
        type: type.UUID,
        allowNull: false
    }, user_id: {
        type: type.UUID,
        reference: {
            model: db.models.user,
            key: 'user_id',
        }
    }, location: {
        type: type.STRING,
        allowNull: false
    }, type: {
        type: type.BOOLEAN,
        defaultValue: false
    }
});

ViewsDb.movie = ViewsDb.belongsTo(db.models.movie, {
    foreignKey: 'movie_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
})

ViewsDb.episode = ViewsDb.belongsTo(db.models.episode, {
    foreignKey: 'episode_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
})

db.models.movie.views = db.models.movie.hasMany(ViewsDb, {
    foreignKey: 'movie_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
})

db.models.episode.views = db.models.episode.hasMany(ViewsDb, {
    foreignKey: 'episode_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
})

ViewsDb.sync().then(() => {
    db.models.user.view = db.models.user.hasMany(ViewsDb, {foreignKey: 'user_id', sourceKey: 'user_id'});
    ViewsDb.user = ViewsDb.belongsTo(db.models.user, {foreignKey: 'user_id', targetKey: 'user_id'});
}).catch(err => console.error(err))

const Shuffle = db.define('shuffle', {
    user_id: {
        type: type.UUID,
        reference: {
            model: db.models.user,
            key: 'user_id',
        }
    }, gid: {
        type: type.STRING,
        allowNull: false
    }, tmdb_id: {
        type: type.INTEGER,
        allowNull: false
    }
});

Shuffle.episode = Shuffle.belongsTo(db.models.episode, {
    foreignKey: 'episode_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
})

db.models.episode.watched = db.models.episode.hasMany(Shuffle, {
    foreignKey: 'episode_id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Shuffle.sync().then(() => {
    db.models.user.watched = db.models.user.hasMany(Shuffle, {foreignKey: 'user_id', sourceKey: 'user_id'});
    Shuffle.user = Shuffle.belongsTo(db.models.user, {foreignKey: 'user_id', targetKey: 'user_id'});
}).catch(err => console.error(err))

class Watched {
    /**
     * @desc prepares and loads up the relevant information for nino player
     * @param user_id
     * @param info_id
     * @returns {Promise<{error: string}|{next: number, overview: *, backdrop: *, episodeName: string, name: *, logo: *, location: string, type: number}|boolean|{next, overview, backdrop, name, logo, location, type: number}>}
     */
    async playVideo(user_id, info_id) {
        let result = false;
        let check = info_id.charAt(0) === "m" || info_id.charAt(0) === "e";
        let user = await db.models.user.findOne({where: {user_id}});
        if (user) {
            if (check) {
                check = info_id.charAt(0) === "m";
                if (check) {
                    let movie = new Movie(info_id);
                    result = await movie.playMovie();
                } else {
                    info_id = info_id.replace('e', '');
                    let show = new Show('00');
                    result = await show.playEpisode(info_id);
                }
            } else if (info_id.charAt(0) === "s") {
                info_id = info_id.replace('s', '');
                let info = await this.getNextEpisode(user_id, info_id);

                let show = new Show('00');
                result = info !== false ? await show.playEpisode(info.episode_id) : false;
            } else if (info_id.charAt(0) === "x") {
                info_id = info_id.replace('x', '');
                let show = await db.models.show.findOne({where: {tmdb_id: info_id}});
                if (show) {
                    let episodes = await show.getEpisodes({
                        raw: true,
                        attributes: ['episode_id', 'gid'],
                        order: db.literal('RAND()')
                    });

                    episodes = episodes.map( episode => {
                        episode.user_id = user_id;
                        episode.tmdb_id = show.get('tmdb_id');
                        return episode;
                    })

                    if (episodes.length){
                        let episode = episodes[0];
                        let showClass = new Show('00');
                        let temp = await showClass.playEpisode(episode.episode_id);
                        temp.next = 'x' + temp.next;
                        result = temp;
                    }

                    await Shuffle.destroy({where: {user_id}});
                    await Shuffle.bulkCreate(episodes.map(item => {delete item.id; return item;}));

                } else {
                    let episodes = await Shuffle.findAll({where: {user_id}, raw: true});
                    if (episodes[0].episode_id === parseInt(info_id)){
                        let episode = episodes[0];
                        let showClass = new Show('00');
                        let temp = await showClass.playEpisode(episode.episode_id);
                        temp.next = 'x' + temp.next;
                        result = temp;
                    }
                }
            }

            if (result !== false && result.position === undefined) {
                let obj = result.type === 0 ? {episode_id: result.next} : {movie_id: result.next}
                let pos = await user.getWatches({where: obj});
                result.position = pos.length ? pos[0].get('finished') === 0 ? pos[0].get('position') : 0 : 0;
                result.guest = await usr.loggedInsGuest(user_id);
            }
        }

        return result;
    }

    /**
     * @desc checks if a user has seen this movie/episode, if yes it returns position if not 0
     * @param user_id
     * @param info_id
     * @param movie determines if the item being checked is a movie/episode
     * @returns {Promise<number>}
     */
    async checkSeen(user_id, info_id, movie) {
        let result = 0;
        movie = movie || false;
        info_id = `${info_id}`;
        let user = user_id ? await db.models.user.findOne({where: {user_id}}) : null;
        if (user) {
            let response = movie ? await user.getWatches({where: {movie_id: info_id}}) : await user.getWatches({where: {episode_id: info_id}});
            result = response.length ? response[0] : false;
            result = result !== false ? result.get('position') : 0;

        }
        return result;
    }

    /**
     * @desc returns false if user hasn't seen any episode / has seen all episodes otherwise it sends next episode
     * @param user_id
     * @param tmdb_id
     * @param find
     * @returns {Promise<boolean>}
     */
    async getNextEpisode(user_id, tmdb_id, find) {
        find = find === undefined;
        let result = false;
        let show = await db.models.show.findOne({where: {tmdb_id}});
        let show_id = show ? show.get('id') : show;

        if (show_id) {
            let watchedEpisodes = await db.models.watch.findAll({
                raw: true,
                order: [['updatedAt', 'DESC']],
                where: {show_id, user_id}
            });

            if (watchedEpisodes.length) {
                let lastSeenEpisode = watchedEpisodes[0];

                if (lastSeenEpisode.finished === 0)
                    result = {
                        episode_id: lastSeenEpisode.episode_id,
                        position: lastSeenEpisode.position,
                        found: true
                    };

                else {
                    let moreEpisodes = await show.getEpisodes({where: {episode_id: {[Op.gt]: lastSeenEpisode.episode_id}}});
                    if (moreEpisodes.length) {
                        lastSeenEpisode = moreEpisodes[0].get();
                        result = {
                            episode_id: lastSeenEpisode.episode_id,
                            position: 0,
                            found: true
                        };
                    }
                }
            }

            if (result === false && find) {
                let pilot = await show.getEpisodes({order: [['episode_id', 'ASC']]});
                await Entry.update({finished: 1}, {where: {show_id: show.get('id'), position: {[Op.gt]: 919}, user_id}});

                if (pilot.length)
                    result = {
                        episode_id: pilot[0].episode_id,
                        position: 0,
                        found: false
                    };
            }
        }

        return result;
    }

    /**
     * @desc provides nino player with the next video on cue to be played
     * @param user_id
     * @param info_id
     * @returns {Promise<{error: string}>}
     */
    async getUpNext(user_id, info_id) {
        let result = {error: "could not find a suitable suggestion"}
        info_id = `${info_id}`;
        let check = info_id.length > 8;
        if (check) {
            let movie = new Movie(info_id);
            result = await movie.upNext();

        } else if (info_id.charAt(0) === "x") {
            info_id = info_id.replace('x', '');
            let episodes = await Shuffle.findAll({where: {user_id}, raw: true});
            if (episodes[0].episode_id === parseInt(info_id) && episodes.length > 1){
                let show = new Show('00');
                let {name, overview, poster} = await show.getEpisode(episodes[1].episode_id);
                result = {name, overview, play: 'x' + episodes[1].episode_id, backdrop: poster};

                episodes.shift();

                await Shuffle.destroy({where: {user_id}});
                await Shuffle.bulkCreate(episodes);

            } else {
                let showClass = new Show('s' + episodes[0].tmdb_id);
                let show = await showClass.getRecommendations(true);
                show = show.recommendations.randomiseDB(1, 1, 1);

                if (show.length){
                    show = await this.getNextEpisode(user_id, show[0].tmdb_id);
                    let {name, overview, poster} = await showClass.getEpisode(show.episode_id);
                    result = {name, overview, play: 'e' + show.episode_id, backdrop: poster};
                }
            }

        } else {
            let episode = await db.models.episode.findOne({where: {episode_id: info_id}});
            let nextEpisode = await db.models.episode.findOne({
                where: {
                    episode_id: {[Op.gt]: info_id},
                    show_id: episode.get('show_id')
                }
            });

            if (nextEpisode !== null) {
                let show = new Show('00');
                let {name, overview, poster} = await show.getEpisode(nextEpisode.get('episode_id'));
                result = {name, overview, play: 'e' + nextEpisode.get('episode_id'), backdrop: poster};
            } else {
                let showClass = new Show(episode.get('show_id'));
                let show = await showClass.getRecommendations(true);
                show = show.recommendations.randomiseDB(1, 1, 1);

                if (show.length){
                    show = await this.getNextEpisode(user_id, show[0].tmdb_id);
                    let {name, overview, poster} = await showClass.getEpisode(show.episode_id);
                    result = {name, overview, play: 'e' + show.episode_id, backdrop: poster};
                }
            }
        }

        return result;
    }

    /**
     * @desc returns entries that the user has started watching but may not have finished so that they could do so
     * @param user_id
     * @returns {Promise<[]>}
     */
    async getContinue(user_id) {
        let movies = await Entry.findAll({
            order: [['updatedAt', 'DESC']],
            raw: true,
            where: {finished: {[Op.lt]: 1}, type: true, user_id},
            attributes: ['position', 'finished', 'movie_id', 'updatedAt'],
            include: [{model: db.models.movie, attributes: ['tmdb_id', 'backdrop', 'logo', 'name']}]
        });
        let shows = await Entry.findAll({
            order: [['updatedAt', 'DESC']],
            raw: true,
            where: {finished: {[Op.lt]: 2}, type: false, user_id},
            attributes: ['position', 'finished', 'show_id', 'updatedAt'],
            include: [{model: db.models.episode, attributes: ['season_id', 'episode']}, {
                model: db.models.show,
                attributes: ['name', 'tmdb_id', 'logo', 'backdrop']
            }]
        });
        let data = shows.uniqueID('show_id').concat(movies).sortKey('updatedAt', false).slice(0, 10);
        let response = [];
        for (let item of data) {
            if (item.hasOwnProperty('movie_id')) {
                let {overview} = await getDetails(1, item['movie.tmdb_id']);
                item = {
                    backdrop: item['movie.backdrop'],
                    logo: item['movie.logo'],
                    name: item['movie.name'],
                    overview,
                    position: item.position,
                    tmdb_id: item['movie.tmdb_id'],
                    type: 1
                };
                response.push(item);

            } else {
                let episode = await this.getNextEpisode(user_id, item['show.tmdb_id'], false);
                if (episode) {
                    let obj = await db.models.episode.findOne({where: {episode_id: episode.episode_id}});
                    obj = obj.get();
                    obj.tmdb_id = item['show.tmdb_id'];
                    let {poster, overview} = await getEpisodeInfo(obj, true);
                    poster = poster === undefined ? item['show.backdrop']: poster;
                    item = {
                        backdrop: poster,
                        logo: item['show.logo'],
                        name: item['show.name'],
                        overview,
                        position: episode.position,
                        tmdb_id: item['show.tmdb_id'],
                        type: 0
                    };
                    response.push(item);

                } else await Entry.update({finished: 2, position: 921}, {where: {show_id: item.show_id, user_id}});
            }
        }

        return response;
    }

    /**
     * @desc returns suggestion of movies/shows for "just for you"/admin download depending on forDownload
     * @param user_id
     * @param forDownload || optional
     * @returns {Promise<[]|{suggestion: *[], again: []}>}
     */
    async loadSuggestions(user_id, forDownload) {
        let movies = await db.models.watch.findAll({
            order: [['updatedAt', 'DESC']],
            raw: true,
            where: {type: true, user_id},
            attributes: ['movie_id', 'finished'],
            include: [{model: db.models.movie, attributes: ['tmdb_id']}]
        });

        let shows = await db.models.watch.findAll({
            order: [['updatedAt', 'DESC']],
            raw: true,
            where: {type: false, user_id},
            attributes: ['show_id', 'finished'],
            include: [{model: db.models.show, attributes: ['tmdb_id']}]
        });

        let rating = await db.models.rating.findAll({
            raw: true,
            where: {user_id},
            attributes: ['tmdb_id', 'rate', 'type']
        });

        let listings = await db.models.list.findAll({
            raw: true,
            where: {user_id},
            attributes: ['tmdb_id', 'type']
        });

        let data = shows.uniqueID('show_id').concat(movies);
        forDownload = forDownload || false;
        let response = forDownload ? [].expand(await trending(10), 20) : [];
        let end = forDownload ? 5 : 1;

        for (let item of rating) {
            item.rate = item.rate > 5 || item.rate === 5 ? item.rate > 5 ? item.rate: 1 : (item.rate - 10);
            if (item.type === 1) {
                let temp = await pageTwo(1, item.tmdb_id, [], 1, end, true);
                response = response.expand(temp, item.rate * 2);
            } else {
                let temp = await pageTwo(0, item.tmdb_id, [], 1, end, true);
                response = response.expand(temp, item.rate * 2);
            }
        }

        for (let item of listings)
            if (item.type === 1) {
                let temp = await pageTwo(1, item.tmdb_id, [], 1, end, true);
                response = response.expand(temp, 20);
            } else {
                let temp = await pageTwo(0, item.tmdb_id, [], 1, end, true);
                response = response.expand(temp, 20);
            }

        for (let item of data)
            if (item.hasOwnProperty('movie_id')) {
                let temp = await pageTwo(1, item['movie.tmdb_id'], [], 1, end, true);
                response = response.expand(temp, 0);
            } else {
                let temp = await pageTwo(0, item['show.tmdb_id'], [], 1, end, true);
                response = response.expand(temp, 0);
            }

        let dBase = (await this.getLibrary(true, false)).concat(await this.getLibrary(false, false));
        if (forDownload) {
            let holder = [];
            for (const file of response)
                if (dBase.find(item => item.tmdb_id === file.tmdb_id && item.type === file.type) === undefined)
                    holder.push(file);

            return holder.sortKey('rep', false);

        } else {
            let moviesBase = response.filter(item => item.type === 1 && item.rep > 4).reduite(dBase, 1, 'rep');
            let showsBase = response.filter(item => item.type === 0 && item.rep > 2).reduite(dBase, 0, 'rep');

            response = [];
            let holder = [];
            for (const file of moviesBase)
                if ((movies.find(item => item['movie.tmdb_id'] === file.tmdb_id) === undefined) && (rating.find(item => item.tmdb_id === file.tmdb_id && item.rate < 4 && item.type === 1) === undefined))
                    response.push(file);
                else if ((movies.find(item => item['movie.tmdb_id'] === file.tmdb_id && item.finished === 1)) && (rating.find(item => item.tmdb_id === file.tmdb_id && item.rate < 4 && item.type === 1) === undefined))
                    holder.push(file);

            for (const file of showsBase)
                if ((shows.find(item => item['show.tmdb_id'] === file.tmdb_id) === undefined) && (rating.find(item => item.tmdb_id === file.tmdb_id && item.rate < 4 && item.type === 0) === undefined))
                    response.push(file);
                else if ((shows.find(item => item['show.tmdb_id'] === file.tmdb_id && item.finished === 2)) && (rating.find(item => item.tmdb_id === file.tmdb_id && item.rate < 4 && item.type === 0) === undefined))
                    holder.push(file);

            return {suggestion: response.sortKey('rep', false), again: holder.sortKey('rep', false)};
        }
    }
}

class Views extends Watched {
    /**
     * @desc returns the location to the auth provided, useful for playback
     * @param auth
     * @returns {Promise<{user_id: unknown, location: unknown, type: unknown}|{error: string}>}
     */
    async getLocation(auth) {
        let result = await ViewsDb.findOne({where: {auth}});
        return result ? {
            location: result.get('location'),
            type: result.get('type'),
            user_id: result.get('user_id')
        } : {error: 'No such item exists'};
    }

    /**
     * @desc gets the metadata for the metatags, used by
     * @param auth
     * @returns {Promise<{error: string}>}
     */
    async getAuthTags(auth) {
        let response = {error: 'No such item exists'};
        let result = await ViewsDb.findOne({where: {auth}});
        if (result) {
            let type = result.get('type');
            if (type) {
                let movie = await db.models.movie.findOne({where: {gid: result.get('location')}});
                if (movie) {

                    let {overview} = await getDetails(1, movie.get('tmdb_id'));
                    let {name, poster} = movie.get();
                    response = {overview, name, poster};
                }
            } else {
                let episode = await db.models.episode.findOne({
                    where: {gid: result.get('location')},
                    include: [{model: db.models.show, attributes: ['tmdb_id', 'name']}]
                });

                if (episode) {
                    let video = {...episode.get(), ...episode.show.get()};
                    let obj = await getEpisodeInfo(video, false);
                    response = {
                        name: obj.found ? `S${video.season_id}, E${video.episode}: ${obj.name}` : video.name + ": S" + video.season_id + ", E" + video.episode,
                        overview: obj.overview, poster: obj.poster
                    }
                }
            }
        }

        return response;
    }

    /**
     * @desc returns the necessary id to resume playback, useful for when a user shares a link
     * @param auth
     * @returns {Promise<string|{error: string}>}
     */
    async getID(auth) {
        let response = {error: 'No such item exists'};
        let result = await ViewsDb.findOne({where: {auth}});
        if (result) {
            let type = result.get('type');
            response = type ? await db.models.movie.findOne({where: {gid: result.get('location')}}) : await db.models.episode.findOne({where: {gid: result.get('location')}});
            response = type ? 'm' + response.get('tmdb_id') : 'e' + response.get('episode_id');
        }

        return response;
    }

    /**
     * @desc adds new entry to the database on user scan and upload
     * @param obj
     * @returns {Promise<*>}
     */
    async setView(obj) {
        let cond = {auth: obj.auth, user_id: obj.user_id}
        return await insert(ViewsDb, obj, cond);
    }

    /**
     * @desc prepares and loads up the relevant information for nino player
     * @param user_id
     * @param info_id
     * @returns {Promise<{error: string}|{next: number, overview: *, backdrop: *, episodeName: string, name: *, logo: *, location: string, type: number}|boolean|{next, overview, backdrop, name, logo, location, type: number}>}
     */
    async playVideo(user_id, info_id) {
        let result = await super.playVideo(user_id, info_id);

        if (result) {
            let obj = {
                auth: create_UUID(),
                type: result.type,
                location: result.location,
                user_id
            }

            result.shuffleMode = /x/.test(`${result.next}`);
            result.type === 1 ? obj.movie_id = result.next : obj.episode_id = `${result.next}`.replace('x', '');
            await this.setView(obj);
            result.location = obj.auth;
        }

        return result;
    }

    /**
     * @desc modifies an entry as user watches and informs the server of their position
     * @param user_id
     * @param position
     * @param auth
     * @returns {Promise<boolean>}
     */
    async informDB(user_id, position, auth) {
        let result = false;
        let authC = await ViewsDb.findOne({where: {auth}});
        if (authC) {
            let user = await db.models.user.findOne({where: {user_id}});
            if (user) {
                let entry = authC.get('type') ? await authC.getMovie() : await authC.getEpisode();
                if (entry) {
                    let obj = {
                        auth, user_id, position, type: authC.get('type'), finished: position >= 920 ? 1 : 0,
                        watched_id: '' + user.get('id') + (authC.get('type') ? entry.get('movie_id') : entry.get('episode_id'))
                    }

                    if (!authC.get('type')) {
                        obj.show_id = entry.get('show_id');
                        obj.episode_id = entry.get('episode_id');
                    } else
                        obj.movie_id = entry.get('movie_id');

                    let cond = {watched_id: obj.watched_id, user_id};
                    await insert(Entry, obj, cond)
                    result = true;
                }
            }
        }
        return result;
    }

    /**
     * @desc gets the auth for specific file
     * @param auth
     * @returns {Promise<{error: string}>}
     */
    async getSubs(auth) {
        let result = {error: 'no such entry exists on database'}
        let authC = await ViewsDb.findOne({where: {auth}});
        if (authC) {
            let entry = authC.get('type') ? await authC.getMovie() : await authC.getEpisode();
            if (entry) {
                result = {};
                entry = entry.get();
                if (entry.eng !== null && entry.eng !== '')
                    result.eng = 'watch/subs/' + auth + '/eng';
                if (entry.fre !== null && entry.fre !== '')
                    result.fre = 'watch/subs/' + auth + '/fre';
                if (entry.ger !== null && entry.ger !== '')
                    result.ger = 'watch/subs/' + auth + '/ger';
            }
        }
        return result;
    }

    /**
     * @desc gets a subtitle for an entry during playback
     * @param auth
     * @param language
     * @returns {Promise<{error: string}>}
     */
    async getSub(auth, language) {
        let result = {error: 'no such entry exists on database'}
        let authC = await ViewsDb.findOne({where: {auth}});
        if (authC) {
            let entry = authC.get('type') ? await authC.getMovie() : await authC.getEpisode();
            result = entry.get(language) === null || entry.get(language) === '' ? result : entry.get(language);
        }
        return result;
    }

    /**
     * @desc returns the continue details for a single entry, speeds up load time, ran after a video has been seen
     * @param user_id
     * @param auth
     * @returns {Promise<{error: string}>}
     */
    async getEntryContinue(user_id, auth) {
        let result = {error: 'no such entry exists on database'}
        let entry = await db.models.watch.findOne({where: {auth, user_id}});

        if (entry === null) {
            let authC = await ViewsDb.findOne({where: {auth}});
            if (authC) {
                let temp = authC.get('type') ? await authC.getMovie() : await authC.getEpisode();
                if (temp) {
                    temp = authC.get('type') ? temp.get('movie_id') : temp.get('episode_id');
                    temp = authC.get('type') ? {movie_id: temp, user_id} : {episode_id: temp, user_id};
                    entry = await db.models.watch.findOne({where: temp});
                }
            }
        }

        if (entry) {
            if (entry.get('type') && entry.get('finished') === 0) {
                result = await entry.getMovie();
                let {overview} = await getDetails(1, result.get('tmdb_id'));
                let {backdrop, logo, type, name, tmdb_id} = result.get();
                result = {backdrop, logo, type, name, overview, tmdb_id, position: entry.get('position')}

            } else if (!entry.get('type')) {
                let {logo, type, name, tmdb_id, backdrop} = (await entry.getShow()).get();
                let episode = await this.getNextEpisode(user_id, tmdb_id, false);
                if (episode) {
                    let obj = await db.models.episode.findOne({where: {episode_id: episode.episode_id}});
                    obj = obj.get();
                    obj.tmdb_id = tmdb_id;
                    let {poster, overview} = await getEpisodeInfo(obj, true);
                    poster = poster === undefined ? backdrop: poster;
                    result = {backdrop: poster, logo, type, name, overview, tmdb_id, position: episode.position};
                } else result = {done: 's' + tmdb_id};

            } else if (entry.get('type'))
                result = {done: 'm' + (await entry.getMovie()).get('tmdb_id')};
        }
        return result;
    }

    /**
     * @desc gets the name and location of an entry. Useful for the stream logic
     * @param auth
     * @returns {Promise<{error: string}|{name: string, id: string}>}
     */
    async getNameAndLocation(auth) {
        let result = {error: 'no such entry exists on database'}
        let authC = await ViewsDb.findOne({where: {auth}});
        if (authC) {
            let entry = authC.get('type') ? await authC.getMovie() : await authC.getEpisode();
            if (entry) {
                if (authC.get('type'))
                    result = {name: entry.get('name'), id: entry.get('gid')}

                else {
                    let show = await entry.getShow();
                    if (show) {
                        entry = entry.get();
                        entry.tmdb_id = show.get('tmdb_id');
                        let {name} = await getEpisodeInfo(entry, false);
                        name = show.get('name') + ' S' + entry.season_id + '. E' + entry.episode + '. ' + name;
                        result = {name, id: entry.gid};
                    }
                }
            }

        }
        return result;
    }
}

module.exports = Views;
