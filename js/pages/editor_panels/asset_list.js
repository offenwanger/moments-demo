import { FileUtil } from "../../utils/file_util.js";
import { logInfo } from "../../utils/log_util.js";
import { Util } from "../../utils/utility.js";
import { ButtonInput } from "../components/button_input.js";
import { LabeledImage } from "../components/labeled_image.js";

export function AssetList(container) {
    let mAssetsUploadCallback = (files) => { }
    let mAssetsClearCallback = () => { }

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
        .setOnClick(() => {
            FileUtil.showFilePicker("audio/*,image/*,.glb,.glTF", true)
                .then(files => {
                    logInfo('Recieved ' + files.length + ' files.');
                    return mAssetsUploadCallback(files)
                })
                .catch(e => { console.error(e); })
        });

    let mAssetsContainer = document.createElement('div');
    mAssetsContainer.setAttribute('id', 'assets-container');
    mAssetsContainer.style['height'] = '400px';
    mAssetsContainer.style['overflow'] = 'scroll';
    mContent.appendChild(mAssetsContainer)

    let mClearAssetsButton = new ButtonInput(mContent)
        .setId("dialog-clear-button")
        .setLabel("Clear Unused Assets")
        .setOnClick(() => mAssetsClearCallback());

    let mCloseButton = new ButtonInput(mContent)
        .setId("dialog-close-button")
        .setLabel("Close")
        .setOnClick(() => mDialog.close());

    window.addEventListener('pointerdown', (event) => {
        if (mDialog.open && !mDialog.contains(event.target)) {
            mDialog.close();
        }
    })

    function updateModel(model) {
        mAssets = model.assets;
        return refreshList();
    }

    function show() {
        mDialog.show();
    }

    function refreshList() {
        Util.setComponentListLength(mAssetList, mAssets.length, () => new LabeledImage(mAssetsContainer));

        let chain = Promise.resolve();
        mAssets.forEach((asset, i) => {
            mAssetList[i].setId("asset-" + mAssets[i].id).setLabel(mAssets[i].name);
            if (mAssetUtil) {
                chain = chain
                    .then(() => mAssetUtil.loadThumbnail(asset.id))
                    .then(thumbnail => {
                        if (thumbnail) mAssetList[i].setImage(thumbnail.src, true)
                    });
            }
        })
        return chain;
    }

    this.updateModel = updateModel;
    this.show = show;
    this.setAssetUtil = (util) => mAssetUtil = util;
    this.onAssetsUpload = (func) => mAssetsUploadCallback = func;
    this.onAssetsClear = (func) => mAssetsClearCallback = func;
}