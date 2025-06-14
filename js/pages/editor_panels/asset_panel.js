import { Util } from "../../utils/utility.js";
import { ButtonInput } from "../components/button_input.js";
import { TextInput } from "../components/text_input.js";

export function AssetPanel(container) {
    let mUpdateAttributeCallback = (id, attr, value) => { };
    let mDeleteCallback = (id) => { };
    let mNavigationCallback = (id) => { };

    let mScrollHeight = 0;

    let mAsset;
    let mAssetId;
    let mModel;

    let mPanelContainer = document.createElement('div');
    container.appendChild(mPanelContainer);
    hide();

    let mBackToStoryButton = new ButtonInput(mPanelContainer)
        .setId('back-button')
        .setLabel('<- Story')
        .setOnClick(() => mNavigationCallback(mModel.id))

    let mNameInput = new TextInput(mPanelContainer)
        .setId('asset-name-input')
        .setLabel("Name")
        .setOnChange((newText) => mUpdateAttributeCallback(mAsset, { name: newText }));

    let mUsedByContainer = document.createElement('div')
    mUsedByContainer.setAttribute('id', 'poseableAssets');
    mPanelContainer.appendChild(mUsedByContainer)
    mUsedByContainer.appendChild(Object.assign(document.createElement('div'),
        { innerHTML: 'Position' }));
    let mUsedByList = [];

    let mDeleteButton = new ButtonInput(mPanelContainer)
        .setId('asset-delete-button')
        .setLabel('Delete')
        .setOnClick(() => mDeleteCallback(mAssetId))

    function show(model, assetId) {
        mModel = model;
        mAssetId = assetId;
        mAsset = model.getAsset(assetId);

        mNameInput.setText(mAsset.name);

        mFileButton.setLabel(mAsset.filename);

        let usedByItems = model.getItemsForAsset(mAssetId);
        Util.setComponentListLength(mUsedByList, usedByItems.length, () => new ButtonInput(mUsedByContainer))
        for (let i = 0; i < usedByItems.length; i++) {
            mUsedByList[i].setId("asset-used-by-button-" + usedByItems[i].id)
                .setLabel(usedByItems[i].name)
                .setOnClick(() => mNavigationCallback(usedByItems[i].id));
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