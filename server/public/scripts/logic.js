const infoBlock = {
    block: document.getElementById("info-block"),
    backdrop: document.querySelector("#info-background img"),
    box: document.getElementById("info-holder"),
    overview: document.querySelector("#info-overview span"),
    rating: document.getElementById("rating"),
    genre: document.getElementById("genre"),
    back: document.getElementById("info-back-button"),
    section: document.getElementById("info-list"),
    review: document.getElementById("review-fill"),
    review_groove: document.getElementById("review"),
    play: document.getElementById("play-button"),
    details: document.getElementById("info-extra"),
    position: document.getElementById("movie-position"),
    suggestion: document.getElementById("info-response-list"),
    shuffle: document.getElementById("shuffle-play"),
    rate_it: document.getElementById('review-cont'),
    review_label: document.getElementById('review-holder'),
    hls: document.getElementById("hls-play"),
    trailer: document.getElementById('trailer'),
    closeSeason: document.getElementById("close-season"),
    detailName: document.getElementById("item-title"),
    detailOverview: document.getElementById("item-overview"),
    cast: document.getElementById("cast"),
    crew: document.getElementById("crew"),
    release: document.getElementById("info-item-release")
}

const loader = {
    loader: document.getElementById("loader-background"),
    display: function () {
        this.loader.setAttribute("class", "showLoader");
    }, fade: function () {
        this.loader.setAttribute("class", "fadeLoader");
    }
}

const prod = {
    box: document.getElementById("distributor-holder"),
    logo: document.getElementById("prod_img"),
    name: document.getElementById("prod_name"),
    movie: document.getElementById("movie-prods"),
    tv: document.getElementById("tv-prods")
}

const personInfo = {
    box: document.getElementById("person-holder"),
    name: document.getElementById("person-name"),
    photo: document.getElementById("person-photo"),
    options: {
        overview: document.getElementById("person-opt-ovr"),
        videos: document.getElementById("person-opt-vid")
    },
    overview: document.getElementById("person-bio"),
    videoBlock: document.getElementById("videography"),
    span: document.getElementById("per-span-div"),
    videos: {
        movie: document.getElementById("movie-roles"),
        tv: document.getElementById("tv-roles"),
        prod: document.getElementById("crew-roles")
    }
}

const addToList = {
    holder: document.getElementById("add-myList"),
    plus: document.getElementById("addToList"),
    tick: document.getElementById("alreadyList"),
    close: document.getElementById("removeList")
}

const logout = {
    block: document.getElementById("log-holder"),
    container: document.getElementById("logout-container"),
    confirm: document.getElementById("logout-confirm"),
    deny: document.getElementById("logout-reject")
}

const download = {
    block: document.getElementById("download-holder"),
    container: document.getElementById("downloadContainer"),
    confirm: document.getElementById("downAccept"),
    deny: document.getElementById("downReject"),
    message: document.getElementById("downMessage-span"),
    input: document.getElementById("auth-key"),
    button: document.getElementById("downloadBtn"),
    backup: 'Enter an auth key',
    validated: false,
    active: false
}

const share = {
    block: document.getElementById("shareHolder"),
    container: document.getElementById("shareContainer"),
    confirm: document.getElementById("shareAccept"),
    deny: document.getElementById("shareReject"),
    message: document.getElementById("shareMessage-span"),
    input: document.getElementById("shareOut"),
    button: document.getElementById("shareFrame"),
    backup: 'Share from current position ?',
    validated: false,
    active: false
}

const upNext = {
    block: document.getElementById("upNextContainer"),
    image: document.getElementById("upNextImg"),
    name: document.getElementById("upNextTitle"),
    overview: document.getElementById("upNextOverview")
}

const subtitles = {
    trigger: document.getElementById('sub-button'),
    block: document.getElementById('sub-window'),
    none: document.getElementById('nan'),
    english: document.getElementById('eng'),
    french: document.getElementById('fre'),
    german: document.getElementById('ger'),
    shown: false,
}

let myFrame = {
    player: undefined,
    MouseOver: false,
    trailer: false,
    id: "x"
}

const ninoPlayer = {
    uiBlocks: {
        buffer: document.getElementById("buffering"),
        block: document.getElementById("video-block"),
        holder: document.querySelector('.video-container'),
        loader: document.getElementById("loader-background"),
        previewFrame: document.getElementById("previewFrame"),
        logo: document.querySelector(".video-container .content-image"),
        controls: document.querySelector('.video-container .controls-container'),
        overview: document.getElementById("video-deets"),
        playFlash: document.getElementById("playFlash"),
        foncer: document.getElementById('foncer'),
        pauseFlash: document.getElementById("pauseFlash")
    }, buttons: {
        play: {
            play: document.getElementById("play-pause"),
            playButton: document.getElementById('playing'),
            pauseButton: document.getElementById('paused'),
        }, fullScreen: {
            fullScreenButton: document.querySelector('.video-container .controls button.full-screen'),
            maximizeButton: document.querySelector('.video-container .controls button.full-screen .maximize'),
            minimizeButton: document.querySelector('.video-container .controls button.full-screen .minimize'),
        }, recap: document.getElementById("skip-recap"),
        back: document.getElementById("back-button"),
        rewind: document.querySelector('.video-container .controls button.rewind'),
        fastForward: document.querySelector('.video-container .controls button.fast-forward'),
        next: document.getElementById("nextButton"),
        volume: document.getElementById("volume")
    }, infoTexts: {
        info: document.getElementById("video-info"),
        information: document.querySelector("#video-info .information"),
        timeSeen: document.getElementById("timeSeen"),
        countdown: document.getElementById("countDown"),
        title: document.getElementById("video-title"),
        timeLeft: document.getElementById("time-left"),
        lower_title: document.getElementById("episodeName")
    }, sliders: {
        volumeFill: document.getElementById("volume-fill"),
        volumeGroove: document.getElementById("volume-groove"),
        progressGroove: document.querySelector('.video-container .progress-controls .progress-bar'),
        progressFill: document.querySelector('.video-container .progress-controls .progress-bar .watched-bar'),
    }, timers: {
        controlsTimeout: null,
        stillWatching: null,
        infoTimeout: null
    }, booleans: {
        recap: false,
        guest: false,
        active: false,
        shuffleMode: false,
        countdownStarted: false
    }, video: document.querySelector('.video-container video'),
    location: false,
    activeSub: 'na',
    subs: [],
    position: 0
}

