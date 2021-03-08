const loader = {
    loader: document.getElementById("loader-background"),
    backLoader: document.getElementById('background'),
    display: function () {
        this.loader.setAttribute("class", "showLoader");
    }, fade: function () {
        this.loader.setAttribute("class", "fadeLoader");
    }
}

const hover = document.getElementById('sideHover');
const secondary = document.getElementById('secondary-block')

const download = {
    block: document.getElementById("download-holder"),
    container: document.getElementById("downloadContainer"),
    confirm: document.getElementById("downAccept"),
    deny: document.getElementById("downReject"),
    message: document.getElementById("downMessage-span"),
    input: document.getElementById("auth-key"),
    button: document.getElementById("downloadBtn"),
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
        infoTimeout: null
    }, booleans: {
        recap: false,
        guest: false,
        active: false,
        shuffleMode: false,
        countdownStarted: false
    }, video: document.querySelector('.video-container video'),
    location: false,
    position: 0
}

const sidebar = document.getElementById('sidebar');
const pick = document.getElementById('pick');

let ssd = {movies: false, tvShows: false, images: []};

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

const newVersion = async () => {
    await animateAuth(0);
    loader.fade();
}

const animateAuth = async int => {
    if (int === 0 && document.getElementById("img-3")) {
        ssd.images = await sFetch('load/authImages');
        let poster = document.getElementById("img-3").src;
        let string = '';
        for (let i = 0; i < ssd.images.length; i++)
            if (i === 2)
                string += `<img src="${poster}" id="img-${i}" class="fade_img">`;
            else
                string += `<img src="${ssd.images[i]}" id="img-${i}" class="${i === 3 ? "glow_img" : ""}">`;

        loader.backLoader.innerHTML = string;
        int = 10;

    } else if (int === 0) {
        ssd.images = await sFetch('load/authImages');
        loader.backLoader.innerHTML = ssd.images.map((link, i) =>
            `<img src="${link}" id="img-${i}" class="${i === 3 || i === 2 ? i === 2 ? "fade_img" : "glow_img" : ""}">`
        ).join('');
        int = 10;

    } else
        loader.backLoader.innerHTML = ssd.images.map((link, i) =>
            `<img src="${link}" id="img-${i}" class="${i === 3 || i === 2 ? i === 2 ? "fade_img" : "glow_img" : ""}">`
        ).join('');

    let temp = ssd.images[0];
    ssd.images.shift();
    ssd.images.push(temp);
    setTimeout(() => {
        animateAuth(int - 1);
    }, 6000)
}

const push = async hoc => {
    while (hoc !== false) {
        let {data, next, category, block, position, container} = await sFetch("load/" + hoc);
        let element = document.getElementById(block)
        element.insertAdjacentHTML(position, `<div id="${container}"></div><li class="category" data-id="${next}">${category}</li></div>`);
        ssd[next] = data;
        hoc = next;
    }

    return hoc;
}

const loggedIn = async () => {
    let {data, next} = await sFetch("load/myList");
    sidebar.insertAdjacentHTML("afterbegin", `<div id="user"><div id="myList-container"><li class="category" data-id="list">my list</li></div></div>`);
    ssd.list = data;

    return await push(next);
}

const loadFunc = async () => {
    let {data, next} = await sFetch("load/maix");
    sidebar.insertAdjacentHTML("beforeend", `<div id="primary-block"><div id="maix-container"><li class="category" data-id="maix">maix suggests</li></div></div>`);
    ssd.maix = data;

    return await push(next);
}

$(document).ready(async function () {
    await newVersion();
    await loggedIn()
    await loadFunc()
})

hover.onmouseover = () => {
    if (parseInt($("#secondary-block").css("left")) < 0) {
        hover.style.left = '19%';
        document.getElementById('pane').style.backgroundColor = "rgba(0,0,0,0)";
        pick.innerHTML = `<svg viewBox="0 0 24 24">
           <polyline points="15 18 9 12 15 6"></polyline>
        </svg>`;
        secondary.style.left = '0';
    }
}
secondary.onmouseleave = () => {
    hover.style.left = '0';
    document.getElementById('pane').style.backgroundColor = 'rgba(1, 16, 28, 0.7)';
    pick.innerHTML = `<svg viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>`;


    hover.style.visibility = 'visible';
    sidebar.style.visibility = 'visible';
    secondary.style.width = '20%';
    secondary.style.left = '-20%';
}

$('#search-div').on('click', () => {
    hover.style.visibility = 'hidden';
    sidebar.style.visibility = 'hidden';
    setTimeout(() => {
        secondary.style.width = '80%';
    }, 400);
})
