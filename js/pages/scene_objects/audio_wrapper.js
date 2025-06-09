import * as THREE from 'three';
import { AssetTypes, ToolButtons } from '../../constants.js';
import { Data } from "../../data.js";
import { InteractionTargetInterface } from "./interaction_target_interface.js";

export function AudioWrapper(parent, audioListener) {
    let mParent = parent;
    let mAudio = new Data.Audio();
    let mInitialized = false;
    let mInteractionTarget = createInteractionTarget(); 1

    const mSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 32, 16),
        new THREE.MeshPhysicalMaterial({
            color: 0xaaaa99,
            metalness: 0,
            roughness: 0.2,
            ior: 1.5,
            thickness: 0.02,
            transmission: 1,
            specularIntensity: 1,
            specularColor: 0xffffff,
            opacity: 1,
            side: THREE.DoubleSide,
            transparent: true
        }));

    const mSound = new THREE.PositionalAudio(audioListener);
    mSound.setLoop(true);
    mSphere.add(mSound);

    const mAudioMap = new THREE.TextureLoader().load('assets/images/audioIcon.png');
    const mAudioSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: mAudioMap }));
    mAudioSprite.scale.set(0.09, 0.09, 0.09);
    mAudioSprite.position.set(0.1, 0.1, 0);
    mSphere.add(mAudioSprite)

    function updateModel(audio, model, assetUtil) {
        mParent.add(mSphere);
        mSphere.position.set(audio.x, audio.y, audio.z);
        mSphere.userData.id = audio.id;

        mSound.setVolume(audio.volume);
        mAudio = audio;

        mInitialized = false;
        assetUtil.loadAsset(audio.assetId, AssetTypes.AUDIO)
            .then(buffer => {
                if (!buffer) {
                    console.error('Failed to load audio.')
                    return;
                }
                mSound.setBuffer(buffer);
                mInitialized = true;
                if (audio.ambient) {
                    try { mSound.play(); } catch (e) { console.error(e); }
                } else {
                    try { mSound.stop(); } catch (e) { console.error(e); }
                }
            })
    }

    function getId() {
        return mAudio.id;
    }

    function remove() {
        mParent.remove(mSphere);
        if (mInitialized) try {
            mSound.stop();
        } catch (e) { console.error(e); }
    }

    function getTargets(ray, toolState) {
        if (toolState.tool == ToolButtons.MOVE) {
            let intersect = ray.intersectObject(mSphere);
            if (intersect.length == 0) return [];
            intersect = intersect[0];
            mInteractionTarget.getIntersection = () => intersect;
            return [mInteractionTarget];
        } else return [];
    }

    function createInteractionTarget() {
        let target = new InteractionTargetInterface();
        target.getObject3D = () => { return mSphere; }
        target.getId = () => mAudio.id;
        target.highlight = function (toolState) {
            mSphere.material.color.setHex(0xff2299)
        };
        target.select = function (toolState) {
            mSphere.material.color.setHex(0xffffff)
            if (mAudio && !mAudio.ambient) {
                if (mInitialized) try {
                    mSound.play();
                } catch (e) { console.error(e); }
            }
        };
        target.idle = (toolState) => {
            mSphere.material.color.setHex(0xaaaa99);
            if (mAudio && !mAudio.ambient) {
                if (mInitialized) try {
                    mSound.pause();
                } catch (e) { console.error(e); }
            }
        }
        target.getLocalPosition = () => {
            let p = new THREE.Vector3();
            p.copy(mSphere.position)
            return p;
        }

        target.getWorldPosition = () => {
            let worldPos = new THREE.Vector3();
            mSphere.getWorldPosition(worldPos);
            return worldPos;
        }

        target.setWorldPosition = (worldPos) => {
            mSphere.position.copy(worldPos)
        }

        target.isAudio = () => true;
        return target;
    }

    this.getTargets = getTargets;
    this.updateModel = updateModel
    this.getId = getId;
    this.remove = remove;
}