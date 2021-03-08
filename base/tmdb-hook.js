const {apiKey, base} = require('../config/nino.json').tmdb_api
const {sFetch, log: ln} = require('./baseFunctions')
const log = (line, info) => ln(line, 'tmdb', info);

/**
 * @desc gets details for a specific tmdb entry
 * @param type
 * @param tmdb_id
 * @returns {Promise<Headers|*|boolean>}
 */
const getDetails = async (type, tmdb_id) => {
    type = type === 1 ? 'movie/' : 'tv/';
    return await sFetch(base + type + tmdb_id + "?api_key=" + apiKey + "&language=en-US");
}

/**
 * @desc gets all movies in the collection as present movie
 * @returns {Promise<Headers|*|boolean>}
 * @param collection_id
 */
const getCollection = async (collection_id) => {
    return await sFetch(base + "collection/" + collection_id + "?api_key=" + apiKey + "&language=en-US");
}

/**
 * @desc gets the external id for an item based on it's tmdb_id
 * @param tmdb_id
 * @param type
 * @returns {Promise<Headers|*|boolean>}
 */
const getExternalId = async (tmdb_id, type) => {
    type = type === 1 ? 'movie/' : 'tv/';
    return await sFetch(base + type + tmdb_id + '/external_ids?api_key=' + apiKey);
}

/**
 * @desc gets information about production/acting staff responsible for an item based on it's tmdb_id
 * @param tmdb_id
 * @param type
 * @returns {Promise<Headers|*|boolean>}
 */
const castCrew = async (tmdb_id, type) => {
    type = type === 1 ? 'movie/' : 'tv/';
    return await sFetch(base + type + tmdb_id + "/credits?api_key=" + apiKey + "&language=en-US");
}

/**
 * @desc returns the appropriate genre following a complex function
 * @param response
 * @returns {boolean}
 */
const getGenre = response => {
    let genre = response.genres.length > 1;
    if (genre) {
        let gen1 = response.genres[0].name;
        gen1 = gen1.includes("&");

        let gen2 = response.genres[1].name;
        gen2 = gen2.includes("&");

        switch (true) {
            case (!gen1 && !gen2):
                genre = response.genres[0].name + " & " + response.genres[1].name;
                break;
            case (gen1 && !gen2):
                genre = response.genres[1].name + ", " + response.genres[0].name;
                break;
            case (!gen1 && gen2):
                genre = response.genres[0].name + ", " + response.genres[1].name;
                break;
            case (gen1 && gen2):
                genre = response.genres[0].name;
                break;
        }

    } else genre = response.genres[0].name;

    return genre;
}

/**
 * @desc gets the production company details for a specific entry using it's TMDB id
 * @param response
 * @returns {[]}
 */
const getProd = response => {
    let {networks, production_companies} = response;
    networks = networks === undefined ? [] : networks;

    let prods = [];

    for (const item of networks) {
        if (item.logo_path !== null) {
            let temp = {id: "s" + item.id, name: item.name};
            prods.push(temp);
        }
    }

    for (const item of production_companies) {
        if (item.logo_path !== null) {
            let temp = {id: "m" + item.id, name: item.name};
            prods.push(temp);
        }
    }

    return prods;
}

/**
 * @desc a more efficient and exhaustive method of getting the mpaa data and release date of films
 * @param results
 * @param locale
 * @returns {{mpaa: string, date: string}}
 */
const optimiseRating = (results, locale) => {
    let mpaa = "";
    let date = '';

    for (const item of results) {
        if (item.iso_3166_1 === locale) {
            mpaa = item;
        }
    }

    if (mpaa !== "") {
        for (const item of mpaa.release_dates) {
            mpaa = "Unknown";
            date = "Not Found";
            if (item.certification !== '') {
                mpaa = item.certification;
                date = item.release_date;
                break;
            }
        }
    }

    return {mpaa: mpaa, date: date};
}

/**
 * @desc gets relevant MPAA rating and release date of a movie from TMDB
 * @param tmdb_id
 * @returns {Promise<{release: string, rating: (string|string)}>}
 */
const getMovieRating = async tmdb_id => {
    let release = await sFetch(base + "movie/" + tmdb_id + "/release_dates?api_key=" + apiKey);

    const gnr = ["US", "GB", "FR"];
    let i = 0;
    let found = false;
    let mpaa;
    let date;
    while (i < 3 && !found) {
        let res = optimiseRating(release.results, gnr[i]);
        mpaa = res.mpaa;
        date = res.date;
        i++;
        if (mpaa !== "" && mpaa !== "Unknown") found = true;
    }

    if (mpaa === "") {
        let res = optimiseRating(release.results, gnr[0]);
        mpaa = res.mpaa;
        date = res.date;
    }

    date = date === "Not Found" ? date : new Date(date).toUTCString().substr(8, 8);

    return {release: date, rating: mpaa};
}

