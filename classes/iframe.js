const Views = require("./watched");
const {pageTwo} = require("../base/tmdb-hook");
const {User} = require("./auths");
const {db, type, insert} = require('../base/sqlize')
const {generateKey, log: ln, sFetch} = require('../base/baseFunctions.js');
const log = (line, info) => ln(line, 'users', info);

const Entry = db.define('frame', {
    cypher: {
        type: type.STRING,
        allowNull: false,
    }, auth: {
        type: type.STRING,
        reference: {
            model: db.models.view,
            key: 'auth',
        }
    }, position: {
        type: type.INTEGER,
        allowNull: false
    }, accessed: {
        type: type.INTEGER,
        allowNull: false
    }, user_id: {
        type: type.UUID,
        reference: {
            model: db.models.user,
            key: 'user_id',
        }
    }
});

const Id = db.define('frameIds', {
    identifier: {
        type: type.UUID,
        allowNull: false,
    }, position: {
        type: type.INTEGER,
        allowNull: false
    },  addr: {
        type: type.STRING,
        allowNull: false
    }, client: {
        type: type.STRING,
        allowNull: false
    }, cypher: {
        type: type.STRING,
        reference: {
            model: Entry,
            key: 'cypher',
        }
    }
});

Entry.sync().then(() => {
    db.models.user.frame = db.models.user.hasMany(Entry, {foreignKey: 'user_id', sourceKey: 'user_id'});
    Entry.user = Entry.belongsTo(db.models.user, {foreignKey: 'user_id', targetKey: 'user_id'});

    db.models.view.frame = db.models.view.hasMany(Entry, {foreignKey: 'auth', sourceKey: 'auth'});
    Entry.view = Entry.belongsTo(db.models.view, {foreignKey: 'auth', targetKey: 'auth'});
}).catch(err => console.error(err))

Id.sync().then(() => {
    Entry.frameId = Entry.hasMany(Id, {foreignKey: 'cypher', sourceKey: 'cypher'});
    Id.frame = Id.belongsTo(Entry, {foreignKey: 'cypher', targetKey: 'cypher'});
}).catch(err => console.error(err))

const views = new Views();
const user = new User();
class Iframe {
    /**
     * @desc creates an iframe entity on user request
     * @param auth
     * @param user_id
     * @param position
     * @returns {Promise<*>}
     */
    async createIFrame(auth, user_id, position) {
        let temp = {auth, user_id, position, accessed: 0, cypher: generateKey(1, 12)}
        temp = await insert(Entry, temp, {position, auth})
        if (temp.hasOwnProperty('error'))
            return temp.error
        else return temp.item;
    }

    /**
     * @desc preps the iframe for playback
     * @param cypher
     * @param database !!*
     * @param user_id
     * @returns {Promise<{error: string}>}
     */
    async decrypt(cypher, database, user_id) {
        user_id = user_id || false;
        let result = {error: 'no such entry on the database'};
        let temp = await Entry.findOne({where: {cypher}});
        if (temp !== null) {
            let info_id = await views.getID(temp.get('auth'));
            let cond = user_id ? {user_id} : {email: 'guest@maix.ovh'};
            let usr = await user.findUser(cond);
            if (!user.hasOwnProperty('error') && !info_id.hasOwnProperty('error')) {
                let info = await views.playVideo(usr.user_id, info_id);
                info_id = parseInt(info_id.replace(/[me]/, ''));
                info_id = await db.models.view.findOne({where: {auth: info.location}});
                if (info.type === 0){
                    info_id = await info_id.getEpisode();
                    info_id = await info_id.getShow();
                } else
                    info_id = await info_id.getMovie();

                info_id = info_id.get('tmdb_id');
                let recommendations = await pageTwo(info.type, info_id, database, 1, 2);
                recommendations = recommendations.length ? recommendations : database;
                recommendations = recommendations.randomiseDB(2, 1, 3);

                let trailers = [];
                for (let item of recommendations){
                    if (item.type === 1){
                        let temp = await db.models.movie.findOne({where: {tmdb_id: item.tmdb_id}});
                        trailers.push(temp.get('trailer'));
                    } else {
                        let temp = await db.models.show.findOne({where: {tmdb_id: item.tmdb_id}});
                        trailers.push(temp.get('trailer'));
                    }
                }

                info.trailers = trailers
                info.position = user_id && temp.position === 0 ? info.position : temp.position;
                result = info;

                temp.accessed = temp.get('accessed') + 1;
                await temp.save();
            }
        }
        return result
    }

    /**
     * @desc loads the meta tags for the ejs renderer
     * @param value
     * @returns {Promise<{error: string}>}
     */
    async getAuthTags(value) {
        let result = {error: 'No such item exists'};
        let temp = await db.models.frame.findOne({where: {cypher: value}});
        if (temp !== null)
            result = await views.getAuthTags(temp.get('auth'));
        return result;
    }

    /**
     * @desc modifies the position on a cypher
     * @param cypher
     * @param position
     * @returns {Promise<{error: string}>}
     */
    async updateFrame(cypher, position){
        let result = {error: 'no such entry on the database'};
        let temp = await Entry.findOne({where: {cypher}});
        if (temp !== null) {
            temp.position = position;
            await temp.save();
            result = 'success';
        }
        return result
    }

    /**
     * @desc modifies the user accessing the frame, necessary for ninoPlayer authentication logic
     * @param user_id
     * @param auth
     * @returns {Promise<{error: string}>}
     */
    async updateUser(user_id, auth) {
        let result = {error: 'no such entry on the database'};
        let temp = await db.models.view.findOne({where: {auth}});
        if (temp !== null){
            temp.user_id = user_id;
            await temp.save();
            result = true;
        }
        return result;
    }

    /**
     * @desc loads an iframe from either the point the iframe was saved || guest has watched to
     * @param cypher
     * @param database
     * @param identifier
     * @returns {Promise<{error: string}>}
     */
    async decypher(cypher, database, identifier) {
        identifier = identifier || false;
        let crypt = await this.decrypt(cypher, database);
        if (!crypt.hasOwnProperty('error') && identifier){
            let view = await Id.findOne({where: {cypher, identifier}})
            crypt.position = view && crypt.position === 0 ? view.position : crypt.position;
            delete crypt.next;
        }

        return crypt;
    }

    /**
     * @desc stores the watch position for a guest user
     * @param obj
     * @param req
     * @returns {Promise<boolean>}
     */
    async updatePosition(obj, req) {
        let client;
        let {cypher, identifier} = obj;
        let addr = req.headers['x-real-ip'] ? req.headers['x-real-ip']: req.ip;
        let check = await Id.findOne({where: {identifier}})

        if (!addr.includes("127.0.0.1") && !addr.includes('192.168')) {
            if ((check && check.addr !== addr) || check === null){
                client = await sFetch('http://ip-api.com/json/' + addr);
                client = `${client.city}, ${client.regionName}, ${client.country}`;

            } else if (check && check.addr === addr)
                client = check.client;

        } else if (addr.includes("127.0.0.1") || addr.includes('192.168'))
            client = 'localhost';

        obj = {...obj, ...{client, addr}};
        let info = await insert(Id, obj, {cypher, identifier})
        return info.hasOwnProperty('item');
    }
}

module.exports = Iframe