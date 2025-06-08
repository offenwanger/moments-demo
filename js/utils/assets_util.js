import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AssetTypes, BOX_ASSET_PREFIXES, THUMBNAIL_PREFIX, THUMBNAIL_SUFFIX } from '../constants.js';
import { Data } from "../data.js";
import { ThumbnailCreator } from './thumbnail_creator.js';

export function AssetUtil(workspace) {
    let mWorkspace = workspace;
    let mModel = new Data.StoryModel();
    const mAudioLoader = new THREE.AudioLoader();

    let mLoadedAssets = {};
    let mLoadedThumbnails = {};
    let mLoadedFiles = {};

    const mImageLoader = new THREE.ImageLoader();

    function updateModel(model) {
        let newAssetIds = model.assets.map(a => a.id);
        Object.keys(mLoadedAssets).forEach(id => {
            if (!newAssetIds.includes(id)) { delete mLoadedAssets[id]; }
        })
        mModel = model;
    }

    function loadDefaultEnvironmentCube() {
        return new Promise((resolve, reject) => {
            if (!mLoadedAssets['DEFAULT_ENV_BOX']) { // loaded from the web server.
                let files = BOX_ASSET_PREFIXES.map(f => f + "default.png");
                let cubeLoader = new THREE.CubeTextureLoader();
                cubeLoader.setPath('assets/default_env_box/')
                cubeLoader.load(files, (cubeTexture) => {
                    mLoadedAssets['DEFAULT_ENV_BOX'] = cubeTexture;
                    resolve(mLoadedAssets['DEFAULT_ENV_BOX']);
                }, () => { }, (e) => { reject(e); });
            } else {
                resolve(mLoadedAssets['DEFAULT_ENV_BOX']);
            }
        })
    }

    function loadImageAsset(assetId) {
        if (mLoadedAssets[assetId]) {
            return Promise.resolve(mLoadedAssets[assetId]);
        } else {
            let asset = mModel.find(assetId);
            if (!asset) { console.error("Invalid image asset: " + assetId); throw new Error("Invalid model asset: " + assetId); }

            let load = loadImage(asset.filename)
                .then(image => {
                    mLoadedAssets[assetId] = image;
                    if (!mLoadedAssets[assetId]) {
                        console.error('Failed to load asset: ' + assetId);
                        return null;
                    }
                    return mLoadedAssets[assetId];
                })
                .catch(e => { console.error('Failed to fetch image: ' + assetId); console.error(e); return null; })

            // check the thumbnail asyncronously.
            load
                .then(image => image ? checkThumbnail(assetId, image, AssetTypes.IMAGE) : null);

            return load;
        }
    }

    function loadImage(filename) {
        return mWorkspace.getFileAsDataURI(filename)
            .then(uri => mImageLoader.loadAsync(uri, null, null));
    }

    function loadModelAsset(assetId) {
        if (mLoadedAssets[assetId]) {
            return Promise.resolve(mLoadedAssets[assetId].clone());
        } else {
            let asset = mModel.find(assetId);
            if (!asset || asset.type != AssetTypes.MODEL) { console.error("Bad asset", assetId, asset); throw new Error("Invalid model asset: " + assetId); }

            let load = loadGLTFModel(asset.filename)
                .then(model => {
                    mLoadedAssets[assetId] = model.scene;

                    if (!model) { console.error('Failed to load asset: ' + assetId); return null; }

                    return mLoadedAssets[assetId].clone();
                }).catch(e => {
                    console.error('Failed to fetch model: ' + assetId);
                    console.error(e);
                    return null;
                })

            // check the thumbnail asyncronously.
            load
                .then(model => model ? checkThumbnail(assetId, model, AssetTypes.MODEL) : null);

            return load;
        }
    }

    function loadGLTFModel(filename) {
        let load = Promise.resolve()
        if (mLoadedFiles[filename]) {
            load = load
                .then(() => mLoadedFiles[filename]);
        } else {
            load = load
                .then(() => mWorkspace.getFileAsDataURI(filename))
                .then(loadedFile => {
                    mLoadedFiles[filename] = loadedFile
                })
                .catch(e => {
                    console.error(e);
                    console.error("Failed to load gltf model: " + filename);
                    return null;
                })
        }

        const modelLoader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('./node_modules/three/examples/jsm/libs/draco/');
        modelLoader.setDRACOLoader(dracoLoader);

        return load
            .then(() => {
                return modelLoader.loadAsync(mLoadedFiles[filename])
            })
            .catch(e => {
                console.error(e);
                console.error('Failed to load gltf file: ' + filename);
                return null
            })
    }

    function loadAudioAsset(assetId) {
        if (mLoadedAssets[assetId]) {
            return Promise.resolve(mLoadedAssets[assetId]);
        } else {
            let chain = Promise.resolve();

            let asset = mModel.assets.find(a => a.id == assetId);
            if (!asset) { console.error("Invalid audio asset: " + assetId); return chain; }

            chain = chain
                .then(() => loadAudio(asset.filename))
                .then(buffer => {
                    mLoadedAssets[assetId] = buffer;
                    return mLoadedAssets[assetId];
                })
                .catch(e => {
                    console.error(e);
                    console.error('Failed to fetch audio: ' + assetId);
                    return null;
                })

            // check the thumbnail asyncronously.
            chain.then(buffer => buffer ? checkThumbnail(assetId, buffer, AssetTypes.AUDIO) : null);

            return chain;
        }
    }

    function loadAudio(filename) {
        return mWorkspace.getFileAsDataURI(filename)
            .then(uri => {
                return new Promise((resolve, reject) => {
                    mAudioLoader.load(uri, resolve, null, reject);
                })
            })
            .catch(e => {
                console.error(e);
                console.error('Failed to load audio file: ' + filename);
                return null;
            })
    }

    function checkThumbnail(assetId, asset, type) {
        if (workspace.isRemote) {
            // This is only handled by local system
            return Promise.resolve();
        }

        // check that the thumbnail exists
        if (!mLoadedThumbnails[assetId]) {
            // maybe it's just not been loaded
            loadThumbnail(assetId)
                .then(() => {
                    if (!mLoadedThumbnails[assetId]) {
                        // no it's really missing, create it. 
                        return generateThumbnail(assetId, asset, type);
                    }
                });
        }
    }

    function loadThumbnail(itemId) {
        if (mLoadedThumbnails[itemId]) {
            return Promise.resolve(mLoadedThumbnails[itemId]);
        } else {
            let item = mModel.find(itemId);
            if (!item) { console.error("Invalid item id: " + itemId); return null; }

            return mWorkspace.getFileAsDataURI(THUMBNAIL_PREFIX + itemId + THUMBNAIL_SUFFIX)
                .then(uri => mImageLoader.loadAsync(uri))
                .then(image => {
                    mLoadedThumbnails[itemId] = image;
                    return mLoadedThumbnails[itemId];
                })
                .catch(e => {
                    if (e.message && e.message.includes("A requested file or directory could not be found at the time an operation was processed")) {
                        // Thumbnail might not exist yet. Normal occurance, ignore.
                    } else {
                        console.error(e);
                        console.error('Failed to load thumbnail: ' + itemId);
                    }
                    return null;
                })
        }
    }

    function loadAssetFile(filename, type) {
        if (type == AssetTypes.MODEL) {
            return loadGLTFModel(filename)
                .then(asset => {
                    if (asset && asset.scene) return asset.scene
                    else return asset;
                });
        } else if (type == AssetTypes.IMAGE) {
            return loadImage(filename);
        } else if (type == AssetTypes.AUDIO) {
            return loadAudio(filename);
        } else { console.error('invalid asset type: ' + type); return Promise.reject(); }
    }

    function generateThumbnail(assetId, asset, type) {
        if (workspace.isRemote) {
            // This is only handled by local system
            return;
        }

        let thumbnail;
        if (type == AssetTypes.MODEL || type == Data.Moment) {
            thumbnail = ThumbnailCreator.generateSceneThumbnail(asset);
        } else if (type == AssetTypes.IMAGE) {
            thumbnail = ThumbnailCreator.generateImageThumbnail(asset);
        } else if (type == AssetTypes.AUDIO) {
            thumbnail = ThumbnailCreator.generateAudioThumbnail(asset);
        } else { console.error('invalid asset type: ' + type); return null; }

        let filename = THUMBNAIL_PREFIX + assetId + THUMBNAIL_SUFFIX;
        // store the file asyncronously.
        return new Promise(resolve => thumbnail.toBlob(resolve, 'image/jpeg'))
            .then(blob => {
                let file = new File([blob], filename, { type: "image/jpeg" });
                return workspace.storeFile(file, false);
            })
            .then(() => filename)
            .catch(e => {
                console.error(e);
                console.error('Failed to store thumbnail for ' + assetId);
            });
    }

    function clearCache(tag) {
        delete mLoadedThumbnails[tag];
        delete mLoadedAssets[tag];
        delete mLoadedFiles[tag];
    }

    this.updateModel = updateModel;
    this.loadDefaultEnvironmentCube = loadDefaultEnvironmentCube;
    this.loadImageAsset = loadImageAsset;
    this.loadModelAsset = loadModelAsset;
    this.loadAudioAsset = loadAudioAsset;
    this.loadGLTFModel = loadGLTFModel;
    this.loadThumbnail = loadThumbnail;
    this.loadAssetFile = loadAssetFile;
    this.generateThumbnail = generateThumbnail;
    this.clearCache = clearCache
}