/**
 * @desc recursive function that searches TMDB for recommendations based on id
 * @param type
 * @param id
 * @param database
 * @param startInt
 * @param endInt
 * @param ignore || optional
 * @returns {Promise<[]>}
 */
const pageTwo = async (type, id, database, startInt, endInt, ignore) => {
    let reaType = type;
    ignore = ignore || false;
    type = type === 1 ? 'movie/' : 'tv/';
    let recommendations = (await sFetch(base + type + id + "/recommendations?api_key=" + apiKey + "&language=en-US&page=" + startInt)).results;
    let similar = (await sFetch(base + type + id + "/similar?api_key=" + apiKey + "&language=en-US&page=" + startInt)).results;
    similar = similar ? similar : [];
    recommendations = recommendations ? recommendations : [];
    let merge = similar.concat(recommendations).uniqueID("id");
    let recArray = ignore ? merge : merge.reduite(database, reaType);
    return (startInt < endInt) ? recArray.concat(await pageTwo(reaType, id, database, startInt + 1, endInt, ignore)).uniqueID(ignore ? 'id' : 'tmdb_id') : recArray;
}

/**
 * @desc gets relevant MPAA rating and release date of a movie from TMDB
 * @param tmdb_id
 * @returns {Promise<string>}
 */
const getTvRating = async tmdb_id => {
    let rate = await sFetch(base + "tv/" + tmdb_id + "/content_ratings?api_key=" + apiKey);

    let rating = "Unknown";
    for (const item of rate.results) {
        if (item.iso_3166_1 === "US")
            rating = item.rating;
    }

    return rating;
}

/**
 * @desc gets the Season information of a given show
 * @param obj
 * @returns {Promise<{overview: *, found: boolean, name: (string|*), poster: string}|{overview: *, found: boolean, name: (string|*), poster: (string|string|*|string)}>}
 */
const getSeasonInfo = async obj => {
    return await sFetch(base + "tv/" + obj.tmdb_id + "/season/" + obj.season_id + "?api_key=" + apiKey + "&language=en-US");
}

/**
 * @desc gets the episode information of a given season might also use user id for watched position
 * @param obj
 * @param imageImportant
 * @returns {Promise<{overview: *, found: boolean, name: (string|*), poster: string}|{overview: *, found: boolean, name: (string|*), poster: (string|string|*|string)}>}
 */
const getEpisodeInfo = async (obj, imageImportant) => {
    let response = await sFetch(base + "tv/" + obj.tmdb_id + "/season/" + obj.season_id + "/episode/" + obj.episode + "?api_key=" + apiKey + "&language=en-US");
    let head = await sFetch('https://image.tmdb.org/t/p/original' + response.still_path, true);
    let content_type = head.get('Content-Type');

    if (imageImportant && (response.hasOwnProperty("status_code") || response.still_path === null || content_type === 'text/html')) {
        let nResponse = await sFetch(base + "tv/" + obj.tmdb_id + "?api_key=" + apiKey + "&language=en-US");

        return {
            found: !(response.name === undefined || response.name === null),
            name: response.name === undefined || response.name === null ? "Episode " + obj.episode : response.name,
            overview: response.overview === undefined || response.overview === "" ? nResponse.overview : response.overview,
            poster: nResponse.backdrop_path === null ? obj.poster : 'https://image.tmdb.org/t/p/original' + nResponse.backdrop_path
        }

    } else {
        return {
            found: !(response.name === undefined || response.name === null),
            name: response.name === undefined || response.name === null ? "Episode " + obj.episode : response.name,
            overview: response.overview,
            poster: response.still_path ? "https://image.tmdb.org/t/p/original" + response.still_path : undefined
        }
    }
}

/**
 * @desc searches on TMDB for popular and trending items in the week present in the database
 * @param dBase the host database || optional
 * @param limit how many pages down should one go for trending
 * @returns {Promise<[]>}
 */