const search = {
    bool: false,
    doneTyping: null,
    form: document.getElementById('search-form'),
    input: document.getElementById("search-input"),
    result: document.getElementById("search-result"),
    output: document.getElementById("search-output")
}

const bannerHolder = document.getElementById("recent-container");
const primary = document.getElementById("primary-block");

let ssd = {movies: false, tvShows: false};
const isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
    navigator.userAgent && navigator.userAgent.indexOf('CriOS') === -1 && navigator.userAgent.indexOf('FxiOS') === -1;

Array.prototype.search = function (value) {
    let temp = this.filter(item => item.name.toLowerCase().startsWith(value.toLowerCase()));
    let a = temp.concat(this);
    for (let i = 0; i < a.length; ++i) {
        for (let j = i + 1; j < a.length; ++j) {
            if ((a[i].name === a[j].name) && (a[i].tmdb_id === a[j].tmdb_id))
                a.splice(j--, 1);
        }
    }

    return a;
}

const handleHistory = (type, value, name, url) => {
    history.pushState({type, value}, name, url);
    document.title = name;
}

const manageHistory = async (object, boot) => {
    loader.display();

    if (ninoPlayer.booleans.active)
        await destroyVideo();

    if (object.type === "info") {
        sFetch('info/' + object.value).then(response => {
            document.title = response.name;
            buildInfo(response);
        }).catch(err => console.error(err));
    }

    if (object.type === "person") {
        let person = await sFetch("info/person/" + object.value);
        let blob = person.movie_cast.concat(person.tv_cast).concat(person.production);
        let int = Math.floor(Math.random() * blob.length);
        let tmdb_id = (blob[int].type === 1 ? "m" : 's') + blob[int].tmdb_id;
        sFetch('info/' + tmdb_id).then(response => buildInfo(response)).then(() => buildPerson(person)).then(() => loader.fade()).catch(err => console.error(err));
        document.title = person.name;

    }

    if (object.type === "prod") {
        let prod = await sFetch("info/prod/" + object.value);
        let blobs = prod.movies.concat(prod.tv);
        let int = Math.floor(Math.random() * blobs.length);
        let tmdb_id = (blobs[int].type === 1 ? "m" : 's') + blobs[int].tmdb_id;
        sFetch('info/' + tmdb_id).then(response => buildInfo(response)).then(() => buildProd(prod)).then(() => loader.fade()).catch(err => console.error(err));
        document.title = prod.name;
    }

    if (object.type === "watch") {
        let response = await sFetch("watch/" + object.value);
        let upNext = await sFetch("watch/upNext/" + response.next);
        let name = response.episodeName !== undefined ? response.episodeName : response.name;
        let subtitles = await sFetch("watch/subs/" + response.location);
        await buildVideo(response, upNext, subtitles);
        document.title = "\u25B6 " + name;
    }

    if (object.type === 'iframe') {
        let response = await sFetch("iframe/decrypt/" + object.value);
        let upNext = await sFetch("watch/upNext/" + response.next);
        let name = response.episodeName !== undefined ? response.episodeName : response.name;
        let subtitles = await sFetch("watch/subs/" + response.location);
        await buildVideo(response, upNext, subtitles);
        document.title = "\u25B6 " + name;
    }

    if (object.type === "nino" && boot === undefined) {
        personInfo.box.setAttribute("class", "fadeLoader");
        prod.box.setAttribute("class", "fadeLoader");
        infoBlock.block.setAttribute("class", "fadeLoader");
        document.title = 'nino';
        loader.fade();
    }
}

const bannerLoad = async () => {
    let {data, next} = await sFetch("load/banner");
    loadAnimate(data);
    return next;
}

