import { FileUtil } from "../../utils/file_util.js";
import { Util } from "../../utils/utility.js";
import { ButtonInput } from "../components/button_input.js";
import { LabeledImage } from "../components/labeled_image.js";

export function AssetList(container) {
    let mAssetsUploadCallback = async (files) => { }
    let mAssetsClearCallback = async () => { }

    let mAssets = [];
    let mAssetList = []
    let mAssetUtil = null;

    let mDialog = document.createElement('dialog');
    mDialog.style['position'] = 'absolute';
    mDialog.style['top'] = '20px';
    container.appendChild(mDialog);
    let mContent = document.createElement('div');
    mDialog.appendChild(mContent);

    let mNewAssetButton = new ButtonInput(mContent)
        .setId("asset-add-button")
        .setLabel("Upload Assets [+]")
        .setOnClick(async () => {
            let files = await FileUtil.showFilePicker("audio/*,image/*,.glb,.glTF", true);
            await mAssetsUploadCallback(files);
        });

    let mAssetsContainer = document.createElement('div');
    mAssetsContainer.setAttribute('id', 'assets-container');
    mAssetsContainer.style['height'] = '400px';
    mAssetsContainer.style['overflow'] = 'scroll';
    mContent.appendChild(mAssetsContainer)

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

    async function show() {
        mDialog.show();
    }

    async function refreshList() {
        Util.setComponentListLength(mAssetList, mAssets.length, () => new LabeledImage(mAssetsContainer));
        for (let i = 0; i < mAssets.length; i++) {
            mAssetList[i].setId("asset-" + mAssets[i].id).setLabel(mAssets[i].name);
            if (mAssetUtil) {
                let thumbnail = await mAssetUtil.loadThumbnail(mAssets[i].id);
                if (thumbnail) mAssetList[i].setImage(thumbnail.src, true);
            }
        }
    }

    this.updateModel = updateModel;
    this.show = show;
    this.setAssetUtil = (util) => mAssetUtil = util;
    this.onAssetsUpload = (func) => mAssetsUploadCallback = func;
    this.onAssetsClear = (func) => mAssetsClearCallback = func;
}