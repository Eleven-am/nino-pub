const express = require('express')
const router = express.Router()
const got = require('got')
const SpringBoard = require('../../classes/springBoard')
const {log: ln} = require("../../base/baseFunctions")
const {search} = require("../../base/sqlize")
const {getPersonInfo, getProdDetails} = require("../../base/tmdb-hook");
const log = (line, info) => ln(line, 'info', info);
let spring = new SpringBoard();

router.get('/url/:type/:name', async (req, res) => {
    let name = req.params.name;
    let pref = req.params.type === "movie" ? "m" : "s";
    let entry = await spring.findEntry(pref + name);
    if (entry.hasOwnProperty('error'))
        await res.status(400).json(entry.error);

    else {
        let response = pref + entry.tmdb_id;
        await res.json(response);
    }
})

router.get('/search/:value', async (req, res) => {
    await res.json(await search(req.params.value));
})

router.get("/episodes/:id/:season", async (req, res) => {
    let response = req.session.user_id ? await spring.getEpisodes('s' + req.params.id, req.params.season, req.session.user_id) : false;
    if (response.hasOwnProperty('error') || !response) {
        response = !response ? "Query not permitted on this route" : response.error;
        await res.status(400).json(response);
    } else
        await res.json(response);
})

router.get("/myList/:id", async (req, res) => {
    let response = req.session.user_id ? await spring.setList(req.params.id, req.session.user_id) : false;
    if (response.hasOwnProperty('error') || !response) {
        response = !response ? "Query not permitted on this route" : response.error;
        await res.status(400).json(response);
    } else
        await res.json(response);
})

router.get('/person/:id', async (req, res) => {
    let response = await getPersonInfo(req.params.id, await spring.getSearch());
    await res.json(response);
})

router.get('/prod/:id', async (req, res) => {
    let response = await getProdDetails(req.params.id, await spring.getSearch())
    await res.json(response);
})

router.get("/rate/:id/:rate", async (req, res) => {
    let response = req.session.user_id ? await spring.rateEntry(req.params.id, req.session.user_id, req.params.rate) : false;
    if (response.hasOwnProperty('error') || !response) {
        response = !response ? "Query not permitted on this route" : response.error;
        await res.status(400).json(response);
    } else
        await res.json(response.item.rate);
})

router.get("/watch/:uuid", async (req, res) => {
    let response = await spring.getID(req.params.uuid);
    if (response.hasOwnProperty('error'))
        await res.status(400).json(response.error);
    else
        await res.json(response);
})

router.get("/:id", async (req, res) => {
    let response = req.session.user_id ? await spring.getInfo(req.params.id, req.session.user_id) : false;
    if (response.hasOwnProperty('error') || !response) {
        response = !response ? "Query not permitted on this route" : response.error;
        await res.status(400).json(response);
    } else
        await res.json(response);
})

module.exports = router;