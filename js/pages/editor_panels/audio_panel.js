import { Data } from "../../data.js";
import { ButtonInput } from "../components/button_input.js";
import { TextInput } from "../components/text_input.js";
import { ToggleInput } from "../components/toggle_input.js";

export function AudioPanel(container) {
    let mUpdateAttributeCallback = (id, attrs) => { };
    let mDeleteCallback = (id) => { };
    let mNavigationCallback = (id) => { };

    let mModel = new Data.StoryModel();
    let mAudio = new Data.Audio();
    let mAudioId = null;

    let mPanelContainer = document.createElement('div');
    container.appendChild(mPanelContainer);
    hide();

    let mBackButton = new ButtonInput(mPanelContainer)
        .setId('audio-back-button')
        .setLabel("<- Back")
        .setOnClick(() => mNavigationCallback(mAudio.momentId));

    let mNameInput = new TextInput(mPanelContainer)
        .setId('audio-name-input')
        .setLabel("Name")
        .setOnChange((newText) => mUpdateAttributeCallback(mAudioId, { name: newText }));

    let mAmbientInput = new ToggleInput(mPanelContainer)
        .setId('audio-ambient-input')
        .setLabel('Ambient')
        .onChange(val => mUpdateAttributeCallback(mAudioId, { ambient: val }))

    let mVolumeInput = new TextInput(mPanelContainer, 'number')
        .setLabel("Volume")
        .setOnChange((newNum) => mUpdateAttributeCallback(mAudioId, { volume: newNum }));

    let mPositionHeader = document.createElement('div');
    mPositionHeader.innerHTML = 'Position'
    mPanelContainer.appendChild(mPositionHeader)
    let mPositionXInput = new TextInput(mPanelContainer, 'number')
        .setLabel("x")
        .setOnChange((newNum) => mUpdateAttributeCallback(mAudioId, { x: newNum }));
    let mPositionYInput = new TextInput(mPanelContainer, 'number')
        .setLabel("y")
        .setOnChange((newNum) => mUpdateAttributeCallback(mAudioId, { y: newNum }));
    let mPositionZInput = new TextInput(mPanelContainer, 'number')
        .setLabel("z")
        .setOnChange((newNum) => mUpdateAttributeCallback(mAudioId, { z: newNum }));

    let mDeleteButton = new ButtonInput(mPanelContainer)
        .setId('audio-delete-button')
        .setLabel('Delete')
        .setOnClick(() => mDeleteCallback(mAudioId))

    function show(model, audioId) {
        mModel = model;
        mAudioId = audioId;
        mAudio = mModel.find(audioId);

        mNameInput.setText(mAudio.name);
        mAmbientInput.setVal(mAudio.ambient);

        mPositionXInput.setText(Math.round(mAudio.x * 1000) / 1000);
        mPositionYInput.setText(Math.round(mAudio.y * 1000) / 1000);
        mPositionZInput.setText(Math.round(mAudio.z * 1000) / 1000);

        mVolumeInput.setText(Math.round(mAudio.volume * 100) / 100);

        mPanelContainer.style['display'] = '';
    }

    function hide() {
        mPanelContainer.style['display'] = 'none';
    }


    this.show = show;
    this.hide = hide;
    this.setUpdateAttributeCallback = (func) => mUpdateAttributeCallback = func;
    this.setDeleteCallback = (func) => mDeleteCallback = func;
    this.setNavigationCallback = (func) => mNavigationCallback = func;
}