const loadAnimate = (array) => {
    bannerHolder.innerHTML = '';

    let banner = document.createElement("div");
    banner.setAttribute("id", "recently-added");
    let htmlString = '';
    for (let i = 0; i < array.length; i++) {
        const pos = i === 2 ? "in" : "out";
        const img = array[i].logo !== "" ? `<img class="img2" src="${array[i].logo}" alt="${array[i].name}">` : `<label class="randLabel">${array[i].name}</label>`;
        htmlString += `<div class="info" alt="${array[i].type === 1 ? "m" + array[i].tmdb_id : "s" + array[i].tmdb_id}">
                    <div class="recent-div ${pos} number${i}">
                        ${img}
                        <img class="img1" src="${array[i].backdrop}">
                    </div>
                 </div>`;
    }

    banner.innerHTML = htmlString;
    bannerHolder.append(banner);
    setTimeout(randomVisible, 2000);
    const one = array[0];
    array.shift();
    array.push(one);
    setTimeout(function () {
        loadAnimate(array);
    }, 20000);
}

const randomVisible = () => {
    const img2 = document.querySelectorAll(".img2");
    const rand = document.querySelectorAll(".randLabel");
    img2.forEach(image => {
        image.style.opacity = "1";
    });
    rand.forEach(label => {
        label.style.opacity = "1";
    });
}

const loadFunction = async hoc => {
    let {type, container, category, list, position, data, next, block} = await sFetch("load/" + hoc);
    if (!document.getElementById(list)) createElement(type, container, category, list, position, block);
    let element = document.getElementById(list);
    switch (category) {
        case ("movies"):
            let {result, left} = takeFive(data, 10);
            data = result;
            ssd.movies = left;
            break;
        case ("tv shows"):
            let info = takeFive(data, 10);
            data = info.result;
            ssd.tvShows = info.left;
            break;
    }

    type === "basic" ? loadList(data, element) : loadChoice(data, element);
    document.getElementById(container).removeAttribute("style");
    return next;
}

const createElement = (type, container, category, list, position, block) => {
    let element = document.getElementById(block);
    let string = `<div id="${container}" class="${type === "basic" || type === "cont" ? type === "basic" ? "basic-container" : "cont-container" : "editors-Container"}">
                        <div class="basic-span"><span>${category}</span></div>
                        <ul id="${list}" class="${type === "basic" ? "basic-list" : "editors-list"}"></ul>
                    </div>`;

    element.insertAdjacentHTML(position, string);
}

const getList = async () => {
    let {data, next, list} = await sFetch("load/myList");
    if (!document.getElementById("myList-container"))
        createElement("basic", "myList-container", "my list", list, "afterbegin", "user");

    let element = document.getElementById(list);
    document.getElementById("myList-container").removeAttribute("style");
    element.innerHTML = "";
    if (data !== false && data.length >= 1)
        loadList(data, element);

    else document.getElementById("myList-container").style.display = "none";
    return next;
}

const getCont = async () => {
    let {type, container, category, list, position, data, next, block} = await sFetch("load/continue");
    if (!document.getElementById(list)) createElement(type, container, category, list, position, block);
    let element = document.getElementById(list);
    document.getElementById(container).style.display = "none";

    if (data !== false && data.length >= 1) {
        document.getElementById(container).removeAttribute("style");
        element.innerHTML = data.map(file => `
            <li class="info" alt="${file.type === 1 ? "m" + file.tmdb_id : "s" + file.tmdb_id}">
                <div class="continue-inner-div">
                    <div class="editors-img play" data-id="${file.type === 1 ? "m" + file.tmdb_id : "s" + file.tmdb_id}">
                        <img class="editors-backdrop" src="${file.backdrop}" id="${file.type === 1 ? "m" + file.tmdb_id : "s" + file.tmdb_id}">
                        ${file.logo !== '' ? `<img class="editors-logo" src="${file.logo}" alt="${file.type === 1 ? "m" + file.tmdb_id : "s" + file.tmdb_id}">` : `<span class="editors-label">${file.name}</span>`}
                        <div class="cont-progress-groove" style="display: ${file.position === 0 ? "none" : "flex"}"><div class="progress-fill" style="width: ${file.position === 100 ? 100 : file.position / 10}%"></div></div>
                    </div>
                    <div class="editors-info-div">
                        <span>${file.overview}</span>
                    </div>
                </div>
            </li>
        `).join('');
    } else if (data === "out") window.location.reload();
    return next;
}

const userFunc = async hoc => {
    let {type, container, category, list, position, data, next, block} = await sFetch("load/" + hoc);

    if (!document.getElementById(list)) createElement(type, container, category, list, position, block);
    let element = document.getElementById(list);
    document.getElementById(container).removeAttribute("style");
    element.innerHTML = "";

    if (data !== false && data.length >= 1)
        loadList(data, element);

    else document.getElementById(container).style.display = "none";
    return next;
}

const loadList = (blobs, element) => {
    let string = blobs.map(file => `
        <li class="info" alt="${(file.type === 1 ? "m" : "s") + file.tmdb_id}">
            <img src="${file.poster}"  alt="${(file.type === 1 ? "m" : "s") + file.tmdb_id}">
            ${file.tag ? `<div class="basic-tags"><span>${file.tag}</span></div>` : ''}
        </li>
    `).join('');
    element.insertAdjacentHTML('beforeend', string);
}

const loadChoice = (blobs, element) => {
    element.innerHTML = blobs.map(file => `
        <li class="info" alt="${file.type === 1 ? "m" + file.tmdb_id : "s" + file.tmdb_id}" data-id="${file.trailer}">
            <div class="editors-inner-div">
                <div class="editors-img">
                    <img class="editors-backdrop" src="${file.backdrop}" id="${file.type === 1 ? "m" + file.tmdb_id : "s" + file.tmdb_id}">
                    ${file.logo !== '' ? `<img class="editors-logo" src="${file.logo}" alt="${file.type === 1 ? "m" + file.tmdb_id : "s" + file.tmdb_id}">` : `<span class="editors-label">${file.name}</span>`}
                </div>
                <div class="editors-info-div">
                    <span>${file.overview}</span>
                </div>
            </div>
        </li>
    `).join('');
}

