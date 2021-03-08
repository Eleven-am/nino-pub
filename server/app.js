const init = require('../system/initialise');

(async function () {

    let initialised = await init(false);
    if (initialised === true || !initialised.info.includes('database')) {
        const app = require('./express');
        const render = require('./render');
        const {User} = require("../classes/auths");

        if (initialised) {
            app.use('/auth', require('./routes/auth'));
            app.use('/info', require('./routes/info'));
            app.use('/images', require('./routes/images'));
            app.use('/iframe', require('./routes/iframe'));
            app.use('/load', require('./routes/load'));
            app.use('/stream', require('./routes/stream'));
            app.use('/update', require('./routes/update'));
            app.use('/watch', require('./routes/watch'));
            app.get(/iframe=/, async (req, res) => {
                const user = new User();
                req.session.file = !!req.session.user_id && !await user.loggedInsGuest(req.session.user_id) ? 'index': 'iframe';
                await render(req, res)
            })

            app.get(/=/, async (req, res) => {
                await render(req, res)
            })

            app.get('/', async (req, res) => {
                await render(req, res)
            })

        } else {
            app.use('/setup', require('./routes/setup'));
            app.get(/^((?!setup).)*$/, async (req, res) => {
                await render(req, res, 'setup')
            })
        }

        app.listen(5000, "127.0.0.1", () => console.log("listening on port: http://localhost:" + 5000));

    } else
        throw new Error('Database not configured correctly');
})()

