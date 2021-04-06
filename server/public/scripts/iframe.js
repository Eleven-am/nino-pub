const loader = {
    loader: document.getElementById("loader-background"),
    display: function () {
        this.loader.setAttribute("class", "showLoader");
    }, fade: function () {
        this.loader.setAttribute("class", "fadeLoader");
    }
}

const myFrame = {cjs: null};

const subtitles = {
    trigger: document.getElementById('sub-button'),
    block: document.getElementById('sub-window'),
    none: document.getElementById('nan'),
    english: document.getElementById('eng'),
    french: document.getElementById('fre'),
    german: document.getElementById('ger'),
    shown: false,
}

const upNext = {
    block: document.getElementById("upNextContainer"),
    image: document.getElementById("upNextImg"),
    name: document.getElementById("upNextTitle"),
    overview: document.getElementById("upNextOverview")
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
        castHolder: document.getElementById('castHolder'),
        pauseFlash: document.getElementById("pauseFlash"),
        foncer: document.getElementById('foncer')
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
        airPlay: document.getElementById('airPlay'),
        cast: document.getElementById('castButton'),
        volume: document.getElementById("volume")
    }, infoTexts: {
        info: document.getElementById("video-info"),
        information: document.querySelector("#video-info .information"),
        timeSeen: document.getElementById("timeSeen"),
        countdown: document.getElementById("countDown"),
        title: document.getElementById("video-title"),
        timeLeft: document.getElementById("time-left"),
        castName: document.getElementById('castDevice'),
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
    activeSub: 'na',
    subs: [],
    myFrame: {
        trailer: false,
        trailers: [],
        player: null
    },
    position: 0
}

Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get: function () {
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 3);
    }
})

const modifyPLayPause = () => {
    if (!ninoPlayer.video.paused) {
        if (!(myFrame.cjs && myFrame.cjs.connected)) {
            ninoPlayer.uiBlocks.playFlash.setAttribute("class", "flash");
            setTimeout(() => {
                ninoPlayer.uiBlocks.playFlash.removeAttribute("class");
            }, 400);
        }
        ninoPlayer.buttons.play.pauseButton.removeAttribute("style");
        ninoPlayer.buttons.play.playButton.style.display = 'none';
        showInfo();
    } else {
        if (!(myFrame.cjs && myFrame.cjs.connected)) {
            ninoPlayer.uiBlocks.pauseFlash.setAttribute("class", "flash");
            setTimeout(() => {
                ninoPlayer.uiBlocks.pauseFlash.removeAttribute("class");
            }, 400);
        }
        ninoPlayer.buttons.play.playButton.removeAttribute("style");
        ninoPlayer.buttons.play.pauseButton.style.display = 'none';
    }

}

const playPause = () => {
    if (ninoPlayer.video.paused)
        ninoPlayer.video.play();
    else
        ninoPlayer.video.pause();

    if (myFrame.cjs && myFrame.cjs.connected)
        myFrame.cjs.playPause();
}

const muteUnmute = () => {
    if (ninoPlayer.video.muted) ninoPlayer.sliders.volumeFill.style.width = "0";
    else ninoPlayer.sliders.volumeFill.style.width = (ninoPlayer.video.volume * 100) + "%";

    if (myFrame.cjs && myFrame.cjs.connected)
        myFrame.cjs.muteUnmute();
    else
        ninoPlayer.video.muted = !ninoPlayer.video.muted;
}

const displayControls = () => {
    ninoPlayer.uiBlocks.controls.style.opacity = '1';
    ninoPlayer.uiBlocks.holder.style.cursor = "auto";
    ninoPlayer.video.style.cursor = "auto";
    if (ninoPlayer.timers.controlsTimeout)
        clearTimeout(ninoPlayer.timers.controlsTimeout);

    ninoPlayer.timers.controlsTimeout = setTimeout(() => {
        ninoPlayer.uiBlocks.controls.style.opacity = '0';
        subtitles.block.style.opacity = "0";
        subtitles.block.style.zIndex = "-999999";
        subtitles.shown = false;
        upNext.block.style.opacity = "0";
        upNext.block.style.zIndex = "-999999";

        if (ninoPlayer.booleans.active) {
            ninoPlayer.uiBlocks.holder.style.cursor = "none";
            ninoPlayer.video.style.cursor = "none";
        }

    }, 5000);
    showInfo();
}

