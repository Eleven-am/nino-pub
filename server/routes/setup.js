const {google} = require('googleapis')
const express = require('express')
const router = express.Router()
const mysql = require('mysql2')
const credentials = require('../../config/credentials.json')
let {log} = require('../../base/baseFunctions')
const logFile = "setup";

const {client_secret, client_id, redirect_uris} = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
const scopes = ['https://www.googleapis.com/auth/drive'];

const getToken = async () => {
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
}

const testConnection = config => {
    return new Promise((resolve) => {
        const {host, user, password, database, port} = config;
        const connection = mysql.createConnection({host, user, password, database, port});
        connection.connect(err => {
            if (err) {
                connection.destroy();
                resolve(false);
            } else {
                connection.destroy();
                resolve(true);
            }
        })
    })
}

const genToken = async code => {
    return new Promise((resolve, reject) => {
        oAuth2Client.getToken(code, (err, token) => {
            if (err) reject(err);
            else resolve(token);
        })
    });
}

router.post('/auth/:type', async (req, res) => {
    let token = req.params.type;
    log(30, logFile, token) //login to home base
    await res.json(true);
})

router.post('test/db', async (req, res) => {
    let response = await testConnection(req.body);
    await res.json(response);
})

router.get('/getToken', async (req, res) => {
    let response = await getToken();
    await res.json(response);
})

router.get('/gen/:token', async (req, res) => {
    let token = req.params.token;
    let response = await genToken(token);
    await res.json(response);
})

module.exports = router;