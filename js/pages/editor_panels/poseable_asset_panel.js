import { Util } from "../../utils/utility.js";
import { ButtonInput } from "../components/button_input.js";
import { TextInput } from "../components/text_input.js";

export function PoseableAssetPanel(container) {
    let mUpdateAttributeCallback = (id, attr, value) => { };
    let mDeleteCallback = (id) => { };
    let mNavigationCallback = (id) => { };

    let mModel = null;
    let mPoseableAssetId = null;
    let mPoseableAsset = null;

    let mPanelContainer = document.createElement("div")
    container.appendChild(mPanelContainer);
    hide();

    let mBackButton = new ButtonInput(mPanelContainer)
        .setId('poseableAsset-back-button')
        .setLabel("<- Back")
        .setOnClick(() => mNavigationCallback(mPoseableAsset.momentId));

    let mNameInput = new TextInput(mPanelContainer)
        .setId('poseableAsset-name-input')
        .setLabel("Name")
        .setOnChange((newText) => mUpdateAttributeCallback(mPoseableAssetId, { name: newText }));

    let mAssetPosesContainer = document.createElement('div');
    mAssetPosesContainer.setAttribute('id', 'poseable-asset-asset-poses');
    mPanelContainer.appendChild(mAssetPosesContainer)
    let mAssetPosesList = [];

    let mDeleteButton = new ButtonInput(mPanelContainer)
        .setId('poseableAsset-delete-button')
        .setLabel('Delete')
        .setOnClick(() => mDeleteCallback(mPoseableAssetId));

    function show(model, poseableAssetId) {
        mModel = model;
        mPoseableAssetId = poseableAssetId;
        mPoseableAsset = mModel.find(mPoseableAssetId);

        mNameInput.setText(mPoseableAsset.name);

        let assetPoses = model.assetPoses.filter(p => p.parentId == poseableAssetId);
        Util.setComponentListLength(mAssetPosesList, assetPoses.length, () => new ButtonInput(mAssetPosesContainer))
        for (let i = 0; i < assetPoses.length; i++) {
            mAssetPosesList[i].setId("assetpose-button-" + assetPoses[i].id)
                .setLabel(assetPoses[i].name)
                .setOnClick(() => mNavigationCallback(assetPoses[i].id));
        }

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