const buildInfo = info => {
    infoBlock.suggestion.innerHTML = "";
    if (info.type !== "movie") {
        ssd.show = {};
        ssd.show.seasons = info.seasons;
        ssd.show.poster = info.poster;
        ssd.show.recommendations = info.recommendations;

        if (!info.seasons.hasOwnProperty('error')) {
            infoBlock.suggestion.setAttribute("class", "showLoader seasons");
            infoBlock.suggestion.innerHTML = info.seasons.map(item => `
                <li class="episodes" data-id="${item}"><img src="${info.poster}" alt="${item}"><span>${item}</span></li>
            `).join('');

        } else infoBlock.suggestion.innerHTML = `<span id="loading-span">${info.seasons.error}</span>`;

    } else {
        if (ssd.show)
            delete ssd.show;

        loadList(info.recommendations, infoBlock.suggestion);
        infoBlock.suggestion.setAttribute("class", "showLoader basic-list");
        infoBlock.suggestion.style.marginTop = "2vh";
    }

    ssd.name = info.name;
    ssd.info_id = info.id;
    ssd.section = info.section;
    infoBlock.backdrop.src = info.backdrop;
    infoBlock.position.style.width = "0%";
    infoBlock.box.scrollTop = 0;
    document.getElementById("divider").style.background = "rgba(255, 255, 255, .6)";

    let id = info.type === "movie" ? "m" + info.id : "s" + info.id;
    infoBlock.hls.setAttribute("data-id", id);
    infoBlock.play.setAttribute("data-id", id);
    addToList.holder.setAttribute("data-id", id);
    infoBlock.shuffle.setAttribute("data-id", `x${info.id}`);
    infoBlock.trailer.setAttribute("data-id", info.trailer);

    let logo = info.logo !== "" ? `<img id="info-logo" src="${info.logo}" alt="${info.name}">` : `<label id="info-logo">${info.name}</label>`;
    logo = stringToHTML(logo);

    if (info.position !== undefined) {
        infoBlock.position.style.width = info.position + "%";
        document.getElementById("divider").style.background = "rgba(144, 197, 240, .2)";
    }

    document.body.style.overflow = "hidden";

    infoBlock.hls.style.display = info.hls && isSafari ? "flex" : "none";
    infoBlock.shuffle.style.display = info.type === "movie" ? "none" : "flex";
    infoBlock.trailer.style.display = info.trailer === "" ? "none" : "flex";
    // addToList.holder.style.marginLeft = info.type === "movie" ? "0" : "1vh";

    if (info.myList !== undefined) {
        addToList.holder.style.display = "flex";
        if (info.myList) {
            addToList.holder.setAttribute("class", "remove-myList");
            addToList.tick.removeAttribute("style");
            addToList.plus.style.display = "none";
        } else {
            addToList.holder.setAttribute("class", "nino");
            addToList.plus.style.display = "block";
            addToList.tick.style.display = "none";
        }
    } else addToList.holder.style.display = "none";

    let list = document.querySelectorAll('.editors-hover');
    if (list.length > 0) list.forEach(div => {
        div.remove();
    });

    if (!personInfo.box.classList.contains("fadeLoader") || !prod.box.classList.contains("fadeLoader")) {
        personInfo.box.setAttribute("class", "fadeLoader");
        prod.box.setAttribute("class", "fadeLoader");
        infoBlock.box.setAttribute("class", "showLoader");
    }

    infoBlock.box.replaceChild(logo, infoBlock.box.childNodes[1]);
    infoBlock.genre.innerText = info.genre;
    infoBlock.block.removeAttribute("class");
    infoBlock.block.style.display = "block";
    infoBlock.rating.innerText = info.rating;
    infoBlock.overview.innerHTML = info.overview;
    infoBlock.review.style.width = (info.review * 10) + "%";
    infoBlock.review.setAttribute('myRating', info.myRating);
    infoBlock.detailName.innerText = info.name;
    infoBlock.detailOverview.innerText = info.overview;
    infoBlock.suggestion.scrollLeft = 0;
    let prodTeam = info.crew !== undefined ? "Production Team:" : "";
    infoBlock.release.innerHTML =
        `<div id="release-div">Release: <span class="info-basic">${info.release}</span></div>
        <div id="runtime-div">Runtime: <span class="info-basic">${info.runtime}</span></div>
        ${info.crew === undefined ? "" : `<br><div>${prodTeam}</div><ul id='crew'></ul>`}
        ${info.production.length ? `<br><div>Companies</div><ul id="prod_logos">${info.production.map(item => `<li class="prodCompany" data-id="${item.id}"><span>${item.name}</span></li>`).join('')}</ul>` : ""}`;

    if (info.crew !== undefined) {
        $('#crew').html(info.crew.map(person => `
            <li>${person.job}: <span class="person" data-id="${person.id}">${person.name}</span></li>
        `).join(''));
    }

    infoBlock.cast.innerHTML = info.cast.map(person => `
            <span class="person" data-id="${person.id}">${person.name}</span><br>
        `).join('');

    handleOptions(info.section[0])
    loader.fade();
}

