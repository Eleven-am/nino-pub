Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get: function () {
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 3);
    }
})

const buildVideo = async (response, next, subs) => {
    upNext.image.src = !next.hasOwnProperty('error')? next.backdrop: 'images/meta';
    upNext.name.innerText = !next.hasOwnProperty('error')? next.name: 'Something went wrong';
    upNext.overview.innerText = !next.hasOwnProperty('error')? next.overview: next.error;
    ninoPlayer.buttons.next.setAttribute('data-id', next.play);
    ninoPlayer.uiBlocks.previewFrame.src = response.backdrop;
    ninoPlayer.uiBlocks.overview.innerText = response.overview;
    ninoPlayer.video.src = 'stream/' + response.location;

    if (response.episodeName !== undefined) {
        ninoPlayer.infoTexts.lower_title.innerText = response.episodeName;
        ninoPlayer.infoTexts.lower_title.style.display = "block";
    } else
        ninoPlayer.infoTexts.lower_title.style.display = "none";

    ninoPlayer.location = response.location;
    ninoPlayer.video.volume = 0.5;
    ninoPlayer.booleans.guest = response.guest;
    ninoPlayer.booleans.recap = response.type === 0;
    ninoPlayer.booleans.active = true;
    ninoPlayer.booleans.shuffleMode = response.shuffleMode;
    ninoPlayer.infoTexts.title.innerText = response.name;
    ninoPlayer.uiBlocks.buffer.style.display = "block";
    ninoPlayer.uiBlocks.previewFrame.style.display = "block";
    ninoPlayer.uiBlocks.logo.innerHTML = '';
    if (response.logo !== "")
        ninoPlayer.uiBlocks.logo.innerHTML = `<img id="fullContentLogo" src="${response.logo}" alt="">`;
    else
        ninoPlayer.uiBlocks.logo.innerHTML = `<label id="fullContentLogo">${response.name}</label>`;

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

    displayControls();

    ninoPlayer.video.onloadedmetadata = async () => {
        if (!share.active && !download.active){
            ninoPlayer.video.currentTime = ninoPlayer.position = (response.position / 1000) * ninoPlayer.video.duration;
            ninoPlayer.video.autoplay = true;
            ninoPlayer.buttons.play.pauseButton.style.display = '';
            ninoPlayer.buttons.play.playButton.style.display = 'none';
        }
    }

    loader.fade();
}

const nextLoader = async () => {
    let link = ninoPlayer.buttons.next.attributes['data-id'].nodeValue;
    if (!ninoPlayer.video.paused) playPause();

    loader.display();
    let response = await sFetch("watch/" + link);
    let next = await sFetch("watch/upNext/" + response.next);
    let name = response.episodeName !== undefined ? response.episodeName : response.name;
    let subtitles = await sFetch("watch/subs/" + response.location);
    handleHistory('watch', link, "\u25B6 " + name, 'watch=' + response.location);
    await getPetitCont();

    ninoPlayer.video.src = "";
    ninoPlayer.video.innerHTML = "";
    upNext.block.style.opacity = "0";
    upNext.block.style.zIndex = "-999999";
    ninoPlayer.sliders.progressFill.style.width = "0%";
    ninoPlayer.sliders.volumeFill.style.width = "50%";
    ninoPlayer.infoTexts.timeSeen.innerHTML = "00:00";
    ninoPlayer.infoTexts.timeLeft.innerHTML = "00:00";
    ninoPlayer.uiBlocks.previewFrame.style.display = "block";
    ninoPlayer.buttons.recap.style.display = "none";
    ninoPlayer.booleans.countdownStarted = false;
    ninoPlayer.subs = [];

    await buildVideo(response, next, subtitles);
}

