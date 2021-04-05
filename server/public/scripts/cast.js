if (window.chrome && !window.chrome.cast) {
    let script = document.createElement('script');
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    document.head.appendChild(script);
}

class Cast {
    constructor() {
        this._events = {};

        this.castSession = false;
        this.connected   = false;
        this.device      = 'Chromecast';
        this.namespace   = 'urn:x-cast:com.nino.cast';

        this.src         = ''
        this.title       = ''
        this.description = ''
        this.poster      = ''
        this.subtitles   = []

        this.volumeLevel    = 1;
        this.muted          = false;
        this.paused         = false;
        this.time           = 0;
        this.timePretty     = '00:00:00';
        this.duration       = 0;
        this.durationPretty = '00:00:00';
        this.progress       = 0;
        this.state          = 'disconnected';
        this._init();
    }

    on(name, listener) {
        if (!this._events[name])
            this._events[name] = [];

        this._events[name].push(listener);
    }

    removeListener(name, listenerToRemove) {
        if (!this._events[name])
            throw new Error(`Can't remove a listener. Event "${name}" doesn't exits.`);

        const filterListeners = (listener) => listener !== listenerToRemove;
        this._events[name] = this._events[name].filter(filterListeners);
    }

    emit(name, data) {
        data = data || this.updateData();
        if (!this._events[name])
            console.error(`Can't remove a listener. Event "${name}" doesn't exits.`);

        const fireCallbacks = (callback) => {
            callback(data);
        };

        this._events[name].forEach(fireCallbacks);
    }
    
    _init(tries = 0) {
        if (!window.chrome || !window.chrome.cast || !window.chrome.cast.isAvailable) {
           if (tries > 20)
               this.emit('error', 'Casting may not be supported on your devices');
           else
               setTimeout(() => { this._init(tries ++) }, 250)

        } else {
            cast.framework.CastContext.getInstance().setOptions({
                receiverApplicationId: '73BFF1D2',
                autoJoinPolicy: 'tab_and_origin_scoped',
                language: 'en-US',
                resumeSavedSession: false,
            });

            this._player = new cast.framework.RemotePlayer();
            this._controller = new cast.framework.RemotePlayerController(this._player);

            this._controller.addEventListener('isConnectedChanged',  this._isConnectedChanged.bind(this));
            this._controller.addEventListener('isMutedChanged',      this._isMutedChanged.bind(this));
            this._controller.addEventListener('isPausedChanged',     this._isPausedChanged.bind(this));
            this._controller.addEventListener('currentTimeChanged',  this._currentTimeChanged.bind(this));
            this._controller.addEventListener('durationChanged',     this._durationChanged.bind(this));
            this._controller.addEventListener('volumeLevelChanged',  this._volumeLevelChanged.bind(this));
            this._controller.addEventListener('playerStateChanged',  this._playerStateChanged.bind(this));
            this.available = true;
        }
    }

    _isConnectedChanged() {
        this.connected = this._player.isConnected;

        if (this.connected) {
            this.castSession = cast.framework.CastContext.getInstance().getCurrentSession();
            this.device = cast.framework.CastContext.getInstance().getCurrentSession().getCastDevice().friendlyName || this.device;

            this.castSession.addMessageListener(this.namespace, (namespace, data) => {
                console.log(namespace, data)
                this.emit('namespace', data);
            })
        }

        this.state = !this.connected ? 'disconnected' : 'connected'
        this.emit(this.state.replace('ed', ''), this.connected);
    }

    _isMutedChanged() {
        const old = this.muted
        this.muted = this._player.isMuted;
        if (old !== this.muted)
            this.emit('muted', !!this.muted);
    }

    _isPausedChanged() {
        this.paused = this._player.isPaused;
        this.emit('paused', !!this.paused)
    }

    _playerStateChanged() {
        this.connected = this._player.isConnected
        if (!this.connected) {
            //this.emit('statechange')
            this.emit('disconnect', {volume: this.volumeLevel, muted: this.muted, paused: this.paused, time: this.time});
        }

        this.time = Math.round(this._player.currentTime, 1);
        this.duration = this._player.duration;
        this.progress = this._controller.getSeekPosition(this.time, this.duration);
        this.timePretty = this._controller.getFormattedTime(this.time);
        this.durationPretty = this._controller.getFormattedTime(this.duration);

        this.device = cast.framework.CastContext.getInstance().getCurrentSession() ? cast.framework.CastContext.getInstance().getCurrentSession().getCastDevice().friendlyName : this.device
        this.state = this._player.playerState.toLowerCase();
        switch(this.state) {
            case 'idle':
                this.state = 'ended';
                //this.emit('statechange');
                this.emit('end');
                break;
            case 'buffering':
                //this.emit('statechange');
                this.emit('buffering', {time: this.time, timePretty: this.timePretty, durationPretty: this.durationPretty, duration: this.duration, progress: this.progress})
                break;
            case 'playing':
                setTimeout(() => {
                    //this.emit('statechange');
                    this.emit('playing', {time: this.time, timePretty: this.timePretty, durationPretty: this.durationPretty, duration: this.duration, progress: this.progress})
                })
                break;
        }
    }