const buildPerson = person => {
    infoBlock.box.setAttribute("class", "fadeLoader");
    personInfo.name.innerHTML = person.name;
    personInfo.photo.src = person.photo;
    personInfo.overview.innerHTML = person.biography;

    if (person.movie_cast.length) {
        const mov = document.querySelectorAll(".per-mov");
        personInfo.videos.movie.innerHTML = "";
        for (const el of mov)
            el.style.display = "flex";

        loadList(person.movie_cast, personInfo.videos.movie);

    } else {
        const mov = document.querySelectorAll(".per-mov");
        for (const el of mov)
            el.style.display = "none";
    }

    if (person.tv_cast.length) {
        const mov = document.querySelectorAll(".per-tv");
        personInfo.videos.tv.innerHTML = "";
        for (const el of mov)
            el.style.display = "flex";

        loadList(person.tv_cast, personInfo.videos.tv);
    } else {
        const mov = document.querySelectorAll(".per-tv");
        for (const el of mov)
            el.style.display = "none";
    }

    if (person.production.length) {
        const mov = document.querySelectorAll(".per-prod");
        personInfo.videos.prod.innerHTML = "";
        for (const el of mov)
            el.style.display = "flex";

        loadList(person.production, personInfo.videos.prod);
    } else {
        const mov = document.querySelectorAll(".per-prod");
        for (const el of mov)
            el.style.display = "none";
    }

    personInfo.box.setAttribute("class", "showLoader");
    handleOptions("Overview");
}

const buildProd = response => {
    infoBlock.box.setAttribute("class", "fadeLoader");
    prod.data = response;
    prod.data.id = response.id;
    document.title = response.name;
    prod.logo.src = response.logo_path;
    prod.name.innerText = response.name;

    if (response.tv.length) {
        prod.tv.innerHTML = "";
        loadList(response.tv, prod.tv);
        const mov = document.querySelectorAll(".prods-tv");
        for (const el of mov) {
            el.style.display = "flex";
        }

    } else {
        const mov = document.querySelectorAll(".prods-tv");
        for (const el of mov) {
            el.style.display = "none";
        }
    }

    if (response.movies.length) {
        prod.movie.innerHTML = "";
        loadList(response.movies, prod.movie);
        const mov = document.querySelectorAll(".prods-mov");
        for (const el of mov) {
            el.style.display = "flex";
        }

    } else {
        const mov = document.querySelectorAll(".prods-mov");
        for (const el of mov) {
            el.style.display = "none";
        }
    }

    prod.box.setAttribute("class", "showLoader");
}

const handleOptions = string => {
    infoBlock.closeSeason.style.display = "none";
    infoBlock.section.innerHTML =
        ssd.section.map(item => `<li class="${item === string ? "info-active options" : "info-passive options"}" data-id="${item}">${item}</li>`).join('');

    if (string === "More like this" || string === "Surprise me!") {
        if (ssd.show === undefined) {
            infoBlock.details.setAttribute("class", "hide");
            infoBlock.suggestion.setAttribute("class", "showLoader basic-list");
            infoBlock.suggestion.style.marginTop = "2vh";
        } else {
            infoBlock.suggestion.innerText = "";
            infoBlock.details.setAttribute("class", "hide");
            infoBlock.suggestion.setAttribute("class", "showLoader basic-list");
            loadList(ssd.show.recommendations, infoBlock.suggestion);
            infoBlock.suggestion.style.marginTop = "2vh";
        }

        infoBlock.box.style.overflow = "hidden";
        infoBlock.suggestion.scrollLeft = 0;
    } else if (string === "Seasons") {
        if (!ssd.show.seasons.hasOwnProperty('error')) {
            infoBlock.details.setAttribute("class", "hide");
            infoBlock.suggestion.setAttribute("class", "showLoader seasons");
            infoBlock.suggestion.innerHTML = ssd.show.seasons.map(item => `
                <li class="episodes" data-id="${item}"><img src="${ssd.show.poster}" alt="${item}"><span>${item}</span></li>
            `).join('');

        } else infoBlock.suggestion.innerHTML = `<span id="loading-span">${ssd.show.seasons.error}</span>`;

        infoBlock.box.style.overflow = "hidden";
        infoBlock.suggestion.scrollLeft = 0;
    } else if (string === "Details") {
        infoBlock.box.style.overflow = "scroll";
        infoBlock.suggestion.setAttribute("class", "hide");
        infoBlock.details.setAttribute("class", "showLoader");

    } else if (string === "Overview") {
        personInfo.options.overview.setAttribute("class", "info-active options");
        personInfo.options.videos.setAttribute("class", "info-passive options");
        personInfo.span.setAttribute("class", "showLoader");
        personInfo.videoBlock.setAttribute("class", "hide");

    } else if (string === "Videography") {
        personInfo.options.overview.setAttribute("class", "info-passive options");
        personInfo.options.videos.setAttribute("class", "info-active options");
        personInfo.span.setAttribute("class", "hide");
        personInfo.videoBlock.setAttribute("class", "showLoader");
    }
}

