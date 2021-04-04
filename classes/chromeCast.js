const Views = require("./watched");
const {User} = require("./auths");
const {loadImages} = require('./auths');
const views = new Views();
const user = new User();

class ChromeCast {

    async loadImages() {
        return await loadImages();
    }

    async intercept(auth, link) {
        let info = {error: 'no such entry on database'};
        let info_id = await views.getID(auth);
        let usr = await user.findUser({email:'guest@maix.ovh'});
        if (!user.hasOwnProperty('error') && !info_id.hasOwnProperty('error')) {
            info = await views.playVideo(usr.user_id, info_id);
            if (!info.hasOwnProperty('error')) {
                let subs = this.convertSubs(await views.getSubs(auth), link)
                let {mimeType} = await views.getLocation(auth);
                let {location, name, episodeName, backdrop, overview, logo} = info;
                info = {location: link + 'stream/' + location, logo, name, backdrop, overview, subs, mimeType};
                if (episodeName)
                    info.episodeName = episodeName;

                console.log(subs);
            }
        } return info;
    }

    convertSubs(subs, link){
        let array = ['eng', 'fre', 'ger', 'roy'];
        let names = ['English', 'French', 'German'];
        let language = ['en-US', 'fr', 'de'];

        return array.map((item, index) => {
            if (subs[item]){
                return {
                    id: index,
                    type: 'text',
                    subtype: 'subtitles',
                    name: names[index] + ' Subtitle',
                    contentId: link + subs[item],
                    language: language[index],
                }
            }
        }).filter(item => item !== undefined);
    }
}

module.exports = ChromeCast;