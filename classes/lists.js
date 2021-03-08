const {getDetails} = require("../base/tmdb-hook")
const {log: ln} = require("../base/baseFunctions")
const {db, type, insert, Op} = require('../base/sqlize')
const log = (line, info) => ln(line, 'lists', info)

const List = db.define('list', {
    tmdb_id: {
        type: type.INTEGER,
        allowNull: false
    }, type: {
        type: type.BOOLEAN,
        defaultValue: false
    }, user_id: {
        type: type.UUID,
        reference: {
            model: db.models.user,
            key: 'user_id',
        }
    }, poster: {
        type: type.STRING,
        allowNull: false
    }
});

const EditorDb = db.define('editor', {
    name: {
        type: type.STRING,
        allowNull: false
    }, backdrop: {
        type: type.STRING,
        allowNull: false
    }, logo: {
        type: type.STRING
    }, trailer: {
        type: type.STRING
    }, tmdb_id: {
        type: type.INTEGER,
        allowNull: false
    }, type: {
        type: type.BOOLEAN,
        defaultValue: false
    }, category: {
        type: type.STRING,
        allowNull: false
    }, display: {
        type: type.STRING,
        allowNull: false
    }
});

const Rating = db.define('rating', {
    tmdb_id: {
        type: type.INTEGER,
        allowNull: false
    }, type: {
        type: type.BOOLEAN,
        defaultValue: false
    }, user_id: {
        type: type.UUID,
        reference: {
            model: db.models.user,
            key: 'user_id',
        }
    }, rate: {
        type: type.INTEGER,
        validate: {
            isValid(value) {
                if (!(0 <= parseInt(value) && parseInt(value) <= 10)) {
                    throw new Error('rate must be between 0 and 10');
                }
            }
        }
    }
});

const Seen = db.define('seen', {
    tmdb_id: {
        type: type.INTEGER,
        allowNull: false
    }, rep: {
        type: type.INTEGER,
        allowNull: false
    }, type: {
        type: type.BOOLEAN,
        defaultValue: false
    }, user_id: {
        type: type.UUID,
        reference: {
            model: db.models.user,
            key: 'user_id',
        }
    }
}, {
    tableName: 'seen'
});

const Suggestion = db.define('suggestion', {
    tmdb_id: {
        type: type.INTEGER,
        allowNull: false
    }, rep: {
        type: type.INTEGER,
        allowNull: false
    }, type: {
        type: type.BOOLEAN,
        defaultValue: false
    }, poster: {
        type: type.STRING,
        allowNull: false
    }, user_id: {
        type: type.UUID,
        reference: {
            model: db.models.user,
            key: 'user_id',
        }
    }
});

