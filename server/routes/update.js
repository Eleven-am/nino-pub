const express = require('express')
const {User} = require("../../classes/auths");
const {admin_mail} = require('../../config/nino.json')
const router = express.Router();
const Update = require("../../classes/update");
const {getDetails} = require("../../base/tmdb-hook");
const {takeFive} = require("../../base/baseFunctions");
const user = new User();
const update = new Update();

/*router.get('/suggest', async (req, res) => {
    let response = 'Please authenticate';
    let admin = await user.findUser({email: admin_mail})
    if (req.session.user_id === admin.user_id) {
        await res.json('processing');
        await update.getMagnets(admin.user_id);
    } else await res.json(response);
})*/

router.get('/checkSub', (req, res) => {
    res.json(update.checkSub())
})

router.get('/getLists', async (req, res) => {
    await res.json(await update.getLists());
})

router.get("/scan/:type", async (req, res) => {
    let response = await update.findEntry(req.params.type);
    await res.json(response);
})

router.get('/forceScan/:cond', async (req, res) => {
    let response = 'Please authenticate';
    let val = req.params.cond === 'true';
    if (await user.checkAuthorisedUser(req.session.user_id)){
        await res.json(val ? 'rescanning all the subtitles in the entire library' : 'finding and updating the subtitles');
        await update.scanSubs(val);
        await update.getBackdrops();
    } else await res.json(response);
})

/*router.get('/seasonScan/:cond', async (req, res) => {
    let response = 'Please authenticate';
    let val = req.params.cond === 'true';
    let admin = await user.findUser({email: admin_mail})
    if (req.session.user_id === admin.user_id) {
        await res.json('getting ' + (val ? 'episodes' : 'new seasons and episodes') + ' for shows on the library');
        await update.getBackdrops();
        await update.getNextSeason(val);
    } else await res.json(response);
})*/

router.get('/itemSuggestion/:tmdb_id', async (req, res) => {
    let response = await update.jsonRec(req.params.tmdb_id);
    await res.json(response);
})

/*router.get('/magnet/reset/:id', async (req, res) => {
    req.session.data = await update.displayMagnets(req.params.id);
    await res.json(true);
})*/

router.get('/magnet/showSuggestion', (req, res) => {
    let data = takeFive(req.session.data, 20);
    req.session.data = data.left;
    res.json(data.result);
})

/*router.get('/magnet/opened/:id', async (req, res) => {
    let response = update.inform(req.params.id);
    await res.json(response);
})*/

/*router.get('/magnet/:info_id', async (req, res) => {
    let response = await update.getTMdbMagnet(req.params.info_id);
    if (response.hasOwnProperty('url')) {
        await update.downloadTorrent(response.url)
        response = 'downloading';
    }
    await res.json(response);
})*/

router.post("/item", async (req, res) => {
    let response = await update.updateEntry(req.body);
    await res.json(response);
})

router.get('/notPresent/:info_id', async (req, res) => {
    let response = await update.confirm(req.params.info_id);
    await res.json(response);
})

router.get("/search/:type/:name", async (req, res) => {
    let response = await update.searchTMDB(req.params.type, req.params.name);
    await res.json(response);
})

router.get("/art/:type/:tmdb_id", async (req, res) => {
    let response = await update.interpretImages(req.params.type, req.params.tmdb_id);
    await res.json(response);
})

router.get('/delete/:id/:type', async (req, res) => {
    let response = await update.delete(req.params.id, req.params.type);
    await res.json(response);
})

router.get('/get/:type/:tmdb_id', async (req, res) => {
    let type = req.params.type === 'movie' ? 1 : 0;
    let tmdb_id = req.params.tmdb_id;
    let {overview, id, name, title} = await getDetails(type, tmdb_id);
    name = type === 1 ? title : name;
    let response = {overview, id, name};
    await res.json(response);
})

router.post("/category", async (req, res) => {
    let response = await update.addList(req.body.name, req.body.blob, req.body.display, req.body.selected);
    await res.json(response);
})

router.get("/database/:bool", async (req, res) => {
    let response = 'Please authenticate';
    let bool = req.params.bool === 'true';
    await update.autoScan();
    if (await user.checkAuthorisedUser(req.session.user_id))
        response = await update.scanEpisodes(bool);

    await res.json(response);
})

router.get('/:file', async (req, res) => {
    if (await user.checkAuthorisedUser(req.session.user_id) && req.params.file !== 'auth')
        req.session.file = req.params.file;
    res.redirect('/');
})

router.get('/', async (req, res) => {
    if (await user.checkAuthorisedUser(req.session.user_id))
        req.session.file = 'update';
    res.redirect('/');
})

module.exports = router;