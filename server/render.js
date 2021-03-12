const {getPersonInfo, getProdDetails} = require("../base/tmdb-hook");

const ejsHandler = async (req, res, file) => {
    let obj; let result = {};
    let link = req.protocol + '://' + req.get('Host');
    let overview = "Stream movies & TV shows directly to you from Roy Ossai's Private Server";
    if (file === undefined){
        const SpringBoard = require('../classes/springBoard')
        let regex = /(?<type>\w+)=(?<value>[^*]+)/;
        if (req.url === '/')
            obj = {type: 'def', value: 'nino'};

        else {
            let matches = req.url.match(regex);
            obj = matches && matches.groups ? {type: matches.groups.type, value: matches.groups.value}: {type: 'def', value: 'nino'};
        }

        file = !!req.session.file ? req.session.file : !!req.session.user_id ? 'index' : 'auth';
        if (req.session.file)
            delete req.session.file;

        let spring = new SpringBoard();
        obj.value = obj.value.replace(/\+/g, " ").replace(/\?.*clid[^"]+/, "");

        if (obj.type === "movie" || obj.type === "show" || obj.type === "watch" || obj.type === "iframe") {
            result = await spring.getMetaTags(obj.type, obj.value);

        } else if (obj.type === 'person') {
            let {name} = await getPersonInfo(obj.value, await spring.getSearch());
            result.name = name;

        } else if (obj.type === "prod")
            result.name = await getProdDetails(obj.value, [], true);

        let fields = ['name', 'overview', 'poster', 'link'];
        let values = ['nino', overview, link+'/images/meta', link + req.url];

        fields.forEach((value, index) => {
            result[value] = result[value] === undefined ? values[index]: result[value];
        });

        obj = result;

    } else
        obj = {overview, name: 'nino', poster: link + '/images/meta', link: link + req.url};

    res.render(file, obj);
}

module.exports = ejsHandler;