const mysql = require('mysql');
let {getLogger} = require("../base/baseFunctions")
const {Sequelize, DataTypes: type, Op} = require('sequelize');
const {host, user, password, database, port} = require('../config/nino.json').database;
const db = new Sequelize(database, user, password, {host, dialect: 'mysql', logging: getLogger()});
const connection = mysql.createConnection({host, user, password, database, port});
connection.connect(err => {
    if (err) throw err;
});

/**
 * @dec adds object to the database using its schema 'type'
 * @param type
 * @param object
 * @param cond helps to verify that the object doesn't already exist; if it does it updates the object instead of inserting it
 * @returns {Promise<*>}
 */
const insert = async (type, object, cond) => {
    const found = await type.findOne({where: cond});
    if (!found) {
        return await type.create(object)
            .then(response => {
                return {item: response.get(), process: "created"}
            })
            .catch(error => {
                return {error: error}
            });

    } else {
        return await type.update(object, {where: cond})
            .then(async () => {
                return {item: (await type.findOne({where: cond})).get(), process: "updated"}
            })
            .catch(error => {
                return {error: error}
            });
    }
}

/**
 * @desc allows me to make native sql requests to the database
 * @param limit
 * @param table
 * @returns {Promise<[]>}
 */
const queryDB = async (limit, table) => {
    return new Promise(resolve => {
        let sql = `SELECT ${limit} FROM ${table}`;
        connection.query(sql, (err, res) => {
            if (err) {
                resolve(false);
                console.error(err);
            } else
                resolve(res);
        });
    });
}

/**
 * @desc allows me to make native sql requests to the database checking if an element exists
 * @param table
 * @param cond
 * @param val
 * @returns {Promise<[]>}
 */
const exists = async (table, cond, val) => {
    return new Promise(resolve => {
        let sql = `SELECT * FROM ${table} WHERE ${cond} = "${val}"`;
        connection.query(sql, (err, res) => {
            if (err) {
                resolve(false);
                console.error(err);
            } else resolve(res.length > 0);
        });
    });
}

/**
 * @desc inserts into an object into a database table
 * @param table
 * @param cond
 * @param val
 * @param obj
 * @returns {Promise<boolean>}
 */
const insertDB = async (table, cond, val, obj) => {
    return new Promise(async resolve => {
        let check = await exists(table, cond, val);
        if (!check) {
            connection.query(`INSERT INTO ${table} SET ?`, obj, (err, res) => {
                if (err) {
                    resolve(false);
                    console.error(err);
                } else resolve(true);
            });
        }
    });
}

/**
 * @desc updates an entry on a table in the database
 * @param obj
 * @param cond
 * @param table
 * @returns {Promise<boolean>}
 */
const updateDB = async (obj, cond, table) => {
    return new Promise(resolve => {
        const needle = obj.cond;
        delete obj.cond
        let sql = `UPDATE nino.${table} SET ? WHERE ${cond} = ?`;
        connection.query(sql, [obj, needle], (err) => {
            if (err) {
                console.error(err);
                resolve(false);
            } else resolve(true);
        });
    });
}

/**
 * @desc inserts / object an entry to a table in the database
 * @param table
 * @param cond
 * @param val
 * @param obj
 * @returns {Promise<boolean>}
 */
const update = async (table, cond, val, obj) => {
    return new Promise(async resolve => {
        let check = await exists(table, cond, val);
        if (check) {
            queryDB(cond, `${table} WHERE ${cond} = ${val}`)
                .then(info => {
                    info = info[0];
                    obj.cond = info[cond];
                    return obj;
                }).then(data => updateDB(data, cond, table))
                .then(result => resolve(result))
                .catch(err => {
                    console.error(err)
                });

        } else
            resolve(await insertDB(table, cond, val, obj));
    });
}

/**
 * @desc makes a REGEXP search for value on database name
 * @param searchValue
 * @returns {Promise<[]>}
 */
const search = async searchValue => {
    let val = "ORDER BY name ASC;";
    let id = "shows WHERE name REGEXP '" + searchValue + "' UNION ALL SELECT name, poster, tmdb_id, type FROM movies WHERE name REGEXP '" + searchValue + "' " + val;
    return await queryDB("name, poster, tmdb_id, type", id);
}

module.exports = {Sequelize, db, type, insert, Op, search, update, insertDB, queryDB};