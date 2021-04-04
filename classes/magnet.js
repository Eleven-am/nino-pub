const rarBgApi = require('rarbg-api')
const SpringBoard = require("./springBoard")
const {sAxios, log, formatBytes, toBytes} = require("../base/baseFunctions")
const {getExternalId, getSeasonInfo, getDetails} = require("../base/tmdb-hook")
const {db, type, insert} = require('../base/sqlize')
const {deluge} = require('../config/nino.json')
let delugeHandler, folder = null;
const Torrent = require('torrent-search-api')
const DriveHandler = require("./driveHandler");
const providers = Torrent.getProviders()

if (require('../config/nino.json').deluge !== null) {
    const {deluge_url, directory, password} = require('../config/nino.json').deluge;
    folder = directory;
    delugeHandler = require('../base/deluge')(deluge_url, password);
}

for (let provider of providers)
    if (provider.public)
        Torrent.enableProvider(provider.name);

(async () => {
    await delugeHandler.getHosts(async (error, result) => {
        if (error)
            console.error(error);
        else {
            await delugeHandler.connect(result.id, (error, result) => {
                if (error)
                    console.error(error);
            });
        }
    });
})()

const Entry = db.define('magnet', {
    name: {
        type: type.STRING,
        allowNull: false
    }, type: {
        type: type.BOOLEAN,
        defaultValue: false
    }, rep: {
        type: type.INTEGER,
        allowNull: false
    }, viewed: {
        type: type.BOOLEAN,
        defaultValue: false
    }, poster: {
        type: type.STRING,
        allowNull: false
    }, tmdb_id: {
        type: type.INTEGER,
        allowNull: false
    }
});

Entry.sync().catch(err => console.error(err));

const options = {
    min_seeders: 5,
    category: rarBgApi.CATEGORY.TV_HD_EPISODES,
    format: 'json_extended',
    limit: 100,
    ranked: 0
}

class Magnet {
    /**
     * @desc [BETA] supposed to get the torrent links for movies that are not on the database but the user might love
     * @param user_id
     * @returns {Promise<void>}
     */
    async getMagnets(user_id) {
        let spring = new SpringBoard();
        let magnetEntries = await spring.loadSuggestions(user_id, true);
        magnetEntries = magnetEntries.map(show => {
            delete show.id;
            show.viewed = false;
            return show;
        });

        let originals = await Entry.findAll({where: {viewed: false}});

        for (let magnet of originals) {
            let model = magnet.get('type') ? db.models.movie : db.models.show;
            magnet.viewed = await model.findOne({where: {tmdb_id: magnet.tmdb_id}}) !== null;
            await insert(Entry, magnet, {tmdb_id: magnet.tmdb_id, type: magnet.type});
        }

        for (const magnet of magnetEntries)
            await insert(Entry, magnet, {tmdb_id: magnet.tmdb_id, type: magnet.type});
    }

    /**
     * @desc informs teh database that a certain entry is being downloaded
     * @param info_id
     * @returns {Promise<boolean>}
     */
    async inform(info_id) {
        let type = info_id.charAt(0) === "m";
        let result = false;
        let item = await Entry.findOne({where: {tmdb_id: info_id.replace(/[ms]/, ''), type}});
        if (item) {
            await item.update({viewed: true});
            result = true;

        }
        return result;
    }