const destroyTrailer = () => {
    infoBlock.backdrop.setAttribute("class", "glow_image");
    infoBlock.box.setAttribute("class", "glow_input");
    document.getElementById('player').setAttribute('class', 'fade_input');
    myFrame.player.stopVideo();
    myFrame.trailer = false;
    myFrame.player.destroy();
    myFrame.player = null;
}

function playYoutubeVideo() {
    myFrame.player.setVolume(0);
    myFrame.player.playVideo();
    document.getElementById('player').setAttribute('class', 'glow_input');
    infoBlock.backdrop.setAttribute("class", "fade_image");
    infoBlock.box.setAttribute("class", "fade_input");
    myFrame.player.setVolume(50);
}

function endVideo(event) {
    if (event.data === 0) {
        infoBlock.backdrop.setAttribute("class", "glow_image");
        infoBlock.box.setAttribute("class", "glow_input");
        document.getElementById('player').setAttribute('class', 'fade_input');
        myFrame.trailer = false;
        myFrame.player.destroy();
        myFrame.player = null;
    }
}

const loggedInLoader = async () => {
    let response = await sFetch("auth/verify");
    document.getElementById("ac-path").style.fill = "#2b3940";
    if (document.getElementById("user")) document.getElementById("user").remove();

    if (response) {
        document.getElementById("ac-path").style.fill = "#3cab66";
        let string = `<div id="user"></div>`;
        primary.insertAdjacentHTML("afterbegin", string);

        let next = await getList();

        while (next !== false)
            next = next === "continue" ? await getCont() : await userFunc(next);


    } else window.location.reload();
}

const searchRes = async value => {
    search.bool = true;
    if (value.length) {
        let matches = await sFetch('info/search/' + value);
        if (matches.length) {
            matches = matches.search(value).splice(0, 16);
            showHtml(matches);
        } else
            search.output.style.display = "none";
    } else
        search.output.style.display = "none";
}

const showHtml = matches => {
    if (matches.length > 0) {
        search.result.innerHTML = matches.map(match => `
        <li data-id="${match.tmdb_id}" class="searchRes">
            <img class="info searchImages" src="" alt="${(match.type === 1 ? "m" : "s") + match.tmdb_id}">
            <span>${match.name}</span>
        </li>
        `).join('');

        search.output.style.display = "block";
    }
}

const showImages = () => {
    let link = "images/search/";
    let images = document.querySelectorAll('.searchImages');

    images.forEach(image => {
        image.src = link + image.attributes['alt'].nodeValue;
    });
}

async function sFetch(url) {
    return await fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data === false)
                window.location.reload();
            return data;
        })
        .catch(reason => console.log(reason));
}

const stringToHTML = function (str) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(str, 'text/html');
    return doc.body.firstChild;
}

async function pFetch(url, data) {
    return await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: data
    }).then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(reason => console.log(reason));
}