const destroyVideo = async () => {
    clearInterval(ninoPlayer.timers.infoTimeout);
    if (document.webkitFullscreenElement) toggleFullScreen();
    if (!ninoPlayer.video.paused) playPause();

    let data = await getPetitCont()
    ninoPlayer.video.autoplay = false;
    ninoPlayer.video.src = "";
    ninoPlayer.video.innerHTML = "";

    ninoPlayer.sliders.progressFill.style.width = "0%";
    ninoPlayer.sliders.volumeFill.style.width = "50%";
    ninoPlayer.infoTexts.timeSeen.innerHTML = "00:00";
    ninoPlayer.infoTexts.timeLeft.innerHTML = "00:00";
    ninoPlayer.uiBlocks.previewFrame.style.display = "block";
    ninoPlayer.buttons.recap.style.display = "none";
    ninoPlayer.booleans.active = false;
    ninoPlayer.subs = [];

    if (!infoBlock.block.classList.contains('fadeLoader') && infoBlock.block.style.display === 'block') {
        if (ssd.show === undefined && (data.hasOwnProperty('done') || data.hasOwnProperty('backdrop')) && (ssd.info_id === data.tmdb_id || (data.hasOwnProperty('done') && parseInt(data.done.replace(/m/, '')) === ssd.info_id))) {
            infoBlock.position.style.width = (data.hasOwnProperty('done') ? 100 : data.position / 10) + '%';
            document.getElementById("divider").style.background = "rgba(144, 197, 240, .2)";
        }

        handleHistory("info", (ssd.show === undefined ? "m" : "s") + ssd.info_id, ssd.name, (ssd.show === undefined ? "movie" : "show") + '=' + ssd.name.replace(/ /g, '+'));
    } else
        handleHistory('nino', 'home', 'nino', '/');

    ninoPlayer.video.classList.add("shrinkOut");
    ninoPlayer.uiBlocks.previewFrame.classList.add("shrinkOut");
    ninoPlayer.uiBlocks.controls.classList.add("slideLeftDo");
    document.body.style.overflow = "auto";

    setTimeout(function () {
        ninoPlayer.uiBlocks.block.style.display = "none";
    }, 400);
}

const modifyPLayPause = () => {
    if (!ninoPlayer.video.paused) {
        ninoPlayer.uiBlocks.playFlash.setAttribute("class", "flash");
        setTimeout(() => {
            ninoPlayer.uiBlocks.playFlash.removeAttribute("class");
        }, 400);
        ninoPlayer.buttons.play.pauseButton.removeAttribute("style");
        ninoPlayer.buttons.play.playButton.style.display = 'none';
        showInfo();
    } else {
        ninoPlayer.uiBlocks.pauseFlash.setAttribute("class", "flash");
        setTimeout(() => {
            ninoPlayer.uiBlocks.pauseFlash.removeAttribute("class");
        }, 400);
        ninoPlayer.buttons.play.playButton.removeAttribute("style");
        ninoPlayer.buttons.play.pauseButton.style.display = 'none';
    }
}

const playPause = () => {
    if (ninoPlayer.video.paused)
        ninoPlayer.video.play();
    else
        ninoPlayer.video.pause();
}