    /**
     * @desc gets a movie's magnet link from YTS/RARBG/ALL other Providers;
     * @param info_id
     * @returns {Promise<string>}
     */
    async findMovie(info_id) {
        let string = '';
        let {imdb_id} = await getExternalId(info_id.replace(/[ms]/, ''), 1);
        let {release_date} = await getDetails(1, info_id.replace(/[ms]/, ''));
        release_date = new Date(release_date).getFullYear();
        if (imdb_id !== undefined) {
            let url = 'https://yts.mx/api/v2/list_movies.json?query_term=' + imdb_id;
            let prefix = 'magnet:?xt=urn:btih:';
            let trackers = '&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337';
            let details = await sAxios(url);
            string = 'failed to get magnet';
            if (details.data !== undefined && details.data.movies !== undefined) {
                let {title_long, torrents} = details.data.movies[0];
                if (torrents !== undefined && torrents.length > 1)
                    torrents = torrents.filter(file => file.quality === '1080p');

                if (torrents !== undefined && torrents.length > 1)
                    torrents = torrents.filter(file => file.type === 'bluray');

                if (torrents !== undefined && torrents[0] !== undefined) {
                    let {quality, hash} = torrents[0];
                    let name = `${title_long} [${quality}] [YTS.MX]`;
                    name = encodeURI(name).replace(/%20/g, '+');
                    name = name.replace(/\(/g, '%28').replace(/\)/g, '%29');
                    string = prefix + hash + '&dn=' + name + trackers;
                    string = {url: string, size: torrents[0].size};
                }
            }
        }

        if (string === 'failed to get magnet') {
            let movies = options;
            let tmdb_id = parseInt(info_id.replace(/[ms]/, ''));
            movies.category = rarBgApi.CATEGORY.MOVIES_X264_1080P;
            let response = await new Promise(resolve => {
                setTimeout(() => resolve([]), 30000)

                rarBgApi.search(imdb_id, movies, 'imdb')
                    .then(data => resolve(data))
                    .catch(err => {
                        if (err === 'Cant find imdb in database. Are you sure this imdb exists?')
                            return rarBgApi.search(tmdb_id, options, 'themoviedb')
                                .then(data => resolve(data))
                                .catch(err => console.error(err));
                    });
            })

            if (response.length) {
                response = response[0];
                string = {url: response.download, size: formatBytes(response.size)}

            } else {
                let {title} = await getDetails(1, tmdb_id)
                response = await Torrent.search(title);
                let resolve = []
                for (let item of response) {
                    let regex = /[sS]\d{2}.*?[eE]\d{2}|[sS]eason|[sS]\d{2}|[sS]eries/
                    let matches = item.title.match(/(?<year>\d{4})/);
                    if (matches !== null && parseInt(matches.groups.year) === release_date && regex.test(item.title) === false)
                        resolve.push(item)
                }

                if (resolve.length) {
                    response = resolve[0];
                    string = {url: await Torrent.getMagnet(response), size: response.size}
                }
            }
        }

        return string;
    }

    /**
     * @desc downloads a torrent file by it's magnet
     * @param magnet
     * @returns {Promise<void>}
     */
    async downloadTorrent(magnet) {
        if (deluge !== null){
            await delugeHandler.add(magnet, folder, (error, result) => {
                if (error)
                    return {error};
                else
                    return result;
            });
        } else
            log(196, "deluge isn't setup yet consider setting that up")
    }

    /**
     * @desc displays suggestions of movies not on the database for download
     * @param type
     * @returns {Promise<Model<TModelAttributes, TCreationAttributes>[]>}
     */
    async displayMagnets(type) {
        type = type === 'movies';
        return Entry.findAll({
            raw: true,
            where: {type, viewed: false},
            attributes: ['name', 'type', 'poster', 'tmdb_id']
        });
    }

