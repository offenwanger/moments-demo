import * as THREE from 'three';
import { AudioWrapper } from './audio_wrapper.js';
import { PhotosphereWrapper } from './photosphere_wrapper.js';
import { PictureWrapper } from "./picture_wrapper.js";
import { PoseableAssetWrapper } from "./poseable_asset_wrapper.js";
import { TeleportWrapper } from './teleport_wrapper.js';

export function MomentWrapper(parent, audioListener) {
    let mStoryGroup = new THREE.Group();

    let mPhotosphereWrapper = new PhotosphereWrapper(mStoryGroup);
    let mPoseableAssetWrappers = [];
    let mPictureWrappers = [];
    let mAudioWrappers = [];
    let mTeleportWrappers = [];

    function updateModel(moment, model, assetUtil) {
        if (!moment) {
            parent.remove(mStoryGroup);
            updateWrapperArray(mPoseableAssetWrappers, [], model, assetUtil, () => new PoseableAssetWrapper(mStoryGroup, audioListener));
            updateWrapperArray(mPictureWrappers, [], model, assetUtil, () => new PictureWrapper(mStoryGroup, audioListener));
            updateWrapperArray(mAudioWrappers, [], model, assetUtil, () => new AudioWrapper(mStoryGroup, audioListener));
            updateWrapperArray(mTeleportWrappers, [], model, assetUtil, () => new TeleportWrapper(mStoryGroup));
        } else {
            parent.add(mStoryGroup);

            let photosphere = model.photospheres.find(p => p.momentId == moment.id);
            if (!photosphere) { console.error('Malformed! Photosphere missing!'); }
            mPhotosphereWrapper.updateModel(photosphere, model, assetUtil);

            updateWrapperArray(mPoseableAssetWrappers, model.poseableAssets.filter(p => p.momentId == moment.id),
                model, assetUtil, () => new PoseableAssetWrapper(mStoryGroup, audioListener));

            updateWrapperArray(mPictureWrappers, model.pictures.filter(p => p.momentId == moment.id),
                model, assetUtil, () => new PictureWrapper(mStoryGroup, audioListener));

            updateWrapperArray(mAudioWrappers, model.audios.filter(a => a.momentId == moment.id && !a.attachedId),
                model, assetUtil, () => new AudioWrapper(mStoryGroup, audioListener));

            updateWrapperArray(mTeleportWrappers, model.teleports.filter(t => t.momentId == moment.id && !t.attachedId),
                model, assetUtil, () => new TeleportWrapper(mStoryGroup));
        }
    }

    function getTargets(ray, toolState) {
        return [
            ...mPoseableAssetWrappers.map(w => w.getTargets(ray, toolState)).flat(),
            ...mPictureWrappers.map(w => w.getTargets(ray, toolState)).flat(),
            ...mTeleportWrappers.map(w => w.getTargets(ray, toolState)).flat(),
            ...mAudioWrappers.map(w => w.getTargets(ray, toolState)).flat(),
            ...mPhotosphereWrapper.getTargets(ray, toolState),
        ]
    }


    function updateWrapperArray(wrappers, dataItems, model, assetUtil, createFunction) {
        for (let i = 0; i < dataItems.length; i++) {
            if (!wrappers[i]) {
                wrappers.push(createFunction(dataItems[i]));
            }
            wrappers[i].updateModel(dataItems[i], model, assetUtil);
        }

        let deleteWrappers = wrappers.splice(dataItems.length)
        for (let wrapper of deleteWrappers) {
            wrapper.remove();
        }
    }

    this.updateModel = updateModel
    this.getTargets = getTargets;
}