const muteUnmute = () => {
    ninoPlayer.video.muted = !ninoPlayer.video.muted;
    if (ninoPlayer.video.muted) ninoPlayer.sliders.volumeFill.style.width = "0";
    else ninoPlayer.sliders.volumeFill.style.width = (ninoPlayer.video.volume * 100) + "%";
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

const informDB = async () => {
    if (ninoPlayer.booleans.active && ninoPlayer.video.playing && !ninoPlayer.booleans.shuffleMode) {
        let position = (ninoPlayer.position / ninoPlayer.video.duration) * 1000;
        await sFetch('watch/inform/' + position + '/' + ninoPlayer.location);
    }
}

const getPetitCont = async () => {
    await informDB();
    let data = await sFetch('watch/loadContinue/' + ninoPlayer.location);
    let element = document.getElementById('continue-list');
    if (element === null) window.location.reload();
    if (data.hasOwnProperty('done') || data.hasOwnProperty('backdrop')) {
        let lists = document.querySelectorAll('#continue-list .info');
        if (data.hasOwnProperty('done'))
            lists.forEach(item => {
                if (item.attributes["alt"].nodeValue === data.done) item.remove();
            });

        else {
            let id = (data.type ? "m" : "s") + data.tmdb_id;
            lists.forEach(item => {
                if (item.attributes["alt"].nodeValue === id) item.remove();
            });
            let string = `<li class="info" alt="${data.type ? "m" + data.tmdb_id : "s" + data.tmdb_id}">
                    <div class="continue-inner-div">
                        <div class="editors-img play" data-id="${data.type ? "m" + data.tmdb_id : "s" + data.tmdb_id}">
                            <img class="editors-backdrop" src="${data.backdrop}" id="${data.type ? "m" + data.tmdb_id : "s" + data.tmdb_id}">
                            ${data.logo !== '' ? `<img class="editors-logo" src="${data.logo}" alt="${data.type ? "m" + data.tmdb_id : "s" + data.tmdb_id}">` : `<span class="editors-label">${data.name}</span>`}
                            <div class="cont-progress-groove" style="display: ${data.position === 0 ? "none" : "flex"}"><div class="progress-fill" style="width: ${data.position === 100 ? 100 : data.position / 10}%"></div></div>
                        </div>
                        <div class="editors-info-div">
                            <span>${data.overview}</span>
                        </div>
                    </div>
                </li>`;
            element.insertAdjacentHTML("afterbegin", string);
        }

        lists = document.querySelectorAll('#continue-list .info')
        lists.length ? document.getElementById('continue-container').removeAttribute('style') : document.getElementById('continue-container').style.display = "none";
    }

    return data;
}

const callback = object => {
    object.active = false;
    object.validated = false;
    object.message.innerText = object.backup;
    object.message.removeAttribute("style");
    object.input.removeAttribute("style");
    object.input.value = "";
    if (ninoPlayer.video.paused) playPause();
    object.input.blur();
}

const confirming = async value => {
    if (value.length < 19) {
        download.input.style.borderColor = !confirmAuth(value) ? "rgba(245, 78, 78, .9)" : "rgba(217, 238, 255, 0.9)";
        download.message.removeAttribute("style");
        download.message.innerText = "Enter an auth key";
    } else if (value.length === 19) {
        download.input.style.borderColor = !confirmAuth(value) ? "rgba(245, 78, 78, .9)" : "rgba(105, 201, 141, 0.7)";
        download.validated = await pFetch('auth/validateAuthKey', JSON.stringify({auth: value}));
        if (download.validated !== true) {
            download.message.innerText = download.validated;
            download.input.style.borderColor = download.message.style.color = "rgba(245, 78, 78, .9)";
        } else {
            download.message.innerText = "Auth key validated";
            download.message.style.color = "rgba(105, 201, 141, 0.7)";
        }
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

const beginCountdown = async int => {
    if (ninoPlayer.booleans.countdownStarted) {
        if (int === 0) {
            ninoPlayer.infoTexts.countdown.style.display = "none";
            ninoPlayer.booleans.countdownStarted = false;
            if (ninoPlayer.booleans.active) await nextLoader();
        } else {
            ninoPlayer.infoTexts.countdown.textContent = int;
            ninoPlayer.infoTexts.countdown.style.display = "flex";
            upNext.block.style.opacity = "1";
            upNext.block.style.zIndex = "999999";
            setTimeout(() => beginCountdown(int - 1), 1000);
        }
    } else {
        upNext.block.style.opacity = "0";
        upNext.block.style.zIndex = "-999999";
        ninoPlayer.infoTexts.countdown.style.display = "none";
    }
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

const stillWatching = setTimeout(() => {
    if (ninoPlayer.booleans.active && !ninoPlayer.video.paused){
        ninoPlayer.video.pause()
    }
}, 100)

$(document).on("click", ".play", async event => {
    loader.display();
    event.stopPropagation();
    let link = event.currentTarget.attributes["data-id"].nodeValue;
    let response = await sFetch("watch/" + link);
    let upNext = await sFetch("watch/upNext/" + response.next);
    let name = response.episodeName !== undefined ? response.episodeName : response.name;
    let subtitles = await sFetch("watch/subs/" + response.location);
    //ninoPlayer.timers.stillWatching = stillWatching;
    handleHistory('watch', link, "\u25B6 " + name, 'watch=' + response.location);
    await buildVideo(response, upNext, subtitles);
})

$('.subs').on("click", async event => {
    let language = event.currentTarget.attributes["data-id"].nodeValue;
    showSub(language);
})

document.addEventListener('keyup', async event => {
    if (ninoPlayer.booleans.active && !download.active) {
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

download.input.addEventListener('input', () => confirming(download.input.value));

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
    ninoPlayer.uiBlocks.buffer.style.display = "block";
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

    if (ninoPlayer.video.playing) {
        ninoPlayer.uiBlocks.buffer.style.display = "none";
        ninoPlayer.uiBlocks.foncer.style.display = "none";
        ninoPlayer.uiBlocks.previewFrame.style.display = "none";
    }

    if (ninoPlayer.video.currentTime > 60 + ninoPlayer.position || ninoPlayer.video.currentTime < ninoPlayer.position) {
        ninoPlayer.position = ninoPlayer.video.currentTime;
        await informDB();
    }

    if (ninoPlayer.booleans.guest && ninoPlayer.video.currentTime >= 300) {
        ninoPlayer.video.pause();
        await sFetch("auth/logout");
        localStorage.removeItem('app_id');
        window.location.reload();
    }

    if (ninoPlayer.booleans.recap && ninoPlayer.video.currentTime < 60) {
        ninoPlayer.buttons.recap.style.display = "block";
        document.getElementById("fullContentLogo").style.visibility = "hidden";
    } else {
        ninoPlayer.buttons.recap.style.display = "none";
        document.getElementById("fullContentLogo").style.visibility = "visible";
    }

    let cdVal = ninoPlayer.video.duration - ninoPlayer.video.currentTime;
    if (31 > cdVal && cdVal > 0 && !ninoPlayer.booleans.countdownStarted) {
        ninoPlayer.booleans.countdownStarted = true;
        await beginCountdown(Math.floor(cdVal));

    } else if (cdVal > 30)
        ninoPlayer.booleans.countdownStarted = false;

    showInfo();
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
    ninoPlayer.sliders.volumeFill.style.width = (pos * 100) + '%';
    ninoPlayer.video.volume = pos;
}

download.button.onclick = () => {
    if (!ninoPlayer.video.paused) playPause();
    download.active = true;
    loadModals(download, callback);
    download.input.focus();
}

share.button.onclick = async () => {
    if (!ninoPlayer.video.paused) playPause();
    share.active = true;
    let location = ninoPlayer.location;
    let position = ninoPlayer.video.currentTime === undefined ? 0: ninoPlayer.video.currentTime;
    position = position === 0 ? 0: (position/ninoPlayer.video.duration) * 1000;
    let {link, validated, error} = await sFetch('iframe/' + location + '/' + position);
    share.input.value = error? error: link;
    share.validated = validated;
    loadModals(share, callback);
}

share.confirm.onclick = () => {
    navigator.clipboard.writeText(share.input.value)
        .then(() => share.block.click())
        .catch((error) => {
            console.log(`Copy failed! ${error}`)
        })
}

share.deny.onclick = async () => {
    navigator.clipboard.writeText(share.input.value)
        .then(() => share.block.click())
        .catch((error) => {
            console.log(`Copy failed! ${error}`)
        })
    await sFetch('iframe/modify/' + share.validated + '/' + 0);
}

download.confirm.onclick = () => {
    if (download.validated === true) {
        let pathname = window.location.pathname;
        let value = pathname.replace("/watch=", "");
        window.location.href = '/stream/' + download.input.value + '/' + value;
        download.container.removeAttribute("style");
        download.block.removeAttribute("style");
        callback(download);
    } else {
        download.message.innerText = "Auth key required";
        download.input.style.borderColor = download.message.style.color = "rgba(245, 78, 78, .9)";
    }
}

