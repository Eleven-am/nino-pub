const express = require('express')
const {Auth, User} = require("../../classes/auths");
const {admin_mail} = require('../../config/nino.json')
const router = express.Router()
let auth = new Auth();
let user = new User();

router.post(/\/(login|register)/, async (req, res) => {
    let response = req.url === '/login' ? await user.validateUser(req.body.user, req.body.pass) : await user.register(req.body.user, req.body.pass, req.body.auth);
    if (!response.hasOwnProperty('error')) {
        req.session.user_id = response.user_id;
        response = await auth.generateApp_id(response.user_id);

        if (!response.hasOwnProperty('error')) {
            response = {status: req.url === '/login' ? 'logged in' : 'account created', app_id: response};
            await res.json(response);

        } else
            await res.status(400).json(response.error);

    } else
        await res.status(400).json(response.error);
})

router.post('/authenticateApp_id', async (req, res) => {
    let app_id = req.body.auth;
    let response = await auth.validateApp_id(app_id);
    if (response.hasOwnProperty('user'))
        req.session.user_id = response.user;

    response = response.hasOwnProperty('user') ? true : response.error;
    await res.json(response);
})

router.post('/confirmEmail', async (req, res) => {
    let response = await user.findUser({email: req.body.email});
    response = !response.hasOwnProperty('error');
    await res.json(response);
})

router.get('/generateKey', async (req, res) => {
    let response = 'Please authenticate';
    let admin = await user.findUser({email: admin_mail})
    if (req.session.user_id === admin.user_id)
        response = await auth.generateAuth(admin.user_id);
    await res.json(response);
})

router.get('/guest', async (req, res) => {
    let response = await user.logAsGuest();
    if (!response.hasOwnProperty('error')) {
        req.session.user_id = response.user_id;
        response = {app_id: await auth.generateApp_id(response.user_id), status: 'logged in as guest'};
        await res.json(response);

    } else
        await res.status(400).json(response.error);
})

router.get("/logout", (req, res) => {
    let check = !!req.session.user_id;
    if (check) {
        delete req.session.user_id;
        res.json(true);
    } else res.status(400).json("Query not permitted on this route");
})

router.post('/validateAuthKey', async (req, res) => {
    auth = new Auth();
    let response = await auth.validate(req.body.auth);
    await res.json(response);
})

router.get("/verify", (req, res) => {
    let check = !!req.session.user_id;
    res.json(check);
})

module.exports = router;