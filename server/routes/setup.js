const fs = require('fs');
const path = require('path')
const {promisify} = require('util')
const writeFile = promisify(fs.writeFile);
const {google} = require('googleapis')
const express = require('express')
const router = express.Router()
const mysql = require('mysql2')
const credentials = require('../../config/credentials.json')
let {log, sFetch} = require('../../base/baseFunctions')
const logFile = "setup";

const {client_secret, client_id, redirect_uris} = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
const scopes = ['https://www.googleapis.com/auth/drive', "https://www.googleapis.com/auth/drive.readonly"];

const getToken = async int => {
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [scopes[int]],
    });
}

const testTmdb = async apiKey => {
    let info = await sFetch('https://api.themoviedb.org/3/movie/530915?api_key=' + apiKey + "&language=en-US")
    return !info.hasOwnProperty('headers');
}

const testConnection = config => {
    return new Promise((resolve) => {
        const {host, user, password, database, port} = config;
        console.log(host, user, password, database, port);
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
    return new Promise((resolve) => {
        oAuth2Client.getToken(code, (err, token) => {
            if (err) resolve(false);
            else {
                oAuth2Client.setCredentials(token);
                resolve(token);
            }
        })
    });
}

const createFolder = async (name, drive) => {
    const fileMetadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    let res = await drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    })

    return res.data.id;
}

const moveElement = async (element, folder_id, drive) => {
    let file = await drive.files.get({
        fileId: element,
        fields: 'parents'
    });

    let parent = file.data.parents.join(',');
    if (parent !== folder_id) {
        file = await drive.files.update({
            fileId: element,
            addParents: folder_id,
            removeParents: parent,
            fields: 'id, parents'
        })
    }
}

const exists = async (file_id, drive) => {
    let info = await drive.files.get({
        fileId: file_id,
        fields: "id, name, size, mimeType, contentHints/thumbnail, videoMediaMetadata, thumbnailLink, explicitlyTrashed"
    })

    return info.hasOwnProperty('data') && info.data.hasOwnProperty('mimeType') && info.data.mimeType === 'application/vnd.google-apps.folder';
}

router.post('/auth/:type', async (req, res) => {
    let token = req.params.type;
    log(30, logFile, token) //login to home base
    await res.json(true);
})

router.post('/testDB', async (req, res) => {
    let response = await testConnection(req.body);
    await res.json(response);
})

router.post('/testTmdb', async (req, res) => {
    let response = await testTmdb(req.body.apiKey);
    await res.json(response);
})

router.get('/getToken', async (req, res) => {
    let response = await getToken(0);
    await res.json(response);
})

router.get('/homeBase', async (req, res) => {
    let response = await getToken(1);
    await res.json(response);
})
router.post('/genToken', async (req, res) => {
    let token = req.body.token;
    let response = await genToken(token);
    await res.json(response);
})

router.get('/createFolders', async (req, res) => {
    let auth = oAuth2Client;
    const drive = google.drive({version: 'v3', auth});
    let nino = await createFolder('nino', drive);
    let movies = await createFolder('Movies', drive);
    let tvShows = await createFolder('TV Shows', drive);
    let backdrop = await createFolder('Backdrops', drive);

    await moveElement(movies, nino, drive)
    await moveElement(tvShows, nino, drive)
    await moveElement(backdrop, nino, drive)

    let response = {movies, tvShows, backdrop}
    await res.json(response)
})

router.post('/confirmFolders', async (req, res) => {
    let check = true
    let auth = oAuth2Client;
    const drive = google.drive({version: 'v3', auth});
    for (let item in req.body)
        check = await exists(req.body[item], drive);

    await res.json(check)
})

router.post('/config', async (req, res) => {
    let data = req.body;
    await writeFile(path.join(__dirname, '../../config/nino.json'), JSON.stringify(data))
})

module.exports = router;