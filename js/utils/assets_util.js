import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AssetTypes, BOX_ASSET_PREFIXES, THUMBNAIL_PREFIX, THUMBNAIL_SUFFIX } from '../constants.js';
import { Data } from "../data.js";
import { logInfo } from './log_util.js';
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

    async function loadDefaultEnvironmentCube() {
        if (!mLoadedAssets['DEFAULT_ENV_BOX']) { // loaded from the web server.
            let files = BOX_ASSET_PREFIXES.map(f => f + "default.png");
            let cubeLoader = new THREE.CubeTextureLoader();
            cubeLoader.setPath('assets/default_env_box/')
            mLoadedAssets['DEFAULT_ENV_BOX'] = cubeLoader.load(files);
        }

        return mLoadedAssets['DEFAULT_ENV_BOX'];
    }

    async function loadImageAsset(assetId) {
        try {
            if (!mLoadedAssets[assetId]) {
                let asset = mModel.find(assetId);
                if (!asset) { console.error("Invalid image asset: " + assetId); throw new Error("Invalid model asset: " + assetId); }
                let image = await loadImage(asset.filename);
                mLoadedAssets[assetId] = image;
                await checkThumbnail(assetId, image, AssetTypes.IMAGE);
            }
            if (!mLoadedAssets[assetId]) { console.error('Failed to load asset: ' + assetId); return null; }
            return mLoadedAssets[assetId];
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async function loadImage(filename) {
        let uri = await mWorkspace.getFileAsDataURI(filename);
        let image = await mImageLoader.loadAsync(uri, null, null, function (error) { console.error('Error loading image', error); });
        return image;
    }

    async function loadModelAsset(assetId) {
        let asset = mModel.find(assetId);
        if (!asset || asset.type != AssetTypes.MODEL) { console.error("Bad asset", assetId, asset); throw new Error("Invalid model asset: " + assetId); }
        let model = await loadGLTFModel(asset.filename);

        if (!model) { console.error('Failed to load asset: ' + assetId); return null; }
        await checkThumbnail(assetId, model.scene, AssetTypes.MODEL);

        return model.scene;
    }

    async function loadGLTFModel(filename) {
        if (!mLoadedFiles[filename]) {
            mLoadedFiles[filename] = await mWorkspace.getFileAsDataURI(filename)
        }
        if (!mLoadedFiles[filename]) { console.error("failed to load file: " + filename); return null; }

        const modelLoader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('./node_modules/three/examples/jsm/libs/draco/');
        modelLoader.setDRACOLoader(dracoLoader);
        let model = await modelLoader.loadAsync(mLoadedFiles[filename], null,
            // called while loading is progressing
            function (xhr) {
                logInfo(file + " "(xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // called when loading has errors
            function (error) {
                console.error('An error happened', error);
            }
        );
        return model;
    }

    async function loadAudioAsset(assetId) {
        if (!mLoadedAssets[assetId]) {
            let asset = mModel.assets.find(a => a.id == assetId);
            if (!asset) { console.error("Invalid audio asset: " + assetId); return null; }

            let buffer = await loadAudio(asset.filename)
            if (!buffer) { console.error('Failed to load asset: ' + assetId); return null; }

            mLoadedAssets[assetId] = buffer;
            await checkThumbnail(assetId, buffer, AssetTypes.AUDIO);
        }
        return mLoadedAssets[assetId];
    }

    async function loadAudio(filename) {
        try {
            let uri = await mWorkspace.getFileAsDataURI(filename);
            let buffer = await new Promise((resolve, reject) => mAudioLoader.load(uri, resolve, null, reject));
            return buffer;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async function loadThumbnail(itemId) {
        try {
            if (!mLoadedThumbnails[itemId]) {
                let item = mModel.find(itemId);
                if (!item) { console.error("Invalid item id: " + itemId); return null; }
                let uri = await mWorkspace.getFileAsDataURI(THUMBNAIL_PREFIX + itemId + THUMBNAIL_SUFFIX);
                let image = await mImageLoader.loadAsync(uri, null, null, function (error) { console.error('Error loading thumbnail:', error); });
                mLoadedThumbnails[itemId] = image;
            }
            return mLoadedThumbnails[itemId];
        } catch (e) {
            if (e.message && e.message.includes("A requested file or directory could not be found at the time an operation was processed")) {
                // Thumbnail might not exist yet. Normal occurance, ignore.
            } else {
                console.error(e);
            }
            return null;
        }
    }

    async function checkThumbnail(assetId, asset, type) {
        if (workspace.isRemote) {
            // This is only handled by local system
            return;
        }

        // check that the thumbnail exists
        if (!mLoadedThumbnails[assetId]) {
            // maybe it's just not been loaded
            await loadThumbnail(assetId);
            if (!mLoadedThumbnails[assetId]) {
                // no it's really missing, create it. 
                await generateThumbnail(assetId, asset, type);
            }
        }
    }

    async function loadAssetFile(filename, type) {
        let asset = null;
        if (type == AssetTypes.MODEL) {
            asset = await loadGLTFModel(filename);
            if (asset) asset = asset.scene;
        } else if (type == AssetTypes.IMAGE) {
            asset = await loadImage(filename);
        } else if (type == AssetTypes.AUDIO) {
            asset = await loadAudio(filename);
        } else { console.error('invalid asset type: ' + type); return null; }

        return asset;
    }

    async function generateThumbnail(assetId, asset, type) {
        let thumbnail;
        if (type == AssetTypes.MODEL || type == Data.Moment) {
            thumbnail = ThumbnailCreator.generateSceneThumbnail(asset);
        } else if (type == AssetTypes.IMAGE) {
            thumbnail = ThumbnailCreator.generateImageThumbnail(asset);
        } else if (type == AssetTypes.AUDIO) {
            thumbnail = ThumbnailCreator.generateAudioThumbnail(asset);
        } else { console.error('invalid asset type: ' + type); return null; }

        let filename = THUMBNAIL_PREFIX + assetId + THUMBNAIL_SUFFIX;
        let blob = await new Promise(resolve => thumbnail.toBlob(resolve, 'image/jpeg'));
        let file = new File([blob], filename, { type: "image/jpeg" });

        await workspace.storeFile(file, false);
        return filename;
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