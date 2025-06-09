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
    let mLoadedFileURIs = {};

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

    function loadAsset(assetId, type) {
        if (mLoadedAssets[assetId]) {
            return Promise.resolve(mLoadedAssets[assetId]);
        }

        let asset = mModel.find(assetId);
        if (!asset) {
            return Promise.reject("Asset id not found in model: " + assetId);
        }

        let chain = loadAssetFile(asset.filename, type, assetId);

        // check the thumbnail async;
        chain.then(asset => checkThumbnail(assetId, asset, type));

        return chain;
    }

    function loadAssetFile(filename, type, assetId = null) {
        let chain = Promise.resolve();

        if (!mLoadedFileURIs[filename]) {
            chain = chain
                .then(() => mWorkspace.getFileAsDataURI(filename))
                .then(loadedURI => {
                    if (!loadedURI) throw new Error('Failed to load asset file: ' + filename);
                    mLoadedFileURIs[filename] = loadedURI
                })
        }

        chain = chain
            .then(() => uriToAsset(mLoadedFileURIs[filename], type))
            .then(asset => {
                if (!asset) throw new Error('Failed to load asset: ' + filename);
                if (assetId) mLoadedAssets[assetId] = asset
                if (type == AssetTypes.MODEL) asset = asset.clone();
                return asset;
            })

        return chain;
    }

    function cache(assetId, uri, type) {
        return uriToAsset(uri, type)
            .then(asset => {
                mLoadedAssets[assetId] = asset;
                return asset;
            });
    }

    function uriToAsset(uri, type) {
        if (type == AssetTypes.MODEL) {
            return loadGLTFFromURI(uri)
                .then(model => model.scene);
        } else if (type == AssetTypes.IMAGE) {
            return loadImageFromURI(uri);
        } else if (type == AssetTypes.AUDIO) {
            return loadAudioFromURI(uri);
        } else { console.error('invalid asset type: ' + type); return Promise.reject(); }
    }

    function loadImageFromURI(uri) {
        return mImageLoader.loadAsync(uri, null, null);
    }

    function loadGLTFFromURI(uri) {
        const modelLoader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('./node_modules/three/examples/jsm/libs/draco/');
        modelLoader.setDRACOLoader(dracoLoader);
        return modelLoader.loadAsync(uri);
    }

    function loadAudioFromURI(uri) {
        return new Promise((resolve, reject) => {
            mAudioLoader.load(uri, resolve, null, reject);
        })
    }

    function checkThumbnail(assetId, asset, type) {
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
                    if (e instanceof Event ||
                        e.message && e.message.includes("A requested file or directory could not be found at the time an operation was processed")) {
                        // Thumbnail might not exist yet. Normal occurance, ignore.
                    } else {
                        console.error(e);
                        console.error('Failed to load thumbnail: ' + itemId);
                    }
                    return null;
                });
        }
    }

    function generateThumbnail(assetId, asset, type) {
        let thumbnail;
        if (type == AssetTypes.MODEL || type == Data.Moment) {
            thumbnail = ThumbnailCreator.generateSceneThumbnail(asset);
        } else if (type == AssetTypes.IMAGE) {
            thumbnail = ThumbnailCreator.generateImageThumbnail(asset);
        } else if (type == AssetTypes.AUDIO) {
            thumbnail = ThumbnailCreator.generateAudioThumbnail(asset);
        } else { console.error('invalid asset type: ' + type); return null; }

        mLoadedThumbnails[assetId] = thumbnail.toDataURL();

        if (!mWorkspace.isRemote) {
            let filename = THUMBNAIL_PREFIX + assetId + THUMBNAIL_SUFFIX;
            // store the file asyncronously.
            return new Promise(resolve => thumbnail.toBlob(resolve, 'image/jpeg'))
                .then(blob => {
                    let file = new File([blob], filename, { type: "image/jpeg" });
                    return mWorkspace.storeFile(file, false);
                })
                .then(() => filename)
                .catch(e => {
                    console.error(e);
                    console.error('Failed to store thumbnail for ' + assetId);
                });
        } else {
            return Promise.resolve();
        }
    }

    function clearCache(tag) {
        delete mLoadedThumbnails[tag];
        delete mLoadedAssets[tag];
        delete mLoadedFileURIs[tag];
    }

    this.updateModel = updateModel;
    this.loadDefaultEnvironmentCube = loadDefaultEnvironmentCube;
    this.loadAsset = loadAsset;
    this.loadThumbnail = loadThumbnail;
    this.loadAssetFile = loadAssetFile;
    this.generateThumbnail = generateThumbnail;
    this.cache = cache;
    this.clearCache = clearCache;
}