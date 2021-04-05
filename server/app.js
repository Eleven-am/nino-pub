const init = require('../system/initialise');
let {logger} = require('../config/nino.json');
const port = process.env.PORT || 5000;

(async function () {

    let initialised = await init(logger);
    const app = require('./express')(initialised);
    const render = require('./render');

    if (!initialised.hasOwnProperty('file')) {
        const {User} = require("../classes/auths");
        const user = new User();

        app.use('/auth', require('./routes/auth'));
        app.use('/info', require('./routes/info'));
        app.use('/images', require('./routes/images'));
        app.use('/iframe', require('./routes/iframe'));
        app.use('/load', require('./routes/load'));
        app.use('/stream', require('./routes/stream'));
        app.use('/update', require('./routes/update'));
        app.use('/watch', require('./routes/watch'));
        app.get(/iframe=/, async (req, res) => {
            req.session.file = !!req.session.user_id && !await user.loggedInsGuest(req.session.user_id) ? 'index' : 'iframe';
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

    app.listen(port,() => console.log("listening on port: " + 5000));
})()

