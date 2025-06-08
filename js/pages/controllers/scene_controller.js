import * as THREE from 'three';
import { Data } from '../../data.js';
import { MomentWrapper } from '../scene_objects/moment_wrapper.js';
import { OtherUserWrapper } from '../scene_objects/other_user_wrapper.js';

export function SceneController(audioListener) {
    let mScene = new THREE.Scene();
    let mContent = new THREE.Group();
    mScene.add(mContent);
    let mCurrentMomentId = null;
    let mMomentWrapper = new MomentWrapper(mContent, audioListener);
    let mModel = new Data.StoryModel();
    let mAssetUtil = null;

    let mOtherUsers = [];

    mScene.add(new THREE.AmbientLight(0xffffff));
    mScene.add(new THREE.DirectionalLight(0xffffff, 0.9));

    let mEnvironmentBox;

    function updateOtherUser(id, head, handR, handL, momentId) {
        let otherUser = mOtherUsers.find(o => o.getId() == id);
        if (!otherUser) console.error("User not found!", id);
        otherUser.update(head, handR, handL, momentId == mCurrentMomentId);
    }

    function removeOtherUser(id) {
        let otherUser = mOtherUsers.find(o => o.getId() == id);
        mOtherUsers = mOtherUsers.filter(o => o.getId() != id);
        otherUser.remove();
    }

    function addOtherUser(id, head, handR, handL, momentId) {
        let otherUser = new OtherUserWrapper(mScene, id);
        otherUser.update(head, handR, handL, momentId == mCurrentMomentId);
        mOtherUsers.push(otherUser);
    }


    function updateModel(model, assetUtil) {
        mModel = model;
        mAssetUtil = assetUtil;

        let moment = null;
        if (mCurrentMomentId) {
            moment = mModel.find(mCurrentMomentId);
            if (!moment) {
                // moment doesn't or no longer exists
                mCurrentMomentId = null;
            }
        }
        mMomentWrapper.updateModel(moment, model, assetUtil);

        if (!mEnvironmentBox) {
            assetUtil.loadDefaultEnvironmentCube()
                .then(box => {
                    mEnvironmentBox = box
                    mScene.background = mEnvironmentBox;
                });
        }
    }

    function setCurrentMoment(momentId = null) {
        let oldMomentId = mCurrentMomentId;
        mCurrentMomentId = momentId;
        if (mAssetUtil) updateModel(mModel, mAssetUtil);

        // update the thumbnail
        if (oldMomentId && mAssetUtil) {
            mAssetUtil.generateThumbnail(oldMomentId, mScene, Data.Moment)
                // clear the cache so we reload it next time we want it
                .then(() => mAssetUtil.clearCache(oldMomentId));
        }
    }

    function getTargets(ray, tool) {
        return [...mMomentWrapper.getTargets(ray, tool)]
    }

    function toSceneCoordinates(v) {
        let local = new THREE.Vector3().copy(v);
        mContent.worldToLocal(local)
        return local;
    }

    function setScale(scale) {
        mContent.scale.set(scale, scale, scale);
    }

    this.updateModel = updateModel;
    this.setCurrentMoment = setCurrentMoment;
    this.getTargets = getTargets;
    this.toSceneCoordinates = toSceneCoordinates;
    this.setScale = setScale;
    this.updateOtherUser = updateOtherUser;
    this.removeOtherUser = removeOtherUser;
    this.addOtherUser = addOtherUser;
    this.getScene = () => mScene;
    this.getContent = () => mContent;
}