import { CREATE_MODEL, InteractionType } from "../../../constants.js";
import { Data } from '../../../data.js';
import { IdUtil } from '../../../utils/id_util.js';
import { Transaction } from '../../../utils/transaction_util.js';
import { Util } from "../../../utils/utility.js";

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
        let transaction = new Transaction();

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

        // get the 3D and UV coords for two surfaces, the front and the flat back, and the current sphere texture
        // if no point is behind the flat part, flatten the sphere there
        // else, ditch the back of the model and make the front a two sided texture
        // Color the place it was cut out in black
        // create a new texture using the 2D bounding box
        // create a new scene object using the points
        // ensure the model has a name, needed for the AssetPose

        // translate the model to the center
        // create the model asset, create the asset pose, reverse the translate

        // create the transaction
        // new asset, 
        // new model3D
        // new asset pose
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