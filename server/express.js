const express = require('express')
const app = express()
const path = require("path")
const compression = require('compression')
const cors = require('cors')

module.exports = initialised => {
    if (initialised === true || !initialised.info.includes('database')){
        const {Client} = require("../classes/meta")
        const client = new Client();

        const logIP = async (req, res, next) => {
            let addr = req.headers['x-real-ip'] ? req.headers['x-real-ip']: req.ip;
            let request = 'https://' + req.get('Host') + req.url;
            await client.logIp(addr, request);
            next();
        }
        const options = require('../config/nino.json').database;
        const session = require('express-session')
        const MySQLStore = require('express-mysql-session')(session)
        const sessionStore = new MySQLStore(options);
        app.use(logIP);
        app.use(session({key: 'nino-player', secret: '44707518-7552-4c65-b7b7-dce7ec64ef80', store: sessionStore, resave: false, saveUninitialized: false}));

    }

    app.use(express.json());
    app.use(compression());
    app.use(cors());
    app.use(express.urlencoded({extended: false}));
    app.use(express.static(path.join(__dirname, 'public')));
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    return app;
}
























//module.exports = app;

