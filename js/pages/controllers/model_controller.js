import { Data } from "../../data.js";
import { IdUtil } from "../../utils/id_util.js";
import { ActionType } from "../../utils/transaction_util.js";

export function ModelController(story = new Data.StoryModel()) {
    let mModel = story;
    let mModelIndex = story.getIndex();
    let mUpdateListeners = [];

    function applyTransaction(transaction) {
        for (let action of transaction.actions) {
            if (!action) { console.error('Invalid action, no data'); continue; }
            if (action.type == ActionType.DELETE) {
                mModel.delete(action.id);
                delete mModelIndex[action.id];
            } else if (action.type == ActionType.CREATE) {
                if (!action.id || !IdUtil.getClass(action.id)) { console.error('Invalid action, invalid id: ' + action.id); continue; }

                let item = mModelIndex[action.id];
                if (!item) {
                    let dataClass = IdUtil.getClass(action.id);
                    if (!dataClass) console.error("Invalid id: " + action.id);
                    _create(dataClass, action.id, action.params);
                } else {
                    console.error('Cannot apply create, item already exists: ' + action.id);
                }
            } else if (action.type == ActionType.UPDATE) {
                if (!action.id || !IdUtil.getClass(action.id)) { console.error('Invalid action, invalid id: ' + action.id); continue; }

                let item = mModelIndex[action.id];
                if (item) {
                    _update(action.id, action.params);
                } else {
                    console.error('Item does not exist, cannot update: ' + action.id);
                }
            } else {
                console.error("Invalid action: " + JSON.stringify(action));
            }
        }

        for (let callback of mUpdateListeners) callback(transaction, mModel);
    }

    function _create(dataClass, id, attrs) {
        let item = new dataClass();
        item.id = id;
        for (let key of Object.keys(attrs)) {
            if (!Object.hasOwn(item, key)) { console.error("Invalid attr: " + key); continue; }
            item[key] = attrs[key];
        }
        getTable(dataClass).push(item);
        mModelIndex[item.id] = item;
        return item.id;
    }

    function _update(id, attrs) {
        let item = mModelIndex[id];
        if (!item) { console.error("Invalid id: " + id); return; };
        for (let key of Object.keys(attrs)) {
            if (!Object.hasOwn(item, key)) { console.error("Invalid attr: " + id + " - " + key); return; }
            item[key] = attrs[key];
        }
    }

    function getTable(cls) {
        if (cls == Data.Asset) {
            return mModel.assets;
        } else if (cls == Data.AssetPose) {
            return mModel.assetPoses;
        } else if (cls == Data.Moment) {
            return mModel.moments;
        } else if (cls == Data.Photosphere) {
            return mModel.photospheres;
        } else if (cls == Data.PhotosphereSurface) {
            return mModel.surfaces;
        } else if (cls == Data.PhotosphereArea) {
            return mModel.areas;
        } else if (cls == Data.Stroke) {
            return mModel.strokes;
        } else if (cls == Data.PoseableAsset) {
            return mModel.poseableAssets;
        } else if (cls == Data.Picture) {
            return mModel.pictures;
        } else if (cls == Data.Audio) {
            return mModel.audios;
        } else if (cls == Data.Teleport) {
            return mModel.teleports;
        } else {
            console.error('No array for class: ' + cls);
            return [];
        }
    }

    return {
        applyTransaction,
        getModel: () => mModel.clone(),
        addUpdateListener: (callback) => mUpdateListeners.push(callback),
        removeUpdateListener: (callback) => mUpdateListeners = mUpdateListeners.filter(c => c != callback),
    }
}