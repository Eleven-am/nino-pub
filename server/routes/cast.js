const express = require('express')
const router = express.Router()
const Chromecast = require("../../classes/chromeCast")
const cast = new Chromecast();

router.get('/images', async (req, res) => {
    let response = await cast.loadImages();
    await res.json(response)
})

router.get('/:auth', async (req, res) => {
    let link = 'https://' + req.get('Host') + '/';
    let response = await cast.intercept(req.params.auth, link);
    await res.json(response)
})

module.exports = router;