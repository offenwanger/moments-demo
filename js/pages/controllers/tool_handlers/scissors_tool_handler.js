import { CREATE_MODEL, InteractionType } from "../../../constants.js";
import { Data } from '../../../data.js';
import { IdUtil } from '../../../utils/id_util.js';
import { Action, ActionType, Transaction } from '../../../utils/transaction_util.js';
import { Util } from "../../../utils/utility.js";
import * as THREE from 'three'

// defines simplify2
import '../../../../lib/simplify2.js';

function pointerMove(raycaster, orientation, isPrimary, interactionState, toolState, model, sessionController, sceneController, helperPointController) {
    // secondary controller does nothing.
    if (!isPrimary) return;

    if (interactionState.type == InteractionType.NONE) {
        let targets = sceneController.getTargets(raycaster, toolState)
        if (targets.length > 1) { console.error('Unexpected target result!'); }
        Util.updateHoverTargetHighlight(targets[0], interactionState, toolState, isPrimary, sessionController, helperPointController);
    } else if (interactionState.type == InteractionType.BRUSHING) {
        let targets = sceneController.getTargets(raycaster, toolState)
        if (targets.length == 0) { /* we moved off the sphere, do nothing. */ } else {
            if (targets.length > 1) { console.error('Unexpected target result!'); }
            let target = targets[0];
            target.select(toolState);
            helperPointController.showPoint(isPrimary, target.getIntersection().point);
        }
    } else {
        console.error('invalid state:' + toolState.tool + ", " + interactionState.type);
    }
}

function pointerDown(raycaster, orientation, isPrimary, interactionState, toolState, model, sessionController, sceneController, helperPointController) {
    if (!isPrimary) return;
    let hovered = interactionState.primaryHovered;
    if (!hovered) return;
    if (interactionState.type != InteractionType.NONE) { console.error("TODO: Handle this edge case"); return; }

    interactionState.type = InteractionType.BRUSHING;
    interactionState.data = { target: hovered };
}

function pointerUp(raycaster, orientation, isPrimary, interactionState, toolState, model, sessionController, sceneController, helperPointController) {
    // secondary controller has no effect.
    let reaction;
    if (!isPrimary) return reaction;

    let type = interactionState.type;
    let data = interactionState.data;

    interactionState.type = InteractionType.NONE;
    interactionState.data = {};

    helperPointController.hidePoint();

    if (type == InteractionType.BRUSHING) {

        let assetId = IdUtil.getUniqueId(Data.Asset);
        let filename = assetId + '.glb';
        let assetName = 'Cutout ' + new Date().toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: '2-digit',
            minute: '2-digit',
        });

        let mesh = data.target.getTracedObject(toolState);
        if (!mesh) return null;
        mesh.name = 'cutout';

        let bb = new THREE.Box3().setFromObject(mesh);
        let center = new THREE.Vector3().addVectors(bb.min, bb.max).multiplyScalar(0.5);

        let position = mesh.geometry.getAttribute('position');
        let positionArray = position.array;
        let v = new THREE.Vector3()
        for (let i = 0; i < positionArray.length; i += 3) {
            v.set(positionArray[i], positionArray[i + 1], positionArray[i + 2]);
            v.sub(center)
            positionArray.set([v.x, v.y, v.z], i);
        }
        position.needsUpdate = true;
        mesh.updateMatrix();

        let photosphere = data.target ? model.photospheres.find(p => p.id == data.target.getId()) : null;

        let actions = [];

        let posableAssetId = IdUtil.getUniqueId(Data.PoseableAsset);
        actions.push(new Action(ActionType.CREATE,
            posableAssetId, {
            momentId: photosphere.momentId,
            assetId: assetId,
            name: assetName
        }));

        let offset = 0.01;
        actions.push(new Action(ActionType.CREATE,
            IdUtil.getUniqueId(Data.AssetPose), {
            parentId: posableAssetId,
            name: mesh.name,
            isRoot: true,
            x: center.x + (center.x > 0 ? -offset : offset),
            y: center.y + (center.y > 0 ? -offset : offset),
            z: center.z + (center.z > 0 ? -offset : offset),
            orientation: [0, 0, 0, 1],
            scale: 1,
        }));

        let transaction = new Transaction(actions);

        // TODO: Do something with the surface...
        // possible new black stroke
        // possible new flatten area

        // return the scene object, the new filename, and the transaction
        reaction = {
            type: CREATE_MODEL,
            transaction,
            assetId,
            assetName,
            filename,
            mesh,
        }
    }

    return reaction;
}

export const ScissorsToolHandler = {
    pointerMove,
    pointerDown,
    pointerUp,
}