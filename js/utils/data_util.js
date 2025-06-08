import { AssetTypes } from '../constants.js';
import { Data } from '../data.js';
import { GLTKUtil } from './gltk_util.js';
import { IdUtil } from './id_util.js';
import { Action, ActionType } from './transaction_util.js';
import { Util } from './utility.js';

// This file contains helper functions for creating things
// which have to be created with many children. 
function getPoseableAssetCreationActions(model, parentId, assetId) {
    let actions = [];

    let asset = model.find(assetId);
    if (!asset) { console.error('invalid asset id', assetId); return []; }

    let posableAssetId = IdUtil.getUniqueId(Data.PoseableAsset);
    actions.push(new Action(ActionType.CREATE,
        posableAssetId, {
        momentId: parentId,
        assetId: assetId,
        name: asset.name
    }));

    let poses = model.assetPoses.filter(p => p.parentId == assetId);
    actions.push(...poses.map(pose => {
        let params = pose.clone(true);
        delete params.id;
        params.parentId = posableAssetId;
        return new Action(ActionType.CREATE,
            IdUtil.getUniqueId(Data.AssetPose),
            params)
    }))

    return actions;
}

function getAssetCreationActions(id, name, filename, type, asset = null) {
    let actions = [];
    actions.push(new Action(ActionType.CREATE,
        id, {
        name,
        filename,
        type
    }));

    if (type == AssetTypes.MODEL) {
        let targets = GLTKUtil.getInteractionTargetsFromGTLKScene(asset);

        if (Util.unique(targets.map(t => t.name)).length < targets.length) {
            console.error("Invalid asset, assets components must have unique names.");
            return null;
        }

        targets.forEach(child => {
            actions.push(new Action(ActionType.CREATE,
                IdUtil.getUniqueId(Data.AssetPose), {
                parentId: id,
                name: child.name,
                isRoot: child.isRoot,
                x: child.position.x,
                y: child.position.y,
                z: child.position.z,
                orientation: child.quaternion.toArray(),
                scale: child.scale.x,
            }));
        });
    }

    return actions;
}

function getPictureCreationActions(model, parentId, assetId, position, orientation) {
    let name = getNextName('Picture', model.pictures.map(m => m.name))
    return [
        new Action(ActionType.CREATE,
            IdUtil.getUniqueId(Data.Picture), {
            momentId: parentId,
            name,
            assetId,
            x: position.x, y: position.y, z: position.z,
            orientation: orientation.toArray(),
        }),
    ];
}

function getAudioCreationActions(model, parentId, assetId, position) {
    let name = getNextName('Audio', model.audios.map(m => m.name));
    return [
        new Action(ActionType.CREATE,
            IdUtil.getUniqueId(Data.Audio), {
            momentId: parentId,
            name,
            assetId,
            x: position.x, y: position.y, z: position.z,
        })
    ];
}

function getRecursiveDelete(id, model, actions = []) {
    actions.push(new Action(ActionType.DELETE, id))
    let itemClass = IdUtil.getClass(id);
    let linked = [];
    if (itemClass == Data.Moment) {
        linked = model.findAllLinked(id).filter(l =>
            l.momentId == id ||
            (l instanceof Data.Teleport && l.destinationId == id))
    } else if (itemClass == Data.Asset) {
        linked = model.findAllLinked(id).filter(l =>
            (l.assetId == id && !(l instanceof Data.Photosphere)) ||
            (l instanceof Data.AssetPose && l.parentId == id))
    } else if (itemClass == Data.PoseableAsset) {
        linked = model.findAllLinked(id).filter(l => (l instanceof Data.AssetPose && l.parentId == id))
    } else if (itemClass == Data.Photosphere) {
        linked = model.findAllLinked(id).filter(l => l.photosphereId == id);
    } else if (itemClass == Data.PhotosphereSurface) {
        linked = model.findAllLinked(id).filter(l => l.photosphereSurfaceId == id);
    }
    linked.forEach(l => {
        getRecursiveDelete(l.id, model, actions);
    })
    return actions;
}

function getNextName(name, nameList) {
    let maxNumber = Math.max(0, ...nameList
        .filter(n => n.includes(name))
        .map(n => parseInt(n.split(name)[1]))
        .filter(n => !isNaN(n)));
    return name + (maxNumber + 1)
}

export const DataUtil = {
    getPoseableAssetCreationActions,
    getAssetCreationActions,
    getPictureCreationActions,
    getAudioCreationActions,
    getRecursiveDelete,
    getNextName,
}