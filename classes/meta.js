const {db, type} = require('../base/sqlize')
const {log: ln, sFetch} = require('../base/baseFunctions.js');
const log = (line, info) => ln(line, 'meta', info);

const Entry = db.define('client', {
    isp: {
        type: type.STRING,
        allowNull: false
    }, region: {
        type: type.STRING,
        allowNull: false
    }, country: {
        type: type.STRING,
        allowNull: false
    }, city: {
        type: type.STRING,
        allowNull: false
    }, alias: {
        type: type.STRING,
        allowNull: false
    }, request: {
        type: type.STRING,
        allowNull: false
    }, addr: {
        type: type.STRING,
        allowNull: false
    }
})

Entry.sync().catch(err => console.log(err));

class Client {
    async logIp(obj) {
        let {addr, request} = obj;
        let country, region, city, isp, alias;
        let client = await Entry.findOne({where: {request, addr}});
        if (!addr.includes('::') && !addr.includes("127.0.0.1") && !request.includes('load/') && !addr.includes('192.168')) {
            if (client === null) {
                client = await Entry.findOne({where: {addr}});
                if (client) {
                    client = client.get();
                    country = client.country;
                    region = client.region;
                    city = client.city;
                    isp = client.isp;
                    alias = client.alias;

                } else {
                    client = await sFetch('http://ip-api.com/json/' + addr);
                    country = client.country;
                    region = client.regionName;
                    city = client.city;
                    isp = client.isp;
                    alias = client.as;

                }
                client = {isp, region, country, city, alias, request, addr};
                await Entry.create(client);
            }
        }
    }

    getClientIp (req) {
        let request = req.protocol + '://' + req.get('Host') + req.url;
        let addr = req.headers['x-real-ip'] || (req.headers["X-Forwarded-For"] ||
            req.headers["x-forwarded-for"] ||
            '').split(',')[0] ||
            req.client.remoteAddress || req.ip;
        return {addr, request}
    }
}

const Backdrop = db.define('backdrop', {
    gid: {type: type.STRING, allowNull: false},
    name: {type: type.STRING, allowNull: false},
    size: {type: type.STRING, allowNull: false},
    mimeType: {type: type.STRING, allowNull: false}
})

Backdrop.sync().catch(err => console.log(err));

/**
 * @desc returns a random entry from the backdrop table // assuming all is correct, this should be an id to a google drive publicly shared image, this serves as a backup meta tag image for when one isn't possible
 * @returns {Promise<any|{error: string}>}
 */
const getMetaImages = async () => {
    let result = await Backdrop.findAll({order: db.literal('RAND()')});
    return result.length ? result[0].get() : {error: 'no meta images exists yet'};
}

module.exports = {getMetaImages, Client};