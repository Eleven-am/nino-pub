const express = require('express')
const router = express.Router()
const Iframe = require("../../classes/iframe");
const DriveHandler = require('../../classes/driveHandler');
const SpringBoard = require("../../classes/springBoard");
const {create_UUID} = require("../../base/baseFunctions");
const {User} = require("../../classes/auths");

const spring = new SpringBoard();
const drive = new DriveHandler();
const iframe = new Iframe();
const user = new User();

router.post('/inform', async (req, res) => {
    await res.json(await iframe.updatePosition({...req.body, ...{identifier: req.session.identifier}}, req));
})

router.get('/decrypt/:cypher', async (req, res) => {
    let response;
    req.session.identifier = (req.session.user_id === undefined || await user.loggedInsGuest(req.session.user_id)) && req.session.identifier === undefined ? create_UUID() : req.session.identifier;
    if (req.session.identifier === undefined) {
        response = await iframe.decrypt(req.params.cypher, await spring.getSearch(), req.session.user_id);
        if (!response.hasOwnProperty('error')){
            await iframe.updateUser(req.session.user_id, response.location);
            response.guest = false;
            delete response.trailers;
        }

    } else
        response = await iframe.decypher(req.params.cypher, await spring.getSearch(), req.session.identifier)

    if (response.hasOwnProperty('error'))
        await res.status(400).json(response);
    else
        await res.json(response);
})

router.get('/modify/:auth/:position', async (req, res) => {
    let response = await iframe.updateFrame(req.params.auth, req.params.position);
    if (response.hasOwnProperty('error'))
        await res.status(400).json(response.error);
    else
        await res.json(response);
})

router.get('/:auth/:position', async (req, res) => {
    let response = {error: 'You may not have permission to perform this action'};
    let position = req.params.position === 'NaN'? 0: req.params.position;
    if (!!req.session.user_id){
        let check = await user.loggedInsGuest(req.session.user_id);
        if (!check)
            response = await iframe.createIFrame(req.params.auth, req.session.user_id, position)
    }

    if (response.hasOwnProperty('error'))
        await res.status(400).json(response);
    else
        await res.json({link:  'https://' + req.get('Host') + '/iframe=' + response.cypher, validated: response.cypher});
})

router.get('/:auth', async (req, res) => {
    let response = await spring.getLocation(req.params.auth);
    const range = req.headers.range;
    if (response.hasOwnProperty('error')) {
        response = response.error;
        await res.status(400).json(response);
    } else if (req.headers.range)
        await drive.streamFile(response.location, res, range);
})

module.exports = router;

