import * as THREE from 'three';
import { AssetTypes, ToolButtons } from '../../constants.js';
import { Data } from "../../data.js";
import { InteractionTargetInterface } from "./interaction_target_interface.js";

export function PictureWrapper(parent, audioListener) {
    let mParent = parent;
    let mPicture = new Data.Picture();
    let mCurrentAssetId = null;
    let mInteractionTarget = createInteractionTarget();

    let mRatio = 1;

    const mGeometry = new THREE.PlaneGeometry(1, 1);
    const mFrontPlane = new THREE.Mesh(mGeometry,
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide }));
    const mBackPlane = new THREE.Mesh(mGeometry,
        new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.BackSide }));

    const mTeleportMap = new THREE.TextureLoader().load('assets/images/teleportIcon.png');
    const mTeleportSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: mTeleportMap }));
    mTeleportSprite.position.x = 0.5;
    mTeleportSprite.position.y = 0.5;

    const mAudioMap = new THREE.TextureLoader().load('assets/images/audioIcon.png');
    const mAudioSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: mAudioMap }));
    mAudioSprite.position.x = -0.5;
    mAudioSprite.position.y = 0.5;

    const mSound = new THREE.PositionalAudio(audioListener);
    let mInteractionSound = false;

    const mPlanes = new THREE.Group();
    mPlanes.add(mFrontPlane, mBackPlane, mSound);
    mParent.add(mPlanes);

    function updateModel(picture, model, assetUtil) {
        mPicture = picture;
        setPlaneData(picture, mRatio);

        let teleport = model.teleports.find(t => t.attachedId == picture.id);
        if (teleport) {
            mPlanes.add(mTeleportSprite);
            mInteractionTarget.isTeleport = () => true;
        } else {
            mPlanes.remove(mTeleportSprite);
            mInteractionTarget.isTeleport = () => false;
        }

        let audio = model.audios.find(a => a.attachedId == picture.id);
        if (audio) {
            mPlanes.add(mAudioSprite);
            assetUtil.loadAsset(audio.assetId, AssetTypes.AUDIO)
                .then(buffer => {
                    if (!buffer) {
                        console.error('Failed to load piccture audio.')
                        return;
                    }
                    mSound.setBuffer(buffer);
                    mSound.setLoop(true);
                    mSound.setVolume(audio.volume);
                    if (audio.ambient) {
                        try { mSound.play(); } catch (e) { console.error(e); }
                    } else {
                        mInteractionSound = true;
                    }
                })
            mInteractionTarget.isAudio = () => true;
        } else {
            mPlanes.remove(mAudioSprite);
            mInteractionTarget.isAudio = () => false;
            mInteractionSound = false;
        }

        if (mCurrentAssetId != picture.assetId) {
            mCurrentAssetId = picture.assetId;
            assetUtil.loadAsset(picture.assetId, AssetTypes.IMAGE)
                .then(image => {
                    if (!image || isNaN(image.height / image.width)) {
                        console.error('Invalid image: ' + picture.assetId);
                        mFrontPlane.material.map = null;
                        mFrontPlane.material.needsUpdate = true
                        // null this so we try to load again next time.
                        mCurrentAssetId = null;
                        mRatio = 1;
                        return;
                    }

                    mRatio = image.height / image.width;
                    mFrontPlane.material.map = new THREE.Texture(image);
                    mFrontPlane.material.needsUpdate = true
                    mFrontPlane.material.map.needsUpdate = true

                    setPlaneData(mPicture, mRatio)
                });
        }
    }

    function setPlaneData(picture, ratio) {
        mPlanes.position.set(picture.x, picture.y, picture.z);
        mPlanes.setRotationFromQuaternion(new THREE.Quaternion().fromArray(picture.orientation));
        mPlanes.scale.set(picture.scale, picture.scale * ratio, picture.scale)
        mTeleportSprite.scale.set(0.1 / picture.scale, 0.1 / (picture.scale * ratio), 0.1 / picture.scale);
        mAudioSprite.scale.set(0.1 / picture.scale, 0.1 / (picture.scale * ratio), 0.1 / picture.scale);
        mPlanes.userData.id = picture.id;
    }

    function getId() {
        return mPicture.id;
    }

    function remove() {
        mParent.remove(mPlanes);
        try { mSound.stop(); } catch (e) { console.error(e); }
    }

    function getTargets(ray, toolState) {
        if (toolState.tool != ToolButtons.MOVE) return [];

        const intersect = ray.intersectObject(mPlanes);
        if (intersect.length > 0) {
            mInteractionTarget.getIntersection = () => { return intersect[0]; }
            return [mInteractionTarget];
        } else return [];
    }

    function createInteractionTarget() {
        let target = new InteractionTargetInterface();
        target.getLocalPosition = () => {
            let p = new THREE.Vector3();
            p.copy(mPlanes.position)
            return p;
        }
        target.getWorldPosition = () => {
            let worldPos = new THREE.Vector3();
            mPlanes.getWorldPosition(worldPos);
            return worldPos;
        }
        target.setWorldPosition = (worldPos) => {
            let localPosition = mPlanes.parent.worldToLocal(worldPos);
            mPlanes.position.copy(localPosition)
        }
        target.getLocalOrientation = () => {
            let q = new THREE.Quaternion();
            q.copy(mPlanes.quaternion)
            return q;
        }
        target.getWorldOrientation = () => {
            let q = new THREE.Quaternion();
            mPlanes.getWorldQuaternion(q);
            return q;
        }
        target.setWorldOrientation = (orientation) => {
            if (!mPlanes.parent) { mPlanes.quaternion.copy(orientation); return; }
            // orientation = parentOrientation * localOrientation 
            // parentOrienataion^-1 * orientation  = localOrientation
            let q = new THREE.Quaternion()
            mPlanes.parent.getWorldQuaternion(q);
            q.invert().multiply(orientation);
            mPlanes.quaternion.copy(q);
        }
        target.getScale = () => {
            return mPlanes.scale.x;
        }
        target.setScale = (scale) => {
            mPlanes.scale.set(scale, scale * mRatio, scale);
        }
        target.getParent = () => { return null; }
        target.getRoot = () => { return target; }
        target.getObject3D = () => { return mPlanes; }
        target.highlight = (toolState) => {
            mFrontPlane.material.color.set(0x0000ff);
            mFrontPlane.material.needsUpdate = true;
            mBackPlane.material.color.set(0xaaaaff);
            mBackPlane.material.needsUpdate = true;
        };
        target.idle = (toolState) => {
            mFrontPlane.material.color.set(0xffffff);
            mFrontPlane.material.needsUpdate = true;
            mBackPlane.material.color.set(0xaaaaaa);
            mBackPlane.material.needsUpdate = true;
            if (mInteractionSound) { try { mSound.pause(); } catch (e) { console.error(e); } }
        }
        target.select = (toolState) => {
            mFrontPlane.material.color.set(0xffffff);
            mFrontPlane.material.needsUpdate = true;
            mBackPlane.material.color.set(0xaaaaaa);
            mBackPlane.material.needsUpdate = true;
            if (mInteractionSound) { try { mSound.play(); } catch (e) { console.error(e); } }
        }
        target.getId = () => mPicture.id;
        return target;
    }

    this.getTargets = getTargets;
    this.updateModel = updateModel
    this.getId = getId;
    this.remove = remove;
}