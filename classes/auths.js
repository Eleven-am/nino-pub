const {db, type, insert} = require('../base/sqlize')
const adminMail = require('../config/nino.json').admin_mail
const adminPass = require('../config/nino.json').admin_pass
const {create_UUID, generateKey, log: ln} = require('../base/baseFunctions.js');
const bCrypt = require('bcrypt');
const log = (line, info) => ln(line, 'users', info);

const Client = db.define('user', {
    email: {
        type: type.STRING,
        allowNull: false,
        validate: {
            isEmail: emailVal => {
                const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (!re.test(emailVal))
                    throw new Error('Email is not valid');
            }
        }
    }, password: {
        type: type.STRING,
        allowNull: false
    }, user_id: {
        type: type.UUID,
        allowNull: false
    }, app_id: {
        type: type.STRING,
        allowNull: false
    }
});

const Key = db.define('key', {
    auth_key: {
        type: type.STRING,
        allowNull: false
    }, user_id: {
        type: type.STRING,
    }, exhausted: {
        type: type.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'auth'
})

const App = db.define('app_id', {
    app_id: {
        type: type.STRING,
        allowNull: false
    }, valid: {
        type: type.DATE,
        allowNull: false
    }, user_id: {
        type: type.UUID,
        reference: {
            model: db.models.user,
            key: 'user_id',
        }
    }
})

App.sync().then(() => {
    db.models.user.app_id = db.models.user.hasMany(App, {foreignKey: 'user_id', sourceKey: 'user_id'});
    App.user = App.belongsTo(db.models.user, {foreignKey: 'user_id', targetKey: 'user_id'});
})

Client.sync().then(async () => {
    await Key.sync()
}).catch(err => console.error(err));

/**
 * @desc returns the images for the auth page
 * @returns {Promise<[]>}
 */
const loadImages = async () => {
    let movies = await db.models.movie.findAll({
        order: db.literal('RAND()'),
        raw: true,
        attributes: ['poster', 'tmdb_id']
    })
    let shows = await db.models.show.findAll({
        order: db.literal('RAND()'),
        raw: true,
        attributes: ['poster', 'tmdb_id']
    })

    movies = movies.concat(shows).randomiseDB(10, 0, 3);
    movies = movies.map(item => {
        return item.poster;
    })

    return movies;
}

class App_id {
    /**
     * @desc adds new entry to the database on user scan and upload
     * @param user_id
     * @param app_id
     * @returns {Promise<*|*>}
     */
    static async #insertToDb(user_id, app_id) {
        let response = {success: 'done'};
        let valid = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
        valid = new Date(valid);

        if (user_id === undefined)
            response = {error: 'User must be defined'};
        if (app_id === undefined)
            response = {error: 'app_id must be defined'};

        let app = {user_id, app_id, valid};
        await App.create(app);
        return response
    }

    /**
     * @desc assumes user provides an app_id if not it creates one
     * @returns {*|string}
     * @param user_id
     */
    async generateApp_id(user_id) {
        let app_id = generateKey(5, 5);
        let response = await App_id.#insertToDb(user_id, app_id);
        return response.hasOwnProperty('success') ? app_id : response;
    }

    /**
     * @desc confirms that an app_id is still valid
     * @param app_id
     * @returns {Promise<{user: string}|{error: string}>}
     */
    async validateApp_id(app_id) {
        let result;
        result = await App.findOne({where: {app_id}});
        if (result) {
            result = result.get();
            result = result.valid > new Date() ? {user: result.user_id} : {error: 'app_id has expired'};

        } else result = {error: 'no such app_id exists'};

        return result;
    }
}

class Auth extends App_id {
    /**
     * @desc generates an auth key and adds it to the database
     * @params user_id
     * @returns {*|string}
     */
    async generateAuth(user_id) {
        let auth = generateKey();
        await this.addToDB(auth, 0, user_id);
        return auth;
    }

    /**
     * @desc verifies that the auth key exists and is valid
     * @returns {Promise<{error: string}|boolean|{error: string}>}
     */
    async validate(auth) {
        let result;
        if (auth === adminPass)
            result = true;
        else {
            let key = await Key.findOne({where: {auth_key: auth}});
            if (key) {
                result = key.exhausted === 0 ? true : {error: "This key has already been used"};
            } else result = {error: "This key does not exist"};
        }
        return result !== true ? result.error : true;
    }

