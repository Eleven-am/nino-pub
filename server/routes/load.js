const express = require('express')
const router = express.Router()
const SpringBoard = require('../../classes/springBoard')
const {loadImages} = require('../../classes/auths')
const {Editor} = require('../../classes/lists')
let structure = require('../../config/structure.json')
let running = {};
structure = {...structure.user, ...structure.primary};
let spring = new SpringBoard();
let editor = new Editor();

router.get('/:type', async (req, res) => {
    let response = false;
    if (req.session.user_id || req.params.type === "authImages" || req.params.type === "search") {
        response = structure.hasOwnProperty(req.params.type) ? structure[req.params.type] : undefined;
        let index = await editor.pickExists(req.params.type);
        if (response === undefined && index !== -1)
            response = structure['editor' + index];

        if (structure[req.params.type] !== undefined && structure[req.params.type].next !== false && structure[req.params.type].next.includes('editor'))
            response.next = await editor.getPick(response.next.replace('editor', ''));

        if (req.params.type === "added")
            response.data = await spring.getRecent();

        else if (req.params.type === "authImages")
            response = await loadImages();

        else if (req.params.type === "banner") {
            let result = await spring.getBanner();
            response = {data: result, next: "maix"}

        } else if (req.params.type === "continue")
            response.data = await spring.getContinue(req.session.user_id);

        else if (req.params.type === "mov")
            response.data = await spring.getLibrary(true, false);

        else if (req.params.type === "myList")
            response.data = await spring.getMyList(req.session.user_id);

        else if (req.params.type === "search")
            response = await spring.getSearch();

        else if (req.params.type === "seen")
            response.data = await spring.getSeen(req.session.user_id);

        else if (req.params.type === "suggestion")
            response.data = await spring.getSuggestion(req.session.user_id);

        else if (req.params.type === "trending")
            response.data = await spring.getTrending();

        else if (req.params.type === "tv")
            response.data = await spring.getLibrary(false, false);

        else {
            response.data = await spring.getList(req.params.type);
            response.category = response.category === 'display' || response.data.hasOwnProperty('error')? response.data.hasOwnProperty('error')?  response.data.error : response.data[0].display : response.category;
        }

    } await res.json(response);
    if (req.session.user_id && req.params.type === 'suggestion' && running[req.session.user_id] === undefined) {
        running[req.session.user_id] = true;
        let res = await spring.saveSuggestion(req.session.user_id);
        if (res)
            delete running[req.session.user_id];
    }
})


module.exports = router;