const showInfo = () => {
    ninoPlayer.infoTexts.information.classList.remove("slideRight");
    ninoPlayer.infoTexts.information.classList.add("slideLeft");

    setTimeout(() => {
        ninoPlayer.infoTexts.info.style.opacity = "0";
        ninoPlayer.infoTexts.info.style.zIndex = "-999";
    }, 200);

    if (ninoPlayer.timers.infoTimeout)
        clearTimeout(ninoPlayer.timers.infoTimeout);

    ninoPlayer.timers.infoTimeout = setTimeout(() => {
        if (ninoPlayer.video.paused) {
            ninoPlayer.infoTexts.information.classList.remove("slideLeft");
            ninoPlayer.infoTexts.info.style.zIndex = "999";
            ninoPlayer.infoTexts.info.style.opacity = '1';
            ninoPlayer.infoTexts.information.classList.add("slideRight");
        }
    }, 10000);
}

function playYoutubeVideo() {
    ninoPlayer.myFrame.player.setVolume(0);
    ninoPlayer.myFrame.player.playVideo();
    document.getElementById('player').setAttribute('class', 'glow_input');
    //infoBlock.backdrop.setAttribute("class", "fade_image");
    //infoBlock.box.setAttribute("class", "fade_input");
    ninoPlayer.myFrame.player.setVolume(50);
}

function endVideo(event) {
    if (event.data === 0) {
        //infoBlock.backdrop.setAttribute("class", "glow_image");
        //infoBlock.box.setAttribute("class", "glow_input");
        document.getElementById('player').setAttribute('class', 'fade_input');
        ninoPlayer.myFrame.trailer = false;
        ninoPlayer.myFrame.player.destroy();
        ninoPlayer.myFrame.player = null;
    }
}

