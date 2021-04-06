const express = require('express')
const router = express.Router()
const DriveHandler = require('../../classes/driveHandler');
const SpringBoard = require("../../classes/springBoard");
const {Auth, User} = require("../../classes/auths");
let spring = new SpringBoard();
let drive = new DriveHandler();
let user = new User();

router.get('/:auth', async (req, res) => {
    let response = await spring.getLocation(req.params.auth);
    const range = req.headers.range;
    if (!response.hasOwnProperty('error'))
        if (range)
            await drive.streamFile(response.location, res, range);
        else
            await drive.rawDownload(response.location, 'videoFile', res, response.mimeType);

    else {
        response = !response ? "Query not permitted on this route" : response.error;
        await res.status(400).json(response);

    }
})

router.get('/:authKey/:auth', async (req, res) => {
    let response = "Query not permitted on this route";
    if (req.session.user_id) {
        let auth = new Auth();
        response = await auth.validate(req.params.authKey);
        if (response === true) {
            let info = await spring.getNameAndLocation(req.params.auth);
            if (info.hasOwnProperty('error'))
                await res.status(400).json(info.error);
            else {
                await auth.addToDB(req.params.authKey, 1, req.session.user_id);
                await drive.rawDownload(info.id, info.name, res);
            }
        } else await res.status(400).json(response);
    } else await res.status(400).json(response);
})

router.get('/hls/:folder/:file', async (req, res) => {
    await drive.hlsStream(req.params.file, req.params.folder, res)
})

module.exports = router;