const confirmAuth = key => {
    let result = false;
    let rgx = new RegExp(/^[A-Za-z0-9]{1,4}$/);
    let nonRgx = new RegExp(/[$-/:-?{-~!"^_`\[\]\s+]/);
    if ((key.length % 5 === 0 && key.charAt(key.length - 1) === "-") || key.length > 5) {
        let matches = key.split('-');
        matches.forEach(match => {
            if (match !== '') result = rgx.test(match) && !nonRgx.test(match);
        });

    } else if (key.length < 5)
        result = rgx.test(key) && !nonRgx.test(key);

    return result;
}

const takeFive = (array, int) => {
    int = int >= array.length ? array.length : int;
    let res = array.slice(0, int);
    array = array.slice(int, int + array.length)
    return {result: res, left: array};
}

const verify = async () => {
    let check = await sFetch("auth/verify");
    if (!check) window.location.reload();
    else loadModals(logout);
}

const loadModals = (object, callback) => {
    object.block.removeAttribute("class");
    object.block.setAttribute("style", "opacity: 1; z-index: 99999999");
    object.container.setAttribute("style", "transform: translateY(0);")

    object.block.addEventListener("click", event => {
        if (!object.container.contains(event.target) || object.deny.contains(event.target)) {
            object.block.setAttribute("class", "fadeLoader");
            setTimeout(() => {
                object.container.removeAttribute("style");
                object.block.removeAttribute("style");
                callback(object);
            }, 200)
        }
    });
}

const slideView = direction => {
    let array = [];
    let searchResult = document.querySelectorAll('.searchRes');
    if (direction === 'down') {
        array.push(searchResult.length - 1);
        for (let i = 0; i < searchResult.length - 1; i++)
            array.push(i)

    } else if (direction === 'up') {
        for (let i = 1; i < searchResult.length; i++)
            array.push(i)
        array.push(0);
    }

    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length; j++) {
            if (i === array[j]) {
                search.result.appendChild(searchResult[j]);
                break;
            }
        }
    }

    searchResult = document.querySelectorAll('.searchRes');
    searchResult[0].setAttribute('id', 'searchHover');
}

$(document).ready(async function () {
    if (window.history.state !== null)
        manageHistory(window.history.state, true)
            .catch(err => {
                console.error(err)
                handleHistory('nino', 'home', 'nino', '/');
                loader.fade()
            });

    else if (window.location.pathname !== "/") {
        let pathname = window.location.pathname;
        pathname = pathname.replace(/\?.*clid[^"]+/, "");
        pathname = pathname.replace('/', '');
        let object = pathname.split(/=/);
        object = {type: object[0], value: object[1]};

        if (object.type === 'movie' || object.type === 'show') {
            object.value = await sFetch(`info/url/${object.type}/${object.value}`);
            object.type = 'info';
        } else if (object.type === 'watch')
            object.value = await sFetch("info/watch/" + object.value);

        manageHistory(object, true)
            .catch(err => {
                console.error(err)
                handleHistory('nino', 'home', 'nino', '/');
                loader.fade()
            });
    }

    let next = await bannerLoad();
    await loggedInLoader();
    while (next !== false)
        next = await loadFunction(next);

    loader.fade();
});

$(document).on("click", ".info", async function (event) {
    loader.display();
    let link = event.currentTarget.attributes["alt"].nodeValue;
    let response = await sFetch(`info/${link}`);
    ssd.name = response.name;
    handleHistory("info", (response.type === "movie" ? "m" : "s") + response.id, response.name, (response.type === "movie" ? "movie" : "show") + '=' + response.name.replace(/ /g, '+'));
    buildInfo(response);
});

$(document).on("click", ".options", (e) => {
    let link = e.currentTarget.attributes["data-id"].nodeValue;
    if (link === "More like this" || link === "Surprise me!" || link === "Seasons") {
        const body = $("#info-holder");
        if (body.scrollTop() === 0)
            handleOptions(link);
        else
            body.stop().animate({scrollTop: 0}, 400, 'swing', function () {
                handleOptions(link);
            })
    } else if (link === "Details" || link === "Videography" || link === "Overview")
        handleOptions(link);
});

$(document).on("click", ".episodes", async e => {
    let link = e.currentTarget.attributes["data-id"].nodeValue;
    infoBlock.closeSeason.style.display = "block";
    infoBlock.section.innerHTML = ssd.show.seasons.map(item => `<li class="${item === link ? "info-active episodes" : "info-passive episodes"}" data-id="${item}">${item}</li>`).join('');

    infoBlock.suggestion.innerHTML = `
        <span id="loading-span">Loading...</span>
    `;

    let url = "info/episodes/" + ssd.info_id + "/" + link.replace("Season ", "");
    let response = await sFetch(url);
    if (infoBlock.closeSeason.style.display !== "none") {
        if (!response.hasOwnProperty('error'))
            infoBlock.suggestion.innerHTML = response.map(item => `
                <li class="play" data-id="e${item.id}">
                    <img class="epIMG" src="${item.poster}" alt="e${item.id}">
                    <div class="epiOverview"><p>${item.overview}</p></div>
                    <div class="progress-groove" style="display: ${item.position === 0 ? "none" : "flex"}"><div class="progress-fill" style="width: ${item.position}%"></div></div>
                    <span>${item.name}</span>
                </li>
            `).join('');

        else infoBlock.suggestion.innerHTML = `<span id="loading-span">${response.error}</span>`;
        infoBlock.suggestion.setAttribute("class", "showLoader seasons");
    }
});

$(document).on("click", ".person", async e => {
    let link = e.currentTarget.attributes["data-id"].nodeValue;
    let response = await sFetch("info/person/" + link);
    handleHistory("person", link, response.name, "person=" + link);
    buildPerson(response);
})

$(document).on("click", ".prodCompany", async e => {
    let link = e.currentTarget.attributes["data-id"].nodeValue;
    let response = await sFetch("info/prod/" + link);
    handleHistory("prod", link, response.name, "prod=" + link);
    buildProd(response);
})

$(document).on("mouseenter", ".editors-inner-div", async event => {
    let id = event.currentTarget.parentElement.attributes["alt"].nodeValue;
    let key = event.currentTarget.parentElement.attributes["data-id"].nodeValue;

    myFrame.id = id;
    myFrame.MouseOver = true;
    let string = `<div class="editors-hover">
                        <iframe width="100%" height="100%" type="text/html" src="https://www.youtube.com/embed/${key}?autoplay=1&mute=1&controls=0" frameborder="0" allow="autoplay;"></iframe>
                 </div>`;

    setTimeout(function () {
        if (myFrame.MouseOver && myFrame.id === id) event.currentTarget.insertAdjacentHTML('beforeend', string);
    }, 1200);
})

$(document).on("click", ".searchRes", function (e) {
    e.currentTarget.childNodes[1].click();
});

$(document).on("mouseleave", ".editors-inner-div", async event => {
    myFrame.MouseOver = false;
    let list = document.querySelectorAll('.editors-hover');
    if (list.length > 0) list.forEach(div => {
        div.remove();
    });
})

$(document).on("click", "#account-image", () => verify());

logout.confirm.onclick = () => {
    setTimeout(() => {
        logout.container.removeAttribute("style");
        logout.block.removeAttribute("style");
        setTimeout(async () => {
            await sFetch("auth/logout");
            localStorage.removeItem('app_id');
            window.location.reload();
        }, 50)
    }, 200)
}

infoBlock.closeSeason.onclick = () => handleOptions("Seasons");

search.input.addEventListener('keyup', async function (event) {
    let searchResult = document.querySelectorAll('.searchRes');
    if (event.code === 'ArrowUp') {
        if (searchResult.length) {
            if (document.getElementById('searchHover'))
                document.getElementById('searchHover').removeAttribute('id')

            slideView('up')
        }

    } else if (event.code === 'ArrowDown') {
        if (searchResult.length) {
            if (document.getElementById('searchHover'))
                document.getElementById('searchHover').removeAttribute('id')

            slideView('down')
        }

    } else {
        await searchRes(search.input.value)
        clearTimeout(search.doneTyping);
        search.doneTyping = setTimeout(showImages, 500);
    }
});

search.input.addEventListener('keydown', function () {
    clearTimeout(search.doneTyping);
});

infoBlock.back.onclick = () => {
    if (myFrame.trailer)
        destroyTrailer();

    else {
        if (personInfo.box.classList.contains("fadeLoader") && prod.box.classList.contains("fadeLoader")) {
            infoBlock.block.setAttribute("class", "fadeLoader");
            document.body.style.overflow = "auto";
            handleHistory('nino', 'home', 'nino', '/');
        } else {
            personInfo.box.setAttribute("class", "fadeLoader");
            prod.box.setAttribute("class", "fadeLoader");
            infoBlock.box.setAttribute("class", "showLoader");
            handleHistory("info", (ssd.show === undefined ? "m" : "s") + ssd.info_id, ssd.name, (ssd.show === undefined ? "movie" : "show") + '=' + ssd.name.replace(/ /g, '+'));
        }
    }
}

infoBlock.review_groove.onclick = async event => {
    let pos = infoBlock.review_groove.getBoundingClientRect();
    pos = ((event.clientX - pos.left) / (pos.right - pos.left)) * 100;
    infoBlock.review.style.width = pos + '%';
    let url = 'info/rate/' + (ssd.show === undefined ? 'm' : 's') + ssd.info_id + '/' + (pos / 10);
    url = await sFetch(url);
    infoBlock.review.setAttribute('myRating', (url * 10) + '%');
}

addToList.holder.onclick = async () => {
    let id = addToList.holder.attributes["data-id"].nodeValue;
    let response = await sFetch("info/myList/" + id);

    if (response === "added") {
        addToList.holder.setAttribute("class", "remove-myList");
        addToList.tick.removeAttribute("style");
        addToList.plus.style.display = "none";
    } else {
        addToList.holder.setAttribute("class", "nino");
        addToList.plus.style.display = "block";
        addToList.tick.style.display = "none";
    }

    await getList();
}

infoBlock.trailer.onclick = event => {
    let string = `<div id="player" style="opacity: 0"></div>`;
    let link = event.currentTarget.attributes["data-id"].nodeValue;
    document.getElementById('info-background').insertAdjacentHTML('beforeend', string);
    myFrame.trailer = true;
    myFrame.player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: link,
        playerVars: {
            controls: 0,
            enablejsapi: 1,
            modestbranding: 1
        },
        events: {
            onReady: playYoutubeVideo,
            onStateChange: endVideo
        }
    });
}

infoBlock.rate_it.onmouseover = async () => {
    infoBlock.review_label.innerText = 'Rate it:';
    infoBlock.review.setAttribute('data-id', infoBlock.review.style.width);
    infoBlock.review.style.width = infoBlock.review.attributes['myRating'].nodeValue;
}

infoBlock.rate_it.onmouseout = () => {
    infoBlock.review_label.innerText = 'Rating';
    infoBlock.review.style.width = infoBlock.review.attributes['data-id'].nodeValue;
}

document.getElementById("movies-list").onscroll = async () => {
    let scroll = document.getElementById("movies-list").scrollWidth - document.getElementById("movies-list").scrollLeft - document.getElementById("movies-list").offsetWidth;
    if (scroll === 0) {
        let {result, left} = takeFive(ssd.movies, 10)
        ssd.movies = left;
        loadList(result, document.getElementById("movies-list"));
    }
}

document.getElementById("tv-list").onscroll = async () => {
    let scroll = document.getElementById("tv-list").scrollWidth - document.getElementById("tv-list").scrollLeft - document.getElementById("tv-list").offsetWidth;
    if (scroll === 0) {
        let {result, left} = takeFive(ssd.tvShows, 10)
        ssd.tvShows = left;
        loadList(result, document.getElementById("tv-list"));
    }
}

window.addEventListener('blur', async () => {
    if (myFrame.MouseOver) {
        loader.display();
        $(".editors-hover").trigger('mouseleave');
        let response = await sFetch(`info/${myFrame.id}`);
        ssd.name = response.name;
        handleHistory("info", (response.type === "movie" ? "m" : "s") + response.id, response.name, (response.type === "movie" ? "movie" : "show") + '=' + response.name.replace(/ /g, '+'));
        buildInfo(response);
    } else if (myFrame.trailer) {
        destroyTrailer();
    }
});

window.addEventListener("popstate", async e => {
    await manageHistory(e.state);
});

search.form.onsubmit = ev => {
    ev.preventDefault();
    let search = document.querySelectorAll('.searchRes');
    if (search.length)
        search[0].click();
    else
        document.body.click();
}

document.addEventListener("click", function (event) {
    if (!search.output.contains(event.target) && search.bool && !search.input.contains(event.target)) {
        search.output.style.display = "none";
        search.input.value = '';
        search.bool = false;
        search.input.blur();
    }
});

document.oncontextmenu = (e) => {
    e.preventDefault();
}

window.ondragstart = function () {
    return false;
}