    /**
     * @desc downloads an entry using it's tmdb_id YTS / RarBG / All other Providers
     * @returns {Promise<null|string>}
     * @param info_id
     * @param episodeCheck
     */
    async getTMdbMagnet(info_id, episodeCheck) {
        episodeCheck = episodeCheck || false;
        let check = info_id.charAt(0) === "m";
        let model = check ? db.models.movie : db.models.show;
        let entry = await model.findOne({where: {tmdb_id: info_id.replace(/[ms]/, '')}});
        let category = check ? 'movie' : 'show';

        if (entry && check)
            return category + ' already exists with name ' + entry.get('name');

        else if (check) {
            return await this.findMovie(info_id);

        } else if (entry && !check) {
            let episodes = await db.models.episode.findAll({
                where: {show_id: entry.get('id')},
                attributes: ['season_id', 'episode', "episode_id"],
                raw: true
            });

            let seasons = episodes.uniqueID('season_id').sortKey('season_id', true).map(season => {
                return season.season_id;
            });

            let show = await getDetails(0, entry.get('tmdb_id'));
            if (show.number_of_seasons > seasons.length || show.number_of_episodes > episodes.length) {
                if (show.number_of_seasons !== seasons.length && show.number_of_episodes !== episodes.length) {
                    let nextSeason = seasons.length ? seasons[seasons.length - 1] + 1 : 1;
                    let lastSeason = seasons.length ? seasons[seasons.length - 1] : 1;
                    for (let i = 1; i < lastSeason; i++) {
                        if (seasons.find(j => j === i) === undefined) {
                            nextSeason = i;
                            break;
                        }
                    }

                    return episodeCheck ? 'No episodes are missing in available season' : await this.findSeason(entry.get('tmdb_id'), nextSeason);
                } else if (show.number_of_seasons === seasons.length && show.number_of_episodes !== episodes.length) {
                    for (let item of seasons) {
                        let season = await getSeasonInfo({tmdb_id: entry.get('tmdb_id'), season_id: item});
                        let length = season.episodes.length;
                        let tempEpisodes = episodes.filter(episode => episode.season_id === item);
                        if (tempEpisodes.length !== length) {
                            for (let item2 of season.episodes) {
                                if (!tempEpisodes.some(episode => episode.episode === item2.episode_number)) {
                                    let temp = tempEpisodes.sortKey('episode_id', true)

                                    let check;
                                    for (let i = 0; i < temp.length; i++) {
                                        if ((temp[i].episode > item2.episode_number && i !== 0) || (i === temp.length -1 && temp[i].episode < item2.episode_number)) {
                                            let val = temp[i].episode > item2.episode_number ? i - 1: i;
                                            check = await db.models.episode.findOne({where: {episode_id: temp[val].episode_id}});
                                            break;
                                        }
                                    }

                                    if (check) {
                                        check = check.get();
                                        let drive = new DriveHandler();
                                        check = await drive.getFile(check.gid);
                                        let regex = /e\d{2}/gi;
                                        let matches = check.name.match(regex);

                                        check = false;
                                        if (matches != null && typeof matches[Symbol.iterator] === 'function') {
                                            for (const reg of matches) {
                                                if (parseInt(reg.replace(/e/i, '')) === item2.episode_number)
                                                    check = true;
                                            }
                                        }

                                        if (check)
                                            continue;
                                    }

                                    let date = item2.air_date === '' ? new Date().getTime() + (7 * 24 * 60 * 60 * 1000) : Date.parse(item2.air_date);
                                    if (date < new Date().getTime())
                                        return await this.findSeason(entry.get('tmdb_id'), item, item2.episode_number)

                                    else return 'The latest episodes for ' + entry.get('name') + " hasn't aired yet";
                                }
                            }
                        }
                    }
                    return 'The ' + category + ' ' + entry.get('name') + ' may be up to date';

                } else
                    return 'The ' + category + ' ' + entry.get('name') + ' is completely up to date';

            } else
                return 'The ' + category + ' ' + entry.get('name') + ' is completely up to date';

        } else
            return await this.findSeason(info_id.replace(/[ms]/, ''), 1);
    }