const playTrailer = link => {
    let string = `<div id="player" style="opacity: 0"></div>`;
    ninoPlayer.uiBlocks.block.insertAdjacentHTML('afterbegin', string);
    ninoPlayer.myFrame.trailer = true;
    ninoPlayer.myFrame.player = new YT.Player('player', {
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

const buildVideo = async (response, subs) => {
    ninoPlayer.uiBlocks.previewFrame.src = response.backdrop;
    ninoPlayer.uiBlocks.overview.innerText = response.overview;
    ninoPlayer.video.src = 'iframe/' + response.location;
    ninoPlayer.location = response.location;

    if (response.episodeName !== undefined) {
        ninoPlayer.infoTexts.lower_title.innerText = response.episodeName;
        ninoPlayer.infoTexts.lower_title.style.display = "block";
    } else
        ninoPlayer.infoTexts.lower_title.style.display = "none";

    ninoPlayer.video.volume = 0.5;
    ninoPlayer.booleans.guest = response.guest;
    ninoPlayer.booleans.recap = response.type === 0;
    ninoPlayer.booleans.shuffleMode = response.shuffleMode;
    ninoPlayer.myFrame.trailers = response.trailers
    let base = window.location.protocol + '//' + window.location.host + '/';
    ninoPlayer.infoTexts.title.innerText = response.name;
    ninoPlayer.uiBlocks.buffer.style.display = "block";
    ninoPlayer.uiBlocks.previewFrame.style.display = "block";
    ninoPlayer.uiBlocks.logo.innerHTML = '';
    if (response.logo !== "")
        ninoPlayer.uiBlocks.logo.innerHTML = `<img id="fullContentLogo" src="${response.logo}" alt="">`;
    else
        ninoPlayer.uiBlocks.logo.innerHTML = `<label id="fullContentLogo">${response.name}</label>`;

    ninoPlayer.booleans.active = true;
    ninoPlayer.video.classList.remove("shrinkOut");
    ninoPlayer.uiBlocks.previewFrame.classList.remove("shrinkOut");
    ninoPlayer.uiBlocks.controls.classList.remove("slideLeftDo");
    ninoPlayer.uiBlocks.block.style.display = "block";

    let array = ['eng', 'fre', 'ger'];
    let keys = ['en', 'fr', 'de'];
    let label = ['English', 'Français', 'Deutsch'];
    ninoPlayer.subs.push('na');
    array.forEach((val, index) => {
        if (subs[val] !== undefined) {
            ninoPlayer.subs.push(keys[index]);
            let string = `<track kind="subtitles" label="${label[index]}" srcLang="${keys[index]}" src="${subs[val]}"/>`
            ninoPlayer.video.insertAdjacentHTML('beforeend', string);
            document.getElementById(val).removeAttribute('style');

        } else
            document.getElementById(val).style.display = 'none';
    });

    ninoPlayer.infoTexts.info.style.opacity = "0";
    ninoPlayer.infoTexts.info.style.zIndex = "-999";
    ninoPlayer.uiBlocks.controls.style.opacity = '1';

    ninoPlayer.video.onloadedmetadata = async () => {
        loadCast()
        loadAirplay()
        ninoPlayer.video.currentTime = (response.position / 1000) * ninoPlayer.video.duration;
        ninoPlayer.uiBlocks.playFlash.style.opacity = '1';
        ninoPlayer.uiBlocks.playFlash.style.zIndex = '99';
        ninoPlayer.uiBlocks.playFlash.style.cursor = 'pointer';
        ninoPlayer.uiBlocks.buffer.style.display = "none";
        ninoPlayer.uiBlocks.controls.style.opacity = '0';
        if (myFrame.cjs && myFrame.cjs.connected) {
            myFrame.cjs.castTwo(ninoPlayer.video, {base, auth: response.location});
            ninoPlayer.uiBlocks.castHolder.style.display = 'block';
        }
    }

    loader.fade();
}

const loadAirplay = () => {
    if (window.WebKitPlaybackTargetAvailabilityEvent) {
        ninoPlayer.video.addEventListener('webkitplaybacktargetavailabilitychanged', function (event) {
            switch (event.availability) {
                case "available":
                    ninoPlayer.buttons.airPlay.removeAttribute('style');
                    break;
                case "not-available":
                    ninoPlayer.buttons.airPlay.style.display = 'none';
                    ninoPlayer.buttons.airPlay.style.visibility = 'hidden';
                    break;
            }
        });

        ninoPlayer.buttons.airPlay.onclick = () => {
            ninoPlayer.video.webkitShowPlaybackTargetPicker();
        }

        ninoPlayer.video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', function (event) {
            if (event.target.remote.state === "connected")
                ninoPlayer.buttons.airPlay.style.stroke = 'rgba(144, 197, 240, .9)';
            else
                ninoPlayer.buttons.airPlay.style.stroke = 'rgba(255, 255, 255, .5)';
        });
    } else {
        ninoPlayer.buttons.airPlay.style.display = 'none';
        ninoPlayer.buttons.airPlay.style.visibility = 'hidden';
    }
}

const loadCast = () => {
    let base = window.location.protocol + '//' + window.location.host + '/';
    myFrame.cjs = new Cast();
    ninoPlayer.buttons.cast.style.display = 'none';
    if (myFrame.cjs.available) {
        ninoPlayer.buttons.cast.style.display = 'block';

        ninoPlayer.buttons.cast.onclick = () => {
            myFrame.cjs.cast(ninoPlayer.video, {base, auth: ninoPlayer.location});
        }

        myFrame.cjs.on('connect', () => {
            ninoPlayer.video.muted = true;
            ninoPlayer.buttons.cast.style.stroke = 'rgba(144, 197, 240, .9)';
            ninoPlayer.buttons.cast.style.display = 'block';
            ninoPlayer.uiBlocks.previewFrame.style.display = "block";
            ninoPlayer.uiBlocks.castHolder.style.display = "block";
            ninoPlayer.infoTexts.castName.innerText = myFrame.cjs.device;
        })

        myFrame.cjs.on('disconnect', event => {
            event = ninoPlayer.userChromeCast ? ninoPlayer.userChromeCast : event;
            let pos = event.volume;
            ninoPlayer.video.currentTime = event.time;
            ninoPlayer.video.muted = event.muted;
            ninoPlayer.buttons.cast.style.stroke = 'rgba(255, 255, 255, .5)';
            ninoPlayer.uiBlocks.castHolder.style.display = "none";
            ninoPlayer.video.volume = pos;
            if (event.paused !== ninoPlayer.video.paused)
                playPause()
        })

        myFrame.cjs.on('durationChanged', event => {
            ninoPlayer.userChromeCast = event.hasOwnProperty('time') && event.time > 0 ? event : ninoPlayer.userChromeCast;
        })

        myFrame.cjs.on('timeupdate', event => {
            ninoPlayer.userChromeCast = event.hasOwnProperty('time') && event.time > 0 ? event : ninoPlayer.userChromeCast;
            ninoPlayer.video.currentTime = event.time;
        })

        myFrame.cjs.on('end', event => {
            ninoPlayer.userChromeCast = event.hasOwnProperty('time') && event.time > 0 ? event : ninoPlayer.userChromeCast;
        })

        myFrame.cjs.on('buffering', event => {
            ninoPlayer.userChromeCast = event.hasOwnProperty('time') && event.time > 0 ? event : ninoPlayer.userChromeCast;
            ninoPlayer.uiBlocks.foncer.style.display = "block";
            ninoPlayer.video.pause()
        })

        myFrame.cjs.on('playing', event => {
            ninoPlayer.video.play()
            ninoPlayer.userChromeCast = event.hasOwnProperty('time') && event.time > 0 ? event : ninoPlayer.userChromeCast;
            ninoPlayer.uiBlocks.foncer.style.display = "none";
            ninoPlayer.uiBlocks.castHolder.style.display = "block";
        })

        myFrame.cjs.on('paused', event => {
            ninoPlayer.video.pause()
            ninoPlayer.userChromeCast = event.hasOwnProperty('time') && event.time > 0 ? event : ninoPlayer.userChromeCast;
        })

        myFrame.cjs.on('namespace', event => console.log(event))

        myFrame.cjs.on('error', event => console.log(event));
    }
}

const toggleFullScreen = () => {
    if (!document.webkitFullscreenElement) {
        ninoPlayer.uiBlocks.holder.webkitRequestFullScreen();
        ninoPlayer.buttons.fullScreen.maximizeButton.style.display = 'none';
        ninoPlayer.buttons.fullScreen.minimizeButton.style.display = '';
    } else {
        document.webkitCancelFullScreen();
        ninoPlayer.buttons.fullScreen.maximizeButton.style.display = '';
        ninoPlayer.buttons.fullScreen.minimizeButton.style.display = 'none';
    }
}

const hideSubs = () => {
    ninoPlayer.activeSub = 'na';
    let tracks = ninoPlayer.video.textTracks;
    for (let track of tracks)
        track.mode = "hidden";

    subtitles.block.style.opacity = "0";
    subtitles.block.style.zIndex = "-999999";
    subtitles.shown = false;
}

const showSub = language => {
    ninoPlayer.activeSub = language;
    let tracks = ninoPlayer.video.textTracks;
    for (let track of tracks)
        if (track.language === language)
            track.mode = 'showing';
        else
            track.mode = "hidden";
}

const switchSubs = () => {
    let index = -1;
    for (let i = 0; i < ninoPlayer.subs.length; i++)
        if (ninoPlayer.subs[i] === ninoPlayer.activeSub) {
            index = i + 1;
            break;
        }

    index = index === ninoPlayer.subs.length ? 0 : index;
    if (index === 0) hideSubs()
    else showSub(ninoPlayer.subs[index]);
}

const informDB = async () => {
    let position = (ninoPlayer.position / ninoPlayer.video.duration) * 1000;
    await pFetch('iframe/inform', JSON.stringify({cypher: ninoPlayer.location, position}));
}

async function sFetch(url) {
    return await fetch(url)
        .then(response => response.json())
        .then(data => {
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

$(document).ready(async function () {
    let pathname = window.location.pathname;
    pathname = pathname.replace(/\?.*clid[^"]+/, "");
    pathname = pathname.replace('/', '');
    let object = pathname.split(/=/);
    object = {type: object[0], value: object[1]};
    let response = await sFetch('iframe/decrypt/' + object.value);
    let subtitles = await sFetch("watch/subs/" + response.location);
    ninoPlayer.buttons.airPlay.style.display = 'none';
    ninoPlayer.buttons.cast.style.display = 'none';
    ninoPlayer.location = object.value;
    await buildVideo(response, subtitles)
    showInfo();
})

$('.subs').on("click", async event => {
    let language = event.currentTarget.attributes["data-id"].nodeValue;
    showSub(language);
})

document.addEventListener('keyup', async event => {
    if (ninoPlayer.booleans.active) {
        if (event.code === 'Space')
            playPause();

        if (event.code === 'KeyM')
            muteUnmute();

        if (event.code === 'ArrowUp') {
            ninoPlayer.video.muted = false;
            ninoPlayer.video.volume += 0.1;
            ninoPlayer.sliders.volumeFill.style.width = (ninoPlayer.video.volume * 100) + "%";
        }

        if (event.code === 'ArrowDown') {
            ninoPlayer.video.muted = false;
            ninoPlayer.video.volume -= 0.1;
            ninoPlayer.sliders.volumeFill.style.width = (ninoPlayer.video.volume * 100) + "%";
        }

        if (event.code === 'KeyF')
            toggleFullScreen();

        if (event.code === 'KeyS')
            switchSubs();

        if (event.code === 'ArrowLeft')
            ninoPlayer.video.currentTime -= 30;

        if (event.code === 'ArrowRight')
            ninoPlayer.video.currentTime += 30;

        if (event.code === "Escape")
            await destroyVideo();

        if (event.code !== 'KeyS')
            displayControls();
    }
});

ninoPlayer.uiBlocks.block.onmousemove = () => displayControls();

ninoPlayer.buttons.recap.onclick = () => {
    ninoPlayer.video.currentTime = 65;
}

ninoPlayer.buttons.next.onmouseover = () => {
    subtitles.block.style.opacity = "0";
    subtitles.block.style.zIndex = "-999999";
    subtitles.shown = false;
    upNext.block.style.opacity = "1";
    upNext.block.style.zIndex = "999999";
}

ninoPlayer.buttons.next.onmouseout = () => {
    upNext.block.style.opacity = "0";
    upNext.block.style.zIndex = "-999999";
}

ninoPlayer.buttons.next.onclick = () => nextLoader();

subtitles.trigger.onclick = () => {
    if (subtitles.shown) {
        subtitles.block.style.opacity = "0";
        subtitles.block.style.zIndex = "-999999";
        subtitles.shown = false;

    } else {
        subtitles.block.style.opacity = "1";
        subtitles.block.style.zIndex = "999999";
        subtitles.shown = true;
    }
}

subtitles.none.onclick = () => hideSubs();

ninoPlayer.video.onwaiting = () => {
    if (!(myFrame.cjs && myFrame.cjs.connected))
        ninoPlayer.uiBlocks.foncer.style.display = "block";
}

ninoPlayer.buttons.rewind.onclick = () => {
    ninoPlayer.video.currentTime -= 10;
};

ninoPlayer.buttons.volume.onclick = () => muteUnmute();

ninoPlayer.buttons.play.play.onclick = () => playPause();

ninoPlayer.buttons.fastForward.onclick = () => {
    ninoPlayer.video.currentTime += 10;
}

ninoPlayer.buttons.fullScreen.fullScreenButton.onclick = () => toggleFullScreen();

ninoPlayer.buttons.back.onclick = () => destroyVideo();

ninoPlayer.uiBlocks.foncer.onclick = () => {
    if (!ninoPlayer.video.onwaiting()) {
        playPause();
        showInfo();
    }
}

ninoPlayer.video.onclick = () => {
    playPause();
    showInfo();
}

ninoPlayer.video.ontimeupdate = async () => {
    ninoPlayer.sliders.progressFill.style.width = ((ninoPlayer.video.currentTime / ninoPlayer.video.duration) * 100) + '%';

    const duration = new Date(null);
    duration.setSeconds(ninoPlayer.video.currentTime);
    const timeViewed = (ninoPlayer.video.currentTime >= 3600) ? duration.toISOString().substr(12, 7) : duration.toISOString().substr(14, 5);

    const totalSecondsRemaining = ninoPlayer.video.duration - ninoPlayer.video.currentTime;
    const time = new Date(null);
    time.setSeconds(totalSecondsRemaining);
    ninoPlayer.infoTexts.timeLeft.textContent = (totalSecondsRemaining >= 3600) ? time.toISOString().substr(12, 7) : time.toISOString().substr(14, 5);
    ninoPlayer.infoTexts.timeSeen.textContent = timeViewed;

    if (myFrame.cjs && myFrame.cjs.connected)
        ninoPlayer.video.muted = true;

    if (ninoPlayer.video.playing) {
        ninoPlayer.uiBlocks.playFlash.removeAttribute('style');
        ninoPlayer.uiBlocks.foncer.style.display = "none";

        if (!(myFrame.cjs && myFrame.cjs.connected))
            ninoPlayer.uiBlocks.previewFrame.style.display = "none";
    }

    if (ninoPlayer.video.currentTime > 60 + ninoPlayer.position || ninoPlayer.video.currentTime < ninoPlayer.position) {
        ninoPlayer.position = ninoPlayer.video.currentTime;
        await informDB();
    }

    if (ninoPlayer.booleans.recap && ninoPlayer.video.currentTime < 60) {
        ninoPlayer.buttons.recap.style.display = "block";
        document.getElementById("fullContentLogo").style.visibility = "hidden";
    } else {
        ninoPlayer.buttons.recap.style.display = "none";
        document.getElementById("fullContentLogo").style.visibility = "visible";
    }

    showInfo();
}

ninoPlayer.video.onseeking = () => {
    if (myFrame.cjs && myFrame.cjs.connected)
        myFrame.cjs.seek(ninoPlayer.video.currentTime)
}

ninoPlayer.video.onplay = () => modifyPLayPause();

ninoPlayer.video.onpause = () => modifyPLayPause()

ninoPlayer.sliders.progressGroove.onclick = event => {
    let pos = ninoPlayer.sliders.progressGroove.getBoundingClientRect();
    pos = ((event.clientX - pos.left) / (pos.right - pos.left));
    ninoPlayer.video.currentTime = pos * ninoPlayer.video.duration
}

ninoPlayer.sliders.volumeGroove.onclick = event => {
    let pos = ninoPlayer.sliders.volumeGroove.getBoundingClientRect();
    pos = ((event.clientX - pos.left) / (pos.right - pos.left));
    ninoPlayer.video.volume = pos;
}

ninoPlayer.video.onvolumechange = () => {
    let pos = ninoPlayer.video.volume;
    ninoPlayer.sliders.volumeFill.style.width = (pos * 100) + '%';
    if (myFrame.cjs && myFrame.cjs.connected)
        myFrame.cjs.volume(pos);
}

ninoPlayer.uiBlocks.playFlash.onclick = () => {
    ninoPlayer.video.play();
}

ninoPlayer.buttons.back.onclick = async () => {
    if (myFrame.cjs && myFrame.cjs.connected)
        await myFrame.cjs.disconnect();

    window.location.href = '/';
}