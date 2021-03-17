const fs = require('fs')
const path = require('path')
const {admin_mail, cypher} = require('../config/nino.json')
let {log: ln, change, pFetch} = require("../base/baseFunctions")
const mysql = require('mysql2');

/**
 * @desc verifies that the file requested exists
 * @param item
 * @returns {Promise<Boolean>}
 */
const exists = async item => {
    return new Promise((resolve) => {
        fs.access(item, (err) => {
            if (!err)
                resolve(true);
            else
                resolve(false);
        });
    });
}

const makeCONN = async obj => {
    return new Promise(resolve => {
        const {host, user, password, database, port} = obj;
        const connection =  mysql.createConnection({host, port, user, password});
        connection.query(
            `CREATE DATABASE IF NOT EXISTS ${database};`,
            function(err, fields) {
                if (err)
                    resolve(false)
                else
                    resolve(true)
            }
        );
    })
}

const init = async logger => {
    change(logger);
    const log = (line, info) => ln(line, "initialise.js", info)

    log(31, 'starting');
    log(32, 'getting and processing config files');
    let config = await exists(path.join(__dirname, '../config'));
    let credentials = await exists(path.join(__dirname, '../config/credentials.json'));
    let nino = await exists(path.join(__dirname, '../config/nino.json'));
    let structure = await exists(path.join(__dirname, '../config/structure.json'));

    let check, check2, check3, check4;
    check = check2 = check3 = check4 = false;

    if (config && credentials && nino && structure) {
        credentials = require('../config/credentials.json');
        nino = require('../config/nino.json');
        structure = require('../config/structure.json');

        if (nino.hasOwnProperty('cypher')) {
            log(59, "verifying cypher with motherShip");
            check = await pFetch('https://nino-homebase.herokuapp.com/auth/validateCypher', JSON.stringify({username: admin_mail, cypher}));
            check = check === true;
            log(62, "motherShip verification " + (check ? "successful": "failed"))
        }

        if (nino.hasOwnProperty('database')) {
            log(44, 'building MySQL environment');
            const obj = require('../config/nino.json').database;
            check2 = await makeCONN(obj);
            if (check2)
                log(61, 'MySQL runtime environment generated');
            else
                log(63, 'database verification failed');
        }

        log(66, 'verifying google credentials');
        if (credentials.hasOwnProperty('installed')) {
            credentials = credentials.installed;
            let fields = ["client_id", "project_id", "auth_uri", "token_uri", "auth_provider_x509_cert_url", "client_secret", "redirect_uris"];
            check3 = fields.every(field => {
                return field in credentials;
            });
        }

        log(75, 'verified google credentials');
        log(76, 'verifying homepage structure');
        if (structure.hasOwnProperty('primary') && structure.hasOwnProperty('user')) {
            structure = {...structure.user, ...structure.primary};
            let fields = ["myList", "seen", "suggestion", "continue", "maix", "editor0", "mov", 'tv', "editor1", "added", "trending"]
            check4 = fields.every(field => {
                return field in structure;
            });

            for (let item in structure) {
                fields = ["type", "container", "category", "list", "position", "next", "block"]
                if (item !== 'myList') {
                    let object = structure[item];
                    let check = fields.every(field => {
                        return field in object;
                    });

                    if (check) {
                        if (!((object.type === 'basic' || object.type === 'cont' || object.type === 'editors') && (object.position === 'beforebegin' || object.position === 'afterbegin' || object.position === 'beforeend' || object.position === 'afterend'))) {
                            check4 = false;
                            log(95, 'homepage structure verification failed on ' + item);
                            break;
                        }

                    } else {
                        check4 = false;
                        log(101, 'homepage structure verification failed on ' + item);
                        break;
                    }
                }
            }

            if (check4)
                log(107, 'homepage verification successful')
        }

    } else
        log(111, 'unable to verify config files');

    let temp = '';
    let info = '';
    info += check ? '' : " cypher";
    info += check2 ? '' : " database";
    info += check3 ? '' : " credentials";
    info += check4 ? '' : " structure";

    let file = info === '' ? 'def' : 'setup';
    let files = info.split(' ')

    for (let i = 1; i < files.length -1; i++)
        if (i !== files.length -2)
            temp += files[i]+', ';
        else
            temp += files[i]+' and ';

    temp += files[files.length -1]
    check && check2 && check3 && check4 ? console.log(113, 'initialise.js', 'initialisation successful') : console.log(109, 'initialise.js', 'verification failed on '+temp+'; redirecting to setup for more action')
    return info === '' ? true : {file, info};
}


module.exports = init;