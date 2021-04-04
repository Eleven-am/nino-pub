const express = require('express')
const router = express.Router()
const sharp = require('sharp')
const {getMetaImages} = require("../../classes/meta");
const SpringBoard = require('../../classes/springBoard')
const got = require('got')

router.get('/drive/:id', async (req, res) => {
    got.stream(`https://drive.google.com/uc?export=view&id=${req.params.id}`).pipe(res)
        .catch(error => console.log(error));
})

router.get('/:location/:info_id', async (req, res) => {
    let spring = new SpringBoard();
    let height = 1080;
    switch (req.params.location) {
        case 'search':
            height = 100;
            break;
        case 'basic':
            height = 500;
            break;
    }

    let info = await spring.findEntry(req.params.info_id, true)
    if (!info.hasOwnProperty('error')) {
        info = info.poster.replace('images/drive/', 'https://drive.google.com/uc?export=view&id=');

        if (req.params.location === 'auth')
            got.stream(info).pipe(res).catch(error => console.log(error));

        else {
            let transformer = sharp().resize({height});
            got.stream(info).pipe(transformer).pipe(res).catch(error => console.log(error));;
        }

    } else
        await res.status(400).json(info.error);
})

router.get('/meta', async (req, res) => {
    let response = await getMetaImages();
    if (!response.hasOwnProperty('error'))
        got.stream(`https://drive.google.com/uc?export=view&id=${response.gid}`).pipe(res)
            .catch(error => console.log(error));
    else
        res.status(400).json(response.error);
})


module.exports = router;