import * as THREE from 'three';
import { Data } from "../../data.js";
import { ButtonInput } from "../components/button_input.js";
import { TextInput } from "../components/text_input.js";

export function AssetPosePanel(container) {
    let mUpdateAttributeCallback = (id, attrs) => { };
    let mNavigationCallback = (id) => { };

    let mModel = new Data.StoryModel();
    let mAssetPose = new Data.AssetPose();
    let mAssetPoseId = null;

    let mPanelContainer = document.createElement('div');
    container.appendChild(mPanelContainer); hide();

    let mBackButton = new ButtonInput(mPanelContainer)
        .setId('assetpose-back-button')
        .setLabel("<- Back")
        .setOnClick(() => mNavigationCallback(mAssetPose.parentId));

    let mNameDisplay = document.createElement('div');
    mNameDisplay.setAttribute('id', 'assetpose-name-display');
    mPanelContainer.appendChild(mNameDisplay);

    let mAttachedTeleport = new ButtonInput(mPanelContainer)
        .setId('assetpose-teleport-button');
    mAttachedTeleport.hide();
    let mAttachedAudio = new ButtonInput(mPanelContainer)
        .setId('assetpose-audio-button');
    mAttachedAudio.hide();

    let mPositionHeader = document.createElement('div');
    mPositionHeader.textContent = 'Position'
    mPanelContainer.appendChild(mPositionHeader);
    let mPositionXInput = new TextInput(mPanelContainer, 'number')
        .setLabel("x")
        .setOnChange((newNum) => mUpdateAttributeCallback(mAssetPoseId, { x: newNum }));
    let mPositionYInput = new TextInput(mPanelContainer, 'number')
        .setLabel("y")
        .setOnChange((newNum) => mUpdateAttributeCallback(mAssetPoseId, { y: newNum }));
    let mPositionZInput = new TextInput(mPanelContainer, 'number')
        .setLabel("z")
        .setOnChange((newNum) => mUpdateAttributeCallback(mAssetPoseId, { z: newNum }));

    let mRotationXInput = new TextInput(mPanelContainer, 'number')
        .setLabel("ψ")
        .setOnChange(() => mUpdateAttributeCallback(mAssetPoseId, { orientation: getOrientationArray() }));
    let mRotationYInput = new TextInput(mPanelContainer, 'number')
        .setLabel("θ")
        .setOnChange(() => mUpdateAttributeCallback(mAssetPoseId, { orientation: getOrientationArray() }));
    let mRotationZInput = new TextInput(mPanelContainer, 'number')
        .setLabel("φ")
        .setOnChange(() => mUpdateAttributeCallback(mAssetPoseId, { orientation: getOrientationArray() }));

    let mScaleInput = new TextInput(mPanelContainer, 'number')
        .setLabel("Scale")
        .setOnChange((newNum) => mUpdateAttributeCallback(mAssetPoseId, { scale: newNum }));

    function show(model, assetPoseId) {
        mModel = model;
        mAssetPoseId = assetPoseId;
        mAssetPose = mModel.find(assetPoseId);

        mNameDisplay.innerHTML = mAssetPose.name;

        mPositionXInput.setText(Math.round(mAssetPose.x * 1000) / 1000);
        mPositionYInput.setText(Math.round(mAssetPose.y * 1000) / 1000);
        mPositionZInput.setText(Math.round(mAssetPose.z * 1000) / 1000);
        mScaleInput.setText(Math.round(mAssetPose.scale * 1000) / 1000);

        let quat = new THREE.Quaternion(...mAssetPose.orientation);
        let euler = new THREE.Euler().setFromQuaternion(quat);

        mRotationXInput.setText(Math.round(180 / Math.PI * euler.x * 1000) / 1000);
        mRotationYInput.setText(Math.round(180 / Math.PI * euler.y * 1000) / 1000);
        mRotationZInput.setText(Math.round(180 / Math.PI * euler.z * 1000) / 1000);

        let teleport = model.teleports.find(t => t.attachedId == assetPoseId);
        if (teleport) {
            mAttachedTeleport
                .setLabel(teleport.name)
                .setOnClick(() => mNavigationCallback(teleport.id))
                .show();
        } else {
            mAttachedTeleport.hide();
        }

        let audio = model.audios.find(t => t.attachedId == assetPoseId);
        if (audio) {
            mAttachedAudio
                .setLabel(audio.name)
                .setOnClick(() => mNavigationCallback(audio.id))
                .show();
        } else {
            mAttachedAudio.hide();
        }

        mPanelContainer.style['display'] = '';
    }

    function hide() {
        mPanelContainer.style['display'] = 'none';
    }

    function getOrientationArray() {
        let x = mRotationXInput.getText();
        let y = mRotationYInput.getText();
        let z = mRotationZInput.getText();
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            console.error('Invalid angles: ' + x + ',' + y + ',' + z);
            return [0, 0, 0, 1];
        }
        let euler = new THREE.Euler(x * Math.PI / 180, y * Math.PI / 180, z * Math.PI / 180)
        let quat = new THREE.Quaternion().setFromEuler(euler);
        return quat.toArray();
    }


    this.show = show;
    this.hide = hide;
    this.setUpdateAttributeCallback = (func) => mUpdateAttributeCallback = func;
    this.setNavigationCallback = (func) => mNavigationCallback = func;
}