const trending = async (limit, dBase) => {
    dBase = dBase || false;
    let searchDbase = dBase !== false;
    let movies = await sFetch(base + "trending/movie/week?api_key=" + apiKey);
    let tv = await sFetch(base + "trending/tv/week?api_key=" + apiKey);

    let int = 1;
    let movieBase = movies.results;
    let tvBase = tv.results

    do {
        let mFin = "&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=";
        movies = await sFetch(base + "discover/movie?api_key=" + apiKey + mFin + int);
        let tFin = `&language=en-US&sort_by=popularity.desc&page=${int}&timezone=America%2FNew_York&include_null_first_air_dates=false`;
        tv = await sFetch(base + "discover/tv?api_key=" + apiKey + tFin);

        tvBase = tvBase.concat(tv.results);
        movieBase = movieBase.concat(movies.results);

        int++;
    } while (int < limit);

    return searchDbase ? movieBase.reduite(dBase, 1, 'popularity').concat(tvBase.reduite(dBase, 0, 'popularity')).uniqueID('tmdb_id').sortKey('popularity', false) : movieBase.concat(tvBase);
}

/**
 * @ returns the portrait poster for items from TMDB
 * @param tmdb_id
 * @param type
 * @returns {Promise<string>}
 */
const loadPortrait = async (tmdb_id, type) => {
    let og = type === 1 ? "movie/" : "tv/";
    let {poster_path} = await sFetch(base + og + tmdb_id + "?api_key=" + apiKey + "&language=en-US");
    return 'https://image.tmdb.org/t/p/original' + poster_path;
}

/**
 * @desc gets information for person with id from TMDB
 * @param id
 * @param dBase
 * @returns {Promise<{name: *, photo: string, biography: *}>}
 */
const getPersonInfo = async (id, dBase) => {
    const {
        name,
        biography,
        profile_path
    } = await sFetch(base + "person/" + id + "?api_key=" + apiKey + "&language=en-US");
    let movie = await sFetch(base + "person/" + id + "/movie_credits?api_key=" + apiKey + "&language=en-US");
    let tv = await sFetch(base + "person/" + id + "/tv_credits?api_key=" + apiKey + "&language=en-US");

    let obj = {
        name: name,
        biography: biography,
        photo: 'https://image.tmdb.org/t/p/original' + profile_path,
    }

    obj.movie_cast = movie.cast.reduite(dBase, 1, 'character').uniqueID('tmdb_id');
    obj.movie_crew = movie.crew.reduite(dBase, 1).uniqueID('tmdb_id');

    obj.tv_cast = tv.cast.reduite(dBase, 0, 'character').uniqueID('tmdb_id');
    obj.tv_crew = tv.crew.reduite(dBase, 0).uniqueID('tmdb_id');

    obj.production = obj.tv_crew.concat(obj.movie_crew).sortKey('tmdb_id', true);
    delete obj.tv_crew;
    delete obj.movie_crew;
    return obj;
}

/**
 * @desc gets a company's details from TMDB
 * @param info_id
 * @param dBase
 * @param forRender to determine if you need details on this company or just its name, useful for render || optional
 * @returns {Promise<{logo_path: *, name: *}>}
 */
const getProdDetails = async (info_id, dBase, forRender) => {
    forRender = forRender || false;
    let confirm = info_id.charAt(0) === "s";
    let id = info_id.replace(/(m|s)/, '');
    let url = base + (confirm ? "network" : "company") + "/" + id + "?api_key=" + apiKey;
    let {name, logo_path} = await sFetch(url);
    logo_path = 'https://image.tmdb.org/t/p/original' + logo_path;

    if (!forRender) {
        let movies = [];
        let tv = [];
        if (confirm) {
            url = `${base}discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&with_networks=${id}&include_null_first_air_dates=false`;
            let db = await sFetch(url);
            tv = tv.concat(db.results.reduite(dBase, 0));

            let i = 2;
            while (i < db.total_pages + 1) {
                url = `${base}discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${i}&with_networks=${id}&include_null_first_air_dates=false`;
                let {results} = await sFetch(url);
                tv = tv.concat(results.reduite(dBase, 0));
                i++;
            }

        } else {
            let i = 1;
            url = `${base}discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${i}&include_null_first_air_dates=false&with_companies=${id}`;
            let {total_pages, results} = await sFetch(url);
            tv = tv.concat(results.reduite(dBase, 0));
            i++;

            while (i < total_pages + 1) {
                url = `${base}discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&page=${i}&include_null_first_air_dates=false&with_companies=${id}`;
                let {results} = await sFetch(url);
                tv = tv.concat(results.reduite(dBase, 0));
                i++;
            }

            i = 1;
            url = `${base}discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${i}&with_companies=${id}`;
            let db = await sFetch(url);
            movies = movies.concat(db.results.reduite(dBase, 1));
            i++;

            while (i < db.total_pages + 1) {
                url = `${base}discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${i}&with_companies=${id}`;
                let {results} = await sFetch(url);
                movies = movies.concat(results.reduite(dBase, 1));
                i++;
            }
        }


        return {name, logo_path, movies, tv, id: info_id};
    } else return name;
}

