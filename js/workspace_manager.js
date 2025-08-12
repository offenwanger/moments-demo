import { FILE_FOLDER, STORY_JSON_FILE, WORKSPACE_DATA_FILE } from "./constants.js";
import { Data } from "./data.js";
import { FileUtil } from "./utils/file_util.js";

export function WorkspaceManager(folderHandle) {
    let mWorkspaceData = null;
    let mFolderHandle = folderHandle;

    let initialized = mFolderHandle.queryPermission({ mode: 'readwrite' })
        .then(permission => {
            if (permission !== 'granted') {
                throw Error("Invalid workspace folder, permission not granted");
            }
            return FileUtil.getJSONFromFile(mFolderHandle, WORKSPACE_DATA_FILE);
        })
        .then(data => {
            mWorkspaceData = data;
        })
        .catch(e => {
            if (e.message.includes("A requested file or directory could not be found at the time an operation was processed")) {
                // it's just new, no need to panic.
            } else {
                // panic.
                console.error('Failed to initialize workspace.');
                throw new Error(e);
            }
        })
        .then(() => {
            if (!mWorkspaceData) {
                mWorkspaceData = {
                    storyIds: []
                };
            }
        });


    function getStoryList() {
        return initialized
            .then(() => {
                return Promise.all(mWorkspaceData.storyIds.map(storyId =>
                    mFolderHandle.getDirectoryHandle(storyId)
                        .then(handle => FileUtil.getJSONFromFile(handle, STORY_JSON_FILE))
                        .then(storyObj => {
                            if (storyObj && storyObj.id && storyObj.name) {
                                return ({ id: storyObj.id, name: storyObj.name });
                            } else {
                                console.error("Couldn't get name for story", storyId);
                                return ({ id: storyObj.id, name: 'Load Failed.' })
                            }
                        })
                ))
            });

    }

    function newStory(id) {
        return initialized
            .then(() => {
                if (!id || typeof id != "string") { console.error("invalid id!", id); return; }
                mWorkspaceData.storyIds.push(id);
            })
            .then(() => mFolderHandle.getDirectoryHandle(id, { create: true }))
            .then(() => updateWorkspaceData());
    }

    function deleteStory(id) {
        return initialized
            .then(() => {
                if (!id || typeof id != "string") { console.error("invalid id!", id); return; }
                mWorkspaceData.storyIds = mWorkspaceData.storyIds.filter(storyId => storyId != id);
            })
            .then(() => mFolderHandle.removeEntry(id, { recursive: true }))
            .then(() => updateWorkspaceData());
    }

    function updateStory(model) {
        return initialized
            .then(() => mFolderHandle.getDirectoryHandle(model.id))
            .then(handle => FileUtil.writeFile(handle, STORY_JSON_FILE, JSON.stringify(model)));
    }

    function getStory(storyId) {
        return initialized
            .then(() => mFolderHandle.getDirectoryHandle(storyId))
            .then(handle => FileUtil.getJSONFromFile(handle, STORY_JSON_FILE))
            .then(storyObj => {
                if (!storyObj) {
                    console.error("Failed to load story object for id " + storyId);
                    return null;
                }
                let model = Data.StoryModel.fromObject(storyObj);
                return model;
            })
    }

    function storeFile(file) {
        let folder;
        return initialized
            .then(() => mFolderHandle.getDirectoryHandle(FILE_FOLDER, { create: true }))
            .then(f => folder = f)
            .then(() => file.arrayBuffer())
            .then(arrayBuffer => FileUtil.writeFile(folder, file.name, arrayBuffer))
    }

    function getFileAsDataURI(filename) {
        if (!filename) {
            console.error('Cannot get file, no filename.')
            return initialized.then(() => null)
        }
        return initialized
            .then(() => mFolderHandle.getDirectoryHandle(FILE_FOLDER, { create: true }))
            .then(folder => FileUtil.getFile(folder, filename))
            .then(file => FileUtil.getDataUriFromFile(file))
            .catch(e => {
                if (e.message && e.message.includes('A requested file or directory could not be found at the time an operation was processed') &&
                    filename.includes('thumbnail')) {
                    // missing thumbnails is common, it's fine. 
                    return;
                }
                console.error(e);
                console.error('Failed to getFileAsDataURI locally: ' + filename);
                return null;
            });
    }

    function updateWorkspaceData() {
        let workspaceFile;
        return initialized
            .then(() => mFolderHandle.getFileHandle(WORKSPACE_DATA_FILE, { create: true }))
            .then(workspaceFileHandle => workspaceFileHandle.createWritable())
            .then(wsf => workspaceFile = wsf)
            .then(() => workspaceFile.write(JSON.stringify(mWorkspaceData)))
            .then(() => workspaceFile.close())
    }

    function packageStory(storyId) {
        let folder;
        return initialized
            .then(() => mFolderHandle.getDirectoryHandle(FILE_FOLDER, { create: true }))
            .then(f => folder = f)
            .then(() => mFolderHandle.getDirectoryHandle(storyId))
            .then(storyFolder => FileUtil.getJSONFromFile(storyFolder, STORY_JSON_FILE))
            .then(storyObj => {
                let model = Data.StoryModel.fromObject(storyObj);
                return FileUtil.pacakgeToZip(model, folder)
            })
            .catch(e => {
                console.error('Failed to zip: ' + storyId);
                console.error(e);
            });
    }

    function loadStory(file) {
        let folder;
        let model;
        return initialized
            .then(() => mFolderHandle.getDirectoryHandle(FILE_FOLDER, { create: true }))
            .then(f => folder = f)
            .then(() => FileUtil.getModelFromZip(file))
            .then(m => model = m.clone())
            .then(() => newStory(model.id))
            .then(() => updateStory(model))
            .then(() => FileUtil.unpackageAssetsFromZip(file, folder))
            .catch(e => {
                console.error('Failed to load story.');
                console.error(e);
            });
    }

    this.getStoryList = getStoryList;
    this.newStory = newStory;
    this.deleteStory = deleteStory;
    this.updateStory = updateStory;
    this.getStory = getStory;
    this.storeFile = storeFile;
    this.getFileAsDataURI = getFileAsDataURI;
    this.loadStory = loadStory;
    this.packageStory = packageStory;
}

export function RemoteWorkSpace(storyId) {
    function getFileAsDataURI(filename) {
        if (!filename) {
            console.error('Failed to getFileAsDataURI, no filename provided');
            return null;
        }
        return fetch('uploads/' + storyId + "/" + filename)
            .then(result => {
                if (result?.ok) {
                    return result.text();
                } else if (result?.status.toString() == '404') {
                    // it's just missing. No fuss needed.
                    return null;
                } else {
                    console.error(result);
                    console.error(`Failed to fetch file, HTTP Response Code: ${result?.status}`)
                    return null;
                }
            })

            .catch(e => {
                console.error(e);
                console.error('Failed to getFileAsDataURI remotely: ' + filename);
                return null;
            });
    }

    this.getFileAsDataURI = getFileAsDataURI;
    this.isRemote = true;
}


