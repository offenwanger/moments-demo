import { AssetTypes } from "../../constants.js";
import { FileUtil } from "../../utils/file_util.js";
import { Util } from "../../utils/utility.js";
import { ButtonInput } from "../components/button_input.js";

export function AssetList(container) {
    let mAssetsUploadCallback = async (files) => { }
    let mAssetsClearCallback = async () => { }

    let userAssetTypes = [
        AssetTypes.AUDIO,
        AssetTypes.IMAGE,
        AssetTypes.MODEL,
    ]

    let mAssets = [];

    let mDialog = document.createElement('dialog');
    mDialog.style['position'] = 'absolute';
    mDialog.style['top'] = '20px';
    container.appendChild(mDialog);
    let mContent = document.createElement('div');
    mDialog.appendChild(mContent);

    let mNewAssetButton = new ButtonInput(mContent)
        .setId("asset-add-button")
        .setLabel("New Asset [+]")
        .setOnClick(async () => {
            if (mSelectionType) {
                let accept = null;
                if (mSelectionType == AssetTypes.AUDIO) {
                    accept = "audio/*";
                } else if (mSelectionType == AssetTypes.IMAGE) {
                    accept = "image/*";
                } else if (mSelectionType == AssetTypes.MODEL) {
                    accept = ".glb,.glTF";
                }
                let file = await FileUtil.showFilePicker(accept);
                if (file) await mAssetsUploadCallback([file]);
            } else {
                let files = await FileUtil.showFilePicker(null, true);
                await mAssetsUploadCallback(files);
            }
        });

    let mAssetsContainer = document.createElement('div');
    mAssetsContainer.setAttribute('id', 'assets-container');
    mAssetsContainer.style['height'] = '400px';
    mAssetsContainer.style['overflow'] = 'scroll';
    mContent.appendChild(mAssetsContainer)
    let mAssetList = []

    let mSelectedAssetId = null;
    let mSelectionType = null;

    let mClearAssetsButton = new ButtonInput(mContent)
        .setId("dialog-clear-button")
        .setLabel("Clear Unused Assets")
        .setOnClick(async () => {
            await mAssetsClearCallback();
        });

    let mCloseButton = new ButtonInput(mContent)
        .setId("dialog-close-button")
        .setLabel("Close")
        .setOnClick(async () => {
            mDialog.close()
        });

    window.addEventListener('pointerdown', (event) => {
        if (mDialog.open && !mDialog.contains(event.target)) {
            mDialog.close();
        }
    })

    function updateModel(model) {
        mAssets = model.assets;
        refreshList();
    }

    async function show(type = null) {
        mSelectionType = type;
        refreshList();
        mDialog.show();
    }

    function refreshList() {
        let typeAssets = mSelectionType ?
            mAssets.filter(a => a.type == mSelectionType) :
            mAssets.filter(a => userAssetTypes.includes(a.type));
        Util.setComponentListLength(mAssetList, typeAssets.length, () => new ButtonInput(mAssetsContainer));
        for (let i = 0; i < typeAssets.length; i++) {
            mAssetList[i].setId("asset-button-" + typeAssets[i].id)
                .setLabel(typeAssets[i].name)
                .setOnClick(async () => {
                    mSelectedAssetId = typeAssets[i].id;
                    mDialog.close();
                });
        }
    }

    this.updateModel = updateModel;
    this.show = show;
    this.onAssetsUpload = (func) => mAssetsUploadCallback = func;
    this.onAssetsClear = (func) => mAssetsClearCallback = func;
}