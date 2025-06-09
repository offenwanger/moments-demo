import { ServerMessage, THUMBNAIL_PREFIX, THUMBNAIL_SUFFIX } from "../../constants.js";
import { logInfo } from "../../utils/log_util.js";

export function WebsocketController() {
    /**
     * Multiplayer design
     * P1 starts sharing. 
     * PN opens the front page, sees a list of shared servers. 
     * PN connects to a server. Loads into veiwer mode. 
     * PN can see P1 and what they are doing (moving stuff around, adding things, etc.)
     * P1 can see PN as a floating looking head (with hands if they have them.)
     * 
     * Required messages
     * P1 -> PN
     *  - the model -> includes image assets
     *  - the GLBs
     *  - Incremental changes
     *  - Head/Hands positions
     * PN -> PN Head/hands positions
     * 
     * Idea: Refactor the system to have the 3 database changes: Update, Insert, Delete, then we can stream those three changes. 
     * We can then stream these changes. 
     * There's also Import... 
     * When user shares, creates a folder on the server, uploads the models, server stores all the models for the story. 
     */

    let mIsSharing = false;
    let mConnectedToRemote = false;
    let mConnectionTimeout = null;

    let mSharedStoriesUpdatedCallback = () => { }
    let mStoryConnectCallback = () => { }
    let mStoryUpdateCallback = () => { }
    let mNewAssetCallback = () => { }
    let mCreateMomentCallback = () => { }
    let mParticipantUpdateCallback = () => { }

    const mWebSocket = io();
    let mSocketId = null;

    mWebSocket.on("connect", () => {
        mWebSocket.emit(ServerMessage.CONNECTION_ID, mSocketId);
    });

    mWebSocket.on('connect_error', function (data) {
        mWebSocket.disconnect();
        mIsSharing = false;
        console.error('Websocket connection failed.');
    });

    mWebSocket.on("disconnect", (reason) => {
        mIsSharing = false;
        logInfo("Disconnecting because: " + reason);
    });

    mWebSocket.on("error", (error) => {
        console.error(error);
    });

    mWebSocket.on(ServerMessage.CONNECTION_ID, id => {
        logInfo("Received new id: " + id);
        mSocketId = id;
    })


    mWebSocket.on(ServerMessage.SHARED_STORIES, (stories) => {
        mSharedStoriesUpdatedCallback(stories);
    });

    mWebSocket.on(ServerMessage.CONNECT_TO_STORY, (story) => {
        clearTimeout(mConnectionTimeout);
        mConnectedToRemote = true;
        mStoryConnectCallback(story);
    });

    mWebSocket.on(ServerMessage.UPDATE_STORY, (transaction) => {
        mStoryUpdateCallback(transaction);
    });

    mWebSocket.on(ServerMessage.NEW_ASSET, (data) => {
        mNewAssetCallback(data.id, data.name, data.buffer, data.type);
    });

    mWebSocket.on(ServerMessage.CREATE_MOMENT, (data) => {
        mCreateMomentCallback();
    });

    mWebSocket.on(ServerMessage.UPDATE_PARTICIPANT, (data) => {
        mParticipantUpdateCallback(data.id, data.head, data.handR, data.handL, data.momentId);
    });

    mWebSocket.on(ServerMessage.ERROR, (message) => {
        console.error(message);
    });

    mWebSocket.on(ServerMessage.START_SHARE, () => {
        mIsSharing = true;
        logInfo("Sharing started successfully.")
    })

    function shareStory(model, workspace) {
        // would be better to wait with the upload until something is requested...
        // also to check if it's already uploaded.
        let chain = Promise.resolve();
        model.assets.forEach((asset, i) => {
            chain = chain
                .then(() => logInfo("Uploading asset " + (i + 1) + "/" + model.assets.length))
                .then(() => uploadAsset(model.id, asset.filename, workspace))
                .then(() => uploadAsset(model.id, THUMBNAIL_PREFIX + asset.id + THUMBNAIL_SUFFIX, workspace))
                .catch(e => { console.error('Upload failed'); console.error(e); })
        });
        model.moments.forEach((moment, i) => {
            chain = chain
                .then(() => logInfo("Uploading moment thumbnail " + i + "/" + model.moments.length))
                .then(() => uploadAsset(model.id, THUMBNAIL_PREFIX + moment.id + THUMBNAIL_SUFFIX, workspace))
                .catch(e => { console.error('Upload failed'); console.error(e); })
        });
        return chain
            .then(() => logInfo("Files uploaded."))
            .then(() => mWebSocket.emit(ServerMessage.START_SHARE, model))
            .catch((e) => {
                console.error(e);
                console.error('Share failed.')
            })
    }

    function connectToStory(storyId) {
        mWebSocket.emit(ServerMessage.CONNECT_TO_STORY, storyId);
        mConnectionTimeout = setTimeout(() => {
            if (!mConnectedToRemote) {
                console.error("Connection to " + storyId + " failed, retrying.");
                mWebSocket.emit(ServerMessage.CONNECT_TO_STORY, storyId);
                mConnectionTimeout = setTimeout(() => {
                    if (!mConnectedToRemote) {
                        console.error("Connection to " + storyId + " failed.");
                    }
                }, 1000)
            };
        }, 1000)
    }

    function updateStory(transaction) {
        if (!mConnectedToRemote && !mIsSharing) return;
        mWebSocket.emit(ServerMessage.UPDATE_STORY, transaction);
    }

    function uploadAsset(storyId, filename, workspace) {
        return workspace.getFileAsDataURI(filename)
            .then(uri => {
                logInfo("Uploading " + filename);
                return fetch('/upload', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        storyId,
                        filename,
                        uri,
                    })
                });
            })
            .then(() => logInfo(filename + " uploaded."))
            .catch((e) => {
                if (e.message.includes('A requested file or directory could not be found at the time an operation was processed')) {
                    // Probably just a missing thumbnail, ignore.
                } else console.error(e)
            })
    }

    function newAsset(id, file, type) {
        return file.arrayBuffer()
            .then(buffer => mWebSocket.emit(ServerMessage.NEW_ASSET, { id, name: file.name, type, buffer }))
    }

    function updateParticipant(head, handR = null, handL = null, momentId = null) {
        if (!mConnectedToRemote && !mIsSharing) return;
        mWebSocket.emit(ServerMessage.UPDATE_PARTICIPANT, { head, handR, handL, momentId })
    }

    function createMoment() {
        mWebSocket.emit(ServerMessage.CREATE_MOMENT, {})
    }

    this.shareStory = shareStory;
    this.uploadAsset = uploadAsset;
    this.connectToStory = connectToStory;
    this.updateStory = updateStory;
    this.updateParticipant = updateParticipant;
    this.newAsset = newAsset;
    this.createMoment = createMoment;
    this.onSharedStories = (func) => mSharedStoriesUpdatedCallback = func;
    this.onStoryConnect = (func) => mStoryConnectCallback = func;
    this.onStoryUpdate = (func) => mStoryUpdateCallback = func;
    this.onNewAsset = (func) => mNewAssetCallback = func;
    this.onCreateMoment = (func) => mCreateMomentCallback = func;
    this.onParticipantUpdate = (func) => mParticipantUpdateCallback = func;
    this.isSharing = () => mIsSharing;
}