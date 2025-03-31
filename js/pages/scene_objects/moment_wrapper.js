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

    async function update(moment, model, assetUtil) {
        if (!moment) {
            parent.remove(mStoryGroup);
        } else {
            parent.add(mStoryGroup);

            let photosphere = model.photospheres.find(p => p.momentId == moment.id);
            if (!photosphere) { console.error('Malformed! Photosphere missing!'); }
            await mPhotosphereWrapper.update(photosphere, model, assetUtil);

            await updateWrapperArray(mPoseableAssetWrappers, model.poseableAssets.filter(p => p.momentId == moment.id),
                model, assetUtil, () => new PoseableAssetWrapper(mStoryGroup, audioListener));

            await updateWrapperArray(mPictureWrappers, model.pictures.filter(p => p.momentId == moment.id),
                model, assetUtil, () => new PictureWrapper(mStoryGroup, audioListener));

            await updateWrapperArray(mAudioWrappers, model.audios.filter(a => a.momentId == moment.id && !a.attachedId),
                model, assetUtil, () => new AudioWrapper(mStoryGroup, audioListener));

            await updateWrapperArray(mTeleportWrappers, model.teleports.filter(t => t.momentId == moment.id && !t.attachedId),
                model, assetUtil, () => new TeleportWrapper(mStoryGroup));
        }
    }

    function getTargets(ray, toolMode) {
        return [
            ...mPoseableAssetWrappers.map(w => w.getTargets(ray, toolMode)).flat(),
            ...mPictureWrappers.map(w => w.getTargets(ray, toolMode)).flat(),
            ...mTeleportWrappers.map(w => w.getTargets(ray, toolMode)).flat(),
            ...mAudioWrappers.map(w => w.getTargets(ray, toolMode)).flat(),
            ...mPhotosphereWrapper.getTargets(ray, toolMode),
        ]
    }


    async function updateWrapperArray(wrappers, dataItems, model, assetUtil, createFunction) {
        for (let i = 0; i < dataItems.length; i++) {
            if (!wrappers[i]) {
                wrappers.push(createFunction(dataItems[i]));
            }
            await wrappers[i].update(dataItems[i], model, assetUtil);
        }

        let deleteWrappers = wrappers.splice(dataItems.length)
        for (let wrapper of deleteWrappers) {
            wrapper.remove();
        }
    }

    this.update = update;
    this.getTargets = getTargets;
}