    /**
     * @desc adds new entry to the database on user scan and upload
     * @param auth
     * @param condition determines if the auth key is exhausted or not,
     * @param user_id
     * @returns {Promise<*|*>}
     */
    async addToDB(auth, condition, user_id) {
        condition = condition || 0;
        if (auth === adminPass)
            auth = generateKey();

        let object = {auth_key: auth, exhausted: condition, user_id};
        let cond = {auth_key: auth};
        return await insert(Key, object, cond);
    }
}

class User {
    /**
     * @desc inserts a user to the database
     * @param email
     * @param password
     * @param authKey
     * @returns {Promise<{error: string}|*|{error: string}|{error}|{error: string}>}
     */
    async register(email, password, authKey) {
        password = await bCrypt.hash(password, 10);
        let auth = new Auth();
        let response = await auth.validate(authKey);
        if (response === true || authKey === 'admin') {
            let object = {email, password, user_id: create_UUID(), app_id: generateKey(5, 5)};
            if (authKey === 'admin')
                authKey = await auth.generateAuth(object.user_id);

            let cond = {email};
            const found = await Client.findOne({where: cond});
            response = found ? {error: 'A user with this email already exists'} : (await insert(Client, object, cond)).item;
            if (!response.hasOwnProperty('error')) await auth.addToDB(authKey, 1, object.user_id);
        }
        return response;
    }

    /**
     * @desc finds a user based on the objects sent
     * @returns {Promise<*|{error: string}>}
     * @param obj
     */
    async findUser(obj) {
        const found = await Client.findOne({where: obj});
        return found ? found.get() : {error: 'User does not exist'};
    }

    /**
     * @desc verifies that user exists and that their password is correct
     * @param email
     * @param password
     * @returns {Promise<{error: string}|*|{error: string}|{error}|{error: string}>}
     */
    async validateUser(email, password) {
        let user = await this.findUser({email});
        if (!user.hasOwnProperty('error')) {
            if (await bCrypt.compare(password, user.password))
                return user;
            else return {error: 'Password incorrect'};
        } else return user;
    }

    /**
     * @desc Clears the guest session and logs the client in as guest from ground zero
     * @returns {Promise<*|{error: string}>}
     */
    async logAsGuest() {
        let user = await this.findUser({email: 'guest@maix.ovh'});
        if (!user.hasOwnProperty('error')) {
            await db.models.watch.destroy({where: {user_id: user.user_id}});
            await db.models.list.destroy({where: {user_id: user.user_id}});
            await db.models.seen.destroy({where: {user_id: user.user_id}});
            await db.models.suggestion.destroy({where: {user_id: user.user_id}});
            await db.models.rating.destroy({where: {user_id: user.user_id}});

        }
        return user;
    }

    /**
     * @desc checks if current user is guest user
     * @param user_id
     * @returns {Promise<boolean>}
     */
    async loggedInsGuest(user_id) {
        let user = await this.findUser({email: 'guest@maix.ovh'});
        if (!user.hasOwnProperty('error'))
            return user.user_id === user_id;
        else return false;
    }

    /**
     * @desc creates admin user independently
     * @returns {Promise<boolean>}
     */
    async createAdmin() {
        let one, two, three, check;
        one = check = await this.findUser({email: adminMail})
        if (check.hasOwnProperty('error')) {
            let user = await this.register(adminMail, adminPass, 'admin');
            log(268, user);
        }

        two = check = await this.findUser({email: 'guest@maix.ovh'})
        if (check.hasOwnProperty('error')) {
            let guest = await this.register('guest@maix.ovh', 'password', 'admin')
            log(268, guest);
        }

        three = check = await this.findUser({email: 'maix@homebase.ovh'})
        if (check.hasOwnProperty('error')) {
            let guest = await this.register('maix@homebase.ovh', 'password', 'admin')
            log(268, guest);
        }

        return one.hasOwnProperty('error') && two.hasOwnProperty('error') && three.hasOwnProperty('error');
    }

    /**
     * @desc checks if an authorised user is connected
     * @param user_id
     * @returns {Promise<boolean>}
     */
    async checkAuthorisedUser(user_id) {
        let response = false
        if (user_id) {
            let user = await this.findUser({user_id});
            if (!user.hasOwnProperty('error'))
                response = user.email === adminMail || user.email === 'maix@homebase.ovh';
        }
        return response;
    }
}

module.exports = {Auth, User, loadImages};