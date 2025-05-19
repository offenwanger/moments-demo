import { InteractionType } from "../../../constants.js";
import { Util } from "../../../utils/utility.js";

function pointerMove(raycaster, orientation, isPrimary, interactionState, toolState, model, sessionController, sceneController, helperPointController) {
    if (interactionState.type == InteractionType.NONE) {
        let targets = [];
        if (isPrimary) {
            targets = sceneController.getTargets(raycaster, toolState)
            if (targets.length > 1) { console.error('Got more than one target! There should only be one photosphere to target!'); }
        } else {
            // do nothing.
        }
        Util.updateHoverTargetHighlight(targets[0], interactionState, toolState, isPrimary, sessionController, helperPointController);
    } else if (interactionState.type == InteractionType.BRUSHING) {
        let targets = sceneController.getTargets(raycaster, toolState);
        if (targets.length == 0) { /* we moved off the sphere, do nothing. */ } else {
            if (targets.length > 1) { console.error('Unexpected target result!'); }
            let target = targets[0];
            target.select(toolState);
            helperPointController.showPoint(isPrimary, target.getIntersection().point);
        }
    }
}

function pointerDown(raycaster, orientation, isPrimary, interactionState, toolState, model, sessionController, sceneController, helperPointController) {
    let hovered = isPrimary ? interactionState.primaryHovered : interactionState.secondaryHovered;
    if (hovered) {
        if (interactionState.type == InteractionType.NONE) {
            interactionState.type = InteractionType.BRUSHING;
            interactionState.data = { target: hovered };
        } else {
            console.error("TODO: Handle this edge case");
        }
    }
}

function pointerUp(raycaster, orientation, isPrimary, interactionState, toolState, model, sessionController, sceneController, helperPointController) {
    let type = interactionState.type;
    let data = interactionState.data;

    interactionState.type = InteractionType.NONE;
    interactionState.data = {};

    let reaction;

    helperPointController.hidePoint(isPrimary);

    if (type == InteractionType.BRUSHING) {
        let transaction = data.target.getTransaction(toolState);
        if (transaction) { reaction = transaction; };
    }

    return reaction;
}

export const BrushToolHandler = {
    pointerMove,
    pointerDown,
    pointerUp,
}