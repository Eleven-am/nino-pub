const {google} = require('googleapis')
const credentials = require('../config/credentials.json')
const {google_token, deleteAndRename} = require('../config/nino.json')

const {client_secret, client_id, redirect_uris} = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
oAuth2Client.setCredentials(google_token);
const auth = oAuth2Client;
const drive = google.drive({version: 'v3', auth});
const drive2 = google.drive({version: 'v2', auth});

class DriveHandler {
    /**
     * @desc gets every file in a google drive folder
     * @param folder
     * @param pageToken
     * @returns {Promise<*[]>}
     */
    readFolder = async (folder, pageToken) => {
        pageToken = pageToken || "";
        if (folder === undefined) throw new Error('folder cannot be undefined');
        let res = await drive.files.list({
            q: `'${folder}' in parents and trashed = false`,
            fields: 'nextPageToken, files(id, name, size, mimeType)',
            spaces: 'drive',
            orderBy: 'name',
            pageSize: 1000,
            pageToken: pageToken
        });

        let files = res.data.files;
        let temp = !!res.data.nextPageToken ? await this.readFolder(folder, res.data.nextPageToken) : [];
        return files.concat(temp);
    }

    /**
     * @desc gets a specific file by name from a specific google drive folder
     * @param fileName
     * @param folder
     * @returns {Promise<*|boolean>}
     */
    findFile = async (fileName, folder) => {
        let res = await drive.files.list({
            q: `'${folder}' in parents and trashed = false and name = "${fileName}"`,
            fields: 'files(id, name, size, mimeType)',
            spaces: 'drive',
            orderBy: 'name',
            pageSize: 10
        });

        let files = res.data.files;
        return files.length > 0 ? files[0] : false;
    }

    /**
     * @desc builds a video header based on specific data requested by the user
     * @param range
     * @param video
     * @returns {{}}
     */
    buildRange = (range, video) => {
        const videoRes = {};
        videoRes.mimeType = video.mimeType;
        videoRes.fileSize = parseInt(video.size, 10);
        const parts = range
            .replace(/bytes=/, "")
            .split("-")

        videoRes.start = parseInt(parts[0], 10)
        videoRes.end = parseInt(parts[1]) > 0 ? parseInt(parts[1], 10) : videoRes.fileSize - 1
        videoRes.chunkSize = (videoRes.end - videoRes.start) + 1;

        return videoRes;
    }

    /**
     * @desc gets a google drive file's metadata
     * @param fileId
     * @returns {Promise<drive_v2.Schema$File>}
     */
    getFile = async fileId => {
        return new Promise(resolve => {
            drive.files.get({
                fileId: fileId,
                fields: "id, name, size, mimeType, contentHints/thumbnail, videoMediaMetadata, thumbnailLink, explicitlyTrashed"
            }).then(response => resolve(response.data))
                .catch(error => resolve({error: error.message}))
        })
    }

    /**
     * @desc deletes a google drive file using it's file_id
     * @param fileId
     * @returns {Promise<*>}
     */
    deleteFile = async fileId => {
        if (deleteAndRename)
            return (await drive.files.update({fileId, requestBody: {trashed: true}})).status === 200;
        else return false;
    }

    /**
     * @desc returns a 206 morceau response of a video based on the range requested
     * @param id
     * @param dest
     * @param range
     * @returns {Promise<void>}
     */
    streamFile = async (id, dest, range) => {
        const file = await this.getFile(id);
        const {start, end, chunkSize, fileSize, mimeType} = this.buildRange(range, file);
        dest.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': mimeType
        })

        let {data} = await drive.files.get({
            fileId: id,
            alt: 'media',
            headers: {Range: `bytes=${start}-${end}`}
        }, {responseType: 'stream'});

        data.pipe(dest);
    }

    /**
     * @desc moves an element by it's google id to the google folder by it's folder id
     * @param element
     * @param folder_id
     * @returns {Promise<void>}
     */
    moveElement = async (element, folder_id) => {
        let file = await drive.files.get({
            fileId: element,
            fields: 'parents'
        });

        let parent = file.data.parents.join(',');
        if (parent !== folder_id) {
            file = await drive.files.update({
                fileId: element,
                addParents: folder_id,
                removeParents: parent,
                fields: 'id, parents'
            })
        }
    }

    /**
     * @desc downloads a file from google drive to user
     * @param file_id
     * @param name
     * @param dest
     * @param mime
     * @returns {Promise<void>}
     */
    rawDownload = async (file_id, name, dest, mime) => {
        let {mimeType} = await this.getFile(file_id);
        let value = mime ? 'inline' : 'attachment; filename=' + name + ' [nino].mp4';
        mime = mime || mimeType;

        let {data} = await drive.files.get({
            fileId: file_id,
            alt: 'media'
        }, {responseType: 'stream'});

        dest.setHeader('Content-disposition', value);
        dest.setHeader('Content-type', mime);
        data.pipe(dest);
    }

    /**
     * @desc Restores previously deleted element from trash
     * @param fileId
     * @returns {Promise<*>}
     */
    restoreFile = async fileId => {
        return await drive2.files.untrash({
            'fileId': fileId
        });
    }

    /**
     * @desc renames a file / folder
     * @param fileId
     * @param name
     * @returns {Promise<*>}
     */
    renameFile = async (fileId, name) => {
        if (deleteAndRename)
            return await drive.files.update({
                'fileId': fileId,
                'resource': {name}
            })
        else return false;
    }

    /**
     * @desc creates a folder with the specified name
     * @param name
     * @returns {Promise<*>}
     */
    createFolder = async name => {
        const fileMetadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        let res = await drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        })

        return res.data.id;
    }

    /**
     * Print information about the current user along with the Drive API
     * settings.
     */
    printAbout = async () => {
        let resp = await drive2.about.get();
        resp = resp.data;
        console.log('Current user name: ' + resp.name);
        console.log('Root folder ID: ' + resp.rootFolderId);
        console.log('Total quota (bytes): ' + resp.quotaBytesTotal);
        console.log('Used quota (bytes): ' + resp.quotaBytesUsed);
    }
}

module.exports = DriveHandler;