/**
 * @desc gets the trailer for a TMDB entry using type to determine if movie or tv show
 * @param tmdb_id
 * @param type
 * @returns {Promise<string>}
 */
const getTrailer = async (tmdb_id, type) => {
    type = type === 1 ? "movie/" : "tv/";
    let {results} = await sFetch(base + type + tmdb_id + "/videos?api_key=" + apiKey + "&language=en-US");
    let result = '';
    for (const item of results) {
        if (item.type === "Trailer") {
            result = item.key;
            break;
        }
    }

    return result;
}

/**
 * @desc searches TMDB for an entry
 * @param type
 * @param name
 * @returns {Promise<*>}
 */
const search = async (type, name) => {
    let search = type === 1 ? 'search/movie?api_key=' : 'search/tv?api_key=';
    return await sFetch(base + search + apiKey + '&language=en-US&page=1&query=' + name + '&include_adult=true');
}

/**
 * @desc searches FanArt DB for images for a show || movie
 * @param tmdb_id
 * @param type
 * @returns {Promise<{backdrop: *, logo: *, poster: *}>}
 */
const fanArtImages = async (tmdb_id, type) => {
    const {apiKey, base} = require('../config/nino.json').fanArt
    let imdb_id = type === 1 ? tmdb_id : (await getExternalId(tmdb_id, type)).tvdb_id;
    type = (type === 1 ? 'movies' : 'tv') + '/';

    let response = await sFetch(base + type + imdb_id + '?api_key=' + apiKey);

    let obj = {
        logo: type === 'movies/' ? response.hdmovielogo : response.hdtvlogo,
        poster: type === 'movies/' ? response.moviethumb : response.tvthumb,
        backdrop: type === 'movies/' ? response.moviebackground : response.showbackground
    }

    obj.logo = obj.logo !== undefined && obj.logo.length ? obj.logo.filter(item => item.lang === 'en' || item.lang === '').sortKey('likes', false) : [];
    obj.poster = obj.poster !== undefined && obj.poster.length ? obj.poster.filter(item => item.lang === 'en' || item.lang === '').sortKey('likes', false) : [];
    obj.backdrop = obj.backdrop !== undefined && obj.backdrop.length ? obj.backdrop.filter(item => item.lang === 'en' || item.lang === '').sortKey('likes', false) : [];

    obj.logo = obj.logo.length ? obj.logo[0].url : "";
    obj.backdrop = obj.backdrop.length ? obj.backdrop[0].url : "";
    obj.poster = obj.poster.length ? obj.poster[0].url : "";
    return obj;
}

/**
 * @desc searches TMDB for images for a show || movie
 * @param tmdb_id
 * @param type
 * @returns {Promise<{backdrop: *, logo: *, poster: *}>}
 */
const tmdbIMages = async (tmdb_id, type) => {
    type = (type === 1 ? 'movie' : 'tv') + '/';
    let response = await sFetch(base + type + tmdb_id + '/images?api_key=' + apiKey);
    response = response.backdrops.map(item => {
        return {
            url: 'https://image.tmdb.org/t/p/original' + item.file_path,
            lang: item.iso_639_1,
            likes: Math.ceil((1 + item.vote_average) * 10)
        }
    })

    let sub = response.filter(item => item.lang === 'us' || item.lang === 'en' || item.lang === 'uk').sortKey('likes', false);
    let back = response.filter(item => item.lang === null).sortKey('likes', false);
    return {poster: sub.length ? sub[0].url : '', backdrop: back.length ? back[0].url : ''};
}

/**
 * @desc searches tmdb for an entry using it's imdb_id
 * @param imdb_id
 * @returns {Promise<*|boolean>}
 */
const getFromIMDB = async imdb_id => {
    let response = await sFetch(base + 'find/' + imdb_id + '?api_key=' + apiKey + '&language=en-US&external_source=imdb_id');
    let result = [];
    for (const item of Object.keys(response))
        result = result.concat(response[item]);

    return response.length ? response[0] : false;
}

module.exports = {
    trending,
    getEpisodeInfo,
    getSeasonInfo,
    getCollection,
    getDetails,
    tmdbIMages,
    pageTwo,
    getExternalId,
    getFromIMDB,
    castCrew,
    getGenre,
    getProd,
    getPersonInfo,
    getMovieRating,
    loadPortrait,
    fanArtImages,
    getTvRating,
    getTrailer,
    search,
    getProdDetails
}