    /**
     * @desc gets a show's magnet link from /RARBG/ALL other Providers;
     * Checks for episode link if episode specified else gets season link
     * @param tmdb_id
     * @param season
     * @param episode
     * @returns {Promise<{size: string, url: (*|*)}|string>}
     */
    async findSeason(tmdb_id, season, episode) {
        let {name} = await getDetails(0, tmdb_id);
        let {imdb_id} = await getExternalId(tmdb_id, 0);

        let allProviders = [];
        if (episode === undefined) {
            let search = name + ' S' + (season > 9 ? '' : '0') + season;
            allProviders = allProviders.concat(await Torrent.search(search));
            name = name + ' Season ' + season;
            allProviders = allProviders.concat(await Torrent.search(name));
        } else {
            name = `${name} S${(season > 9 ? '' : '0') + season}E${(episode > 9 ? '' : '0') + episode}`;
            allProviders = allProviders.concat(await Torrent.search(name));
        }

        let response = await new Promise((resolve) => {
            setTimeout(() => (resolve([])), 30000)

            new Promise((resolve1) => {
                if (episode === undefined)
                    resolve1(rarBgApi.search(imdb_id, options, 'imdb'))
                else
                    resolve1(rarBgApi.search(name, options))

            }).then(data => resolve(data))
                .catch(err => {
                    if (err === 'Cant find imdb in database. Are you sure this imdb exists?')
                        return rarBgApi.search(tmdb_id, options, 'themoviedb')
                            .then(data => resolve(data))
                            .catch(err => console.error(err));
                });
        });

        let resolve = [];
        response = response.map(item => {
            return {
                size: item.size,
                seeds: item.seeders,
                url: item.download,
                title: item.title,
                type: 'rarBg'
            }
        }).concat(allProviders).filter(item => item.seeds > 4)

        if (episode === undefined) {
            for (let item of response) {
                let regex = /[sS](?<season>\d{2})/;
                let matches = item.title.match(regex);
                if (matches && matches.groups) {
                    if (parseInt(matches.groups.season) === season && !/[eE]\d+/.test(item.title))
                        resolve.push(item);

                } else {
                    matches = item.title.match(/[sS]eason[\s-]+(?<season>\d+)/);
                    if (matches && matches.groups)
                        if (parseInt(matches.groups.season) === season)
                            resolve.push(item);
                }
            }
        } else {
            for (let item of response) {
                let regex = /[sS](?<season>\d{2}).*?[eE](?<episode>\d{2})/;
                let matches = item.title.match(regex);
                if (matches && matches.groups)
                    if (parseInt(matches.groups.season) === season && parseInt(matches.groups.episode) === episode)
                        resolve.push(item);
            }
        }

        if (resolve.length > 1) {
            let temp = resolve.filter(item => !/blu.*?ray/i.test(item.title))
            resolve = temp.length ? temp : resolve;
            temp = resolve.filter(item => /web/i.test(item.title))
            resolve = temp.length ? temp : resolve;
        }

        if (resolve.length > 1) {
            let temp = resolve.filter(item => !/x265|hevc/i.test(item.title));
            resolve = temp.length ? temp : resolve;
            temp = resolve.filter(item => item.title.includes('x264'))
            resolve = temp.length ? temp : resolve;
        }

        if (resolve.length > 1) {
            let temp = resolve.filter(item => /(72|108)0p/.test(item.title));
            resolve = temp.length ? temp : response;
        }

        if (resolve.length > 1) {
            let temp = resolve.filter(item => item.title.includes('1080p'));
            resolve = temp.length ? temp : resolve;
        }

        resolve = resolve.map(item => {
            let temp = item
            temp.size = item.hasOwnProperty('provider') ? toBytes(temp.size) : item.size
            return temp
        });

        resolve = resolve.sortKeys('size', 'seeds', false, false);
        return resolve.length ? {
            url: !resolve[0].hasOwnProperty('provider') ? resolve[0].url : await Torrent.getMagnet(resolve[0]),
            size: formatBytes(resolve[0].size)
        } : 'failed to get magnet';
    }

    /**
     * @desc checks if deluge feature is set up on this server
     * @returns {boolean}
     */
    delugeActive() {
        return deluge !== null;
    }
}

module.exports = Magnet;
