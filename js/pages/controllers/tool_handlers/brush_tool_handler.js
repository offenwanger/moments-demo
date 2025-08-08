import { InteractionType } from "../../../constants.js";

function getTarget(raycaster, orientation, isPrimary, interactionState, toolState, model, sessionController, sceneController, helperPointController) {
    let targets = [];
    targets = sceneController.getTargets(raycaster, toolState)
    if (targets.length > 1) { console.error('Got more than one target! There should only be one photosphere to target!'); }
    if (targets.length == 0) return null;
    return targets[0];
}

function pointerMove(raycaster, orientation, isPrimary, interactionState, toolState, model, sessionController, sceneController, helperPointController) {
    // only main hand can brush.
    if (!isPrimary) return;

    if (interactionState.type == InteractionType.BRUSHING) {
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
    if (!isPrimary) return;

    let hovered = interactionState.primaryHovered;
    if (hovered) {
        if (interactionState.type == InteractionType.NONE) {
            interactionState.type = InteractionType.BRUSHING;
            interactionState.data = { target: hovered };
        } else {
            console.error("Unhandled edge case!");
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
    getTarget,
    pointerMove,
    pointerDown,
    pointerUp,
}