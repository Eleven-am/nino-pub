const express = require('express')
const router = express.Router()
const got = require('got')
const SpringBoard = require('../../classes/springBoard')
const {log: ln} = require("../../base/baseFunctions")
const srt2vtt = require('srt-to-vtt')
const log = (line, info) => ln(line, 'info', info);
let spring = new SpringBoard();

router.get("/:id", async (req, res) => {
    let response = req.session.user_id ? await spring.playVideo(req.session.user_id, req.params.id) : false;
    await res.json(response);
})

router.get("/upNext/:id", async (req, res) => {
    let response = req.session.user_id ? await spring.getUpNext(req.session.user_id, req.params.id) : false;
    await res.json(response);
})

router.get('/subs/:auth', async (req, res) => {
    let response = await spring.getSubs(req.params.auth);
    if (response.hasOwnProperty('error'))
        await res.status(400).json(response.error);
    else
        await res.json(response);
})

router.get('/subs/:auth/:language', async (req, res) => {
    let response = await spring.getSub(req.params.auth, req.params.language);
    if (response.hasOwnProperty('error'))
        await res.status(400).json(response.error);
    else {
        res.setHeader("Content-Type", 'text/vtt');
        got.stream(response).pipe(srt2vtt()).pipe(res);
    }
})

router.get("/inform/:position/:auth", async (req, res) => {
    let response = req.session.user_id ? await spring.informDB(req.session.user_id, req.params.position, req.params.auth) : false;
    await res.json(response);
})

router.get('/loadContinue/:auth', async (req, res) => {
    let response = req.session.user_id ? await spring.getEntryContinue(req.session.user_id, req.params.auth) : false;
    if (response.hasOwnProperty('error')) {
        response = !response ? "Query not permitted on this route" : response.error;
        await res.status(400).json(response);
    } else
        await res.json(response);
})

module.exports = router;