    _currentTimeChanged() {
        let past = this.time;
        this.time = Math.round(this._player.currentTime, 1);
        this.duration = this._player.duration;
        this.progress = this._controller.getSeekPosition(this.time, this.duration);
        this.timePretty = this._controller.getFormattedTime(this.time);
        this.durationPretty = this._controller.getFormattedTime(this.duration);
        if (past !== this.time && !this._player.isPaused) 
            this.emit('timeupdate');
    }

    _durationChanged() {
        this.duration = this._player.duration;
        this.emit('durationChanged');
    }
    
    _volumeLevelChanged() {
        this.volumeLevel = Number((this._player.volumeLevel).toFixed(1));
        if (this._player.isMediaLoaded)
            this.emit('volumechange')
    }

    playPause() {
        this._controller.playOrPause();
        return this;
    }

    muteUnmute() {
        this._controller.muteOrUnmute();
        this.muted = !this.muted;
        return this;
    }

    subtitle(index) {
        let request = new chrome.cast.media.EditTracksInfoRequest([parseInt(index)]);
        cast.framework.CastContext.getInstance().getCurrentSession().getSessionObj().media[0].editTracksInfo(request, () => {
            for (let i in this.subtitles) {
                delete this.subtitles[i].active;
                if (i === index)
                    this.subtitles[i].active = true;

            }
            return this.emit('subtitleChange');
        }, (err) => {
            return this.emit('error', err);
        });
    }

    seek(seconds) {
        this._player.currentTime = seconds;
        this._controller.seek();
        return this;
    }

    volume(float) {
        this._player.volumeLevel = this.volumeLevel = float;
        this._controller.setVolumeLevel();
        this.volumeLevel = float;
        return this;
    }

    disconnect() {
        this.connected  = false;
        this.emit('disconnect');

        cast.framework.CastContext.getInstance().endCurrentSession(true);
        this._controller.stop();

        this.device     = 'Chromecast';

        this.src         = ''
        this.title       = ''
        this.description = ''
        this.poster      = ''
        this.subtitles   = []

        this.volumeLevel    = 1;
        this.muted          = false;
        this.paused         = false;
        this.time           = 0;
        this.timePretty     = '00:00:00';
        this.duration       = 0;
        this.durationPretty = '00:00:00';
        this.progress       = 0;
        this.state          = 'disconnected';
        return this;
    }

    cast(videoPlayer, obj) {
        cast.framework.CastContext.getInstance().requestSession().then(() => {
            if (!cast.framework.CastContext.getInstance().getCurrentSession())
                return this.emit('error', 'Could not connect with the cast device');

            this.castTwo(videoPlayer, obj);
        }, (err) => {
            if (err !== 'cancel') {
                this.emit('error', err);
            }
            return this;
        });
    }

    castTwo(videoPlayer, obj){
        let mediaInfo = new chrome.cast.media.MediaInfo();
        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
        mediaInfo.entity = obj;

        /*let mediaInfo = new chrome.cast.media.MediaInfo(this.src);
        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();

        if (this.subtitles.length) {
            mediaInfo.textTrackStyle = new chrome.cast.media.TextTrackStyle();
            mediaInfo.textTrackStyle.backgroundColor = '#00000000';
            mediaInfo.textTrackStyle.edgeColor       = '#00000016';
            mediaInfo.textTrackStyle.edgeType        = 'DROP_SHADOW';
            mediaInfo.textTrackStyle.fontFamily      = 'CASUAL';
            mediaInfo.textTrackStyle.fontScale       = 1.0;
            mediaInfo.textTrackStyle.foregroundColor = '#FFFFFF';

            let tracks = [];
            for (let i in this.subtitles) {
                // chrome.cast.media.TrackType.TEXT
                // chrome.cast.media.TextTrackType.CAPTIONS
                let track =  new chrome.cast.media.Track(i, 'TEXT');
                track.name =             this.subtitles[i].label;
                track.subtype =          'SUBTITLES';
                track.trackContentId =   this.subtitles[i].src;
                track.trackContentType = 'text/vtt';
                track.trackId = parseInt(i);
                tracks.push(track);
            }
            mediaInfo.tracks = tracks;
        }
        mediaInfo.metadata.images = [new chrome.cast.Image(this.poster)];
        mediaInfo.metadata.title = this.title;
        mediaInfo.metadata.subtitle = this.description;*/
        let request = new chrome.cast.media.LoadRequest(mediaInfo);
        request.currentTime = videoPlayer.currentTime;
        request.autoplay = !videoPlayer.paused;

        cast.framework.CastContext.getInstance().getCurrentSession().loadMedia(request).then(() => {
            this.device = cast.framework.CastContext.getInstance().getCurrentSession().getCastDevice().friendlyName || this.device
            this.volume(videoPlayer.volume);
            return this;
        }, (err) => {
            return this.emit('error', err);
        });
    }

    ping(obj) {
        if(this.connected && this.castSession)
            this.castSession.sendMessage(this.namespace, obj);
    }

    updateData(){
        return {volume: this.volumeLevel, muted: this.muted, paused: this.paused, time: this.time};
    }
}

if (typeof module !== 'undefined'){
    module.exports = Castjs;
}