Suggestion.sync().then(() => {
    Suggestion.movie = Suggestion.belongsTo(db.models.movie, {
        foreignKey: 'tmdb_id',
        targetKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    Suggestion.show = Suggestion.belongsTo(db.models.show, {
        foreignKey: 'tmdb_id',
        targetKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.show.list = db.models.show.hasMany(Suggestion, {
        foreignKey: 'tmdb_id',
        sourceKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.movie.list = db.models.movie.hasMany(Suggestion, {
        foreignKey: 'tmdb_id',
        sourceKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.user.Suggestion = db.models.user.hasMany(Suggestion, {foreignKey: 'user_id', sourceKey: 'user_id'});
    Suggestion.user = Suggestion.belongsTo(db.models.user, {foreignKey: 'user_id', targetKey: 'user_id'});
})

Seen.sync().then(() => {
    Seen.movie = Seen.belongsTo(db.models.movie, {
        foreignKey: 'tmdb_id',
        targetKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    Seen.show = Seen.belongsTo(db.models.show, {
        foreignKey: 'tmdb_id',
        targetKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.show.list = db.models.show.hasMany(Seen, {
        foreignKey: 'tmdb_id',
        sourceKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.movie.list = db.models.movie.hasMany(Seen, {
        foreignKey: 'tmdb_id',
        sourceKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.user.Seen = db.models.user.hasMany(Seen, {foreignKey: 'user_id', sourceKey: 'user_id'});
    Seen.user = Seen.belongsTo(db.models.user, {foreignKey: 'user_id', targetKey: 'user_id'});
})

Rating.sync().then(() => {
    Rating.movie = Rating.belongsTo(db.models.movie, {
        foreignKey: 'tmdb_id',
        targetKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    Rating.show = Rating.belongsTo(db.models.show, {
        foreignKey: 'tmdb_id',
        targetKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.show.list = db.models.show.hasMany(Rating, {
        foreignKey: 'tmdb_id',
        sourceKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.movie.list = db.models.movie.hasMany(Rating, {
        foreignKey: 'tmdb_id',
        sourceKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.user.rating = db.models.user.hasMany(Rating, {foreignKey: 'user_id', sourceKey: 'user_id'});
    Rating.user = Rating.belongsTo(db.models.user, {foreignKey: 'user_id', targetKey: 'user_id'});
})

List.sync().then(() => {
    List.movie = List.belongsTo(db.models.movie, {
        foreignKey: 'tmdb_id',
        targetKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    List.show = List.belongsTo(db.models.show, {
        foreignKey: 'tmdb_id',
        targetKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.show.list = db.models.show.hasMany(List, {
        foreignKey: 'tmdb_id',
        sourceKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.movie.list = db.models.movie.hasMany(List, {
        foreignKey: 'tmdb_id',
        sourceKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.user.watched = db.models.user.hasMany(List, {foreignKey: 'user_id', sourceKey: 'user_id'});
    List.user = List.belongsTo(db.models.user, {foreignKey: 'user_id', targetKey: 'user_id'});
})

EditorDb.sync().then(() => {
    EditorDb.movie = EditorDb.belongsTo(db.models.movie, {
        foreignKey: 'tmdb_id',
        targetKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    EditorDb.show = EditorDb.belongsTo(db.models.show, {
        foreignKey: 'tmdb_id',
        targetKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.show.list = db.models.show.hasMany(EditorDb, {
        foreignKey: 'tmdb_id',
        sourceKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })

    db.models.movie.list = db.models.movie.hasMany(EditorDb, {
        foreignKey: 'tmdb_id',
        sourceKey: 'tmdb_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
});

const Picks = db.define('pick', {
    name: {
        type: type.STRING,
        allowNull: false
    }, index: {
        type: type.INTEGER,
        allowNull: false
    }
});

Picks.sync().catch(err => console.log(err))

class MyList {
    /**
     * @desc checks if an entry is present on a user's 'add to watch' list
     * @param user_id
     * @param info_id
     * @returns {Promise<boolean>}
     */
    async checkOnList(user_id, info_id) {
        let type = info_id.charAt(0) === "m";
        info_id = info_id.replace(/[ms]/, '');
        let confirm = await List.findOne({where: {type, tmdb_id: info_id, user_id}});
        return confirm !== null;
    }

    /**
     * @desc gets all items on a user's watch list
     * @param user_id
     * @returns {Promise<Model[]>}
     */
    async getList(user_id) {
        return await List.findAll({
            raw: true,
            where: {user_id},
            attributes: ['poster', 'type', 'tmdb_id'],
            order: [['updatedAt', 'DESC']]
        });
    }

    /**
     * @desc adds new entry to the database on user scan and upload
     * @returns {Promise<*|*>}
     * @param user_id
     * @param info_id
     */
    async addToMyList(user_id, info_id) {
        let type = info_id.charAt(0) === "m";
        info_id = info_id.replace(/[ms]/, '');
        let model = type ? db.models.movie : db.models.show;
        let poster = await model.findOne({where: {tmdb_id: info_id}});
        if (poster) {
            poster = poster.get('poster');
            let obj = {
                tmdb_id: info_id,
                type, poster, user_id
            }

            let cond = {tmdb_id: info_id, user_id};
            let check = await List.findOne({where: cond});
            check ? await List.destroy({where: cond}) : await insert(List, obj, cond);
            return check ? "removed" : "added";

        } else return {error: `no such ${type ? 'movie' : 'show'} exists on database`};
    }
}

class Editor {
    /**
     * @desc returns the editors pick by a given category
     * @param category
     * @returns {Promise<{error: string}>}
     */
    async getList(category) {
        let result = {error: 'no such editor category exists on database'};
        if (category !== 'maix') {
            let list = await EditorDb.findAll({
                where: {category},
                raw: true,
                attributes: ['name', 'backdrop', 'logo', 'trailer', 'tmdb_id', 'type', 'display']
            });
            if (list.length) {
                result = [];
                for (let item of list) {
                    let {overview} = await getDetails(item.type, item.tmdb_id);
                    item.overview = overview;
                    result.push(item);
                }
            }
        } else {
            let list = await EditorDb.findAll({
                where: {category},
                raw: true,
                attributes: ['tmdb_id', 'type'],
                order: [['id', 'ASC']],
                include: [{model: db.models.show, attributes: ['poster']},
                    {model: db.models.movie, attributes: ['poster']}]
            });

            result = list.map(item => {
                return {
                    type: item.type, tmdb_id: item.tmdb_id,
                    poster: item['show.poster'] === null ? item['movie.poster'] : item['show.poster']
                }
            })
        }
        return result;
    }

    async addItem(category, display, info_id) {
        let type = info_id.charAt(0) === "m";
        info_id = info_id.replace(/[ms]/, '');
        let model = type ? db.models.movie : db.models.show;
        let poster = await model.findOne({where: {tmdb_id: info_id}});
        if (poster) {
            let {name, backdrop, logo, trailer} = poster.get();
            let obj = {backdrop, category, display, logo, name, tmdb_id: info_id, type, trailer};
            let cond = {tmdb_id: info_id, category};
            return await insert(EditorDb, obj, cond);
        } else return {error: `no such ${type ? 'movie' : 'show'} exists on database`};
    }

    /**
     * @desc gets the specific editor pick requested
     * @param number
     * @returns {Promise<*>}
     */
    async getPick(number) {
        let info = await Picks.findAll({raw: true});
        info = info.find(item => item.index === parseInt(`${number}`));
        return info === undefined ? false : info.name;
    }

    /**
     * @desc checks if an entry exists on database
     * @param name
     * @returns {Promise<number>}
     */
    async pickExists(name) {
        let result = -1;
        let pick = await Picks.findOne({where: {name}});
        if (pick)
            result = pick.get('index');

        return result;
    }

    /**
     * @desc updates picks table
     * @param selected
     * @returns {Promise<void>}
     */
    async setPick(selected) {
        await Picks.destroy({where: {id: {[Op.gt]: 0}}});
        await Picks.bulkCreate(selected);
    }
}

module.exports = {MyList, Editor};