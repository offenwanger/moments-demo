import * as THREE from 'three';
import { InteractionType, SurfaceToolButtons } from "../../../constants.js";
import { Util } from "../../../utils/utility.js";

// defines simplify2
import '../../../../lib/simplify2.js';
import { Action, ActionType, Transaction } from '../../../utils/transaction_util.js';

function pointerMove(raycaster, orientation, isPrimary, interactionState, toolMode, model, sessionController, sceneController, helperPointController) {

    if (isPrimary) {
        if (interactionState.type == InteractionType.NONE) {
            let targets = sceneController.getTargets(raycaster, toolMode)
            if (targets.length > 1) { console.error('Unexpected target result!'); }
            Util.updateHoverTargetHighlight(targets[0], interactionState, toolMode, isPrimary, sessionController, helperPointController);
        } else if (interactionState.type == InteractionType.BRUSHING) {
            let targets = sceneController.getTargets(raycaster, toolMode)
            if (targets.length == 0) { /* we moved off the sphere, do nothing. */ } else {
                if (targets.length > 1) { console.error('Unexpected target result!'); }
                let target = targets[0];
                target.select(toolMode);
                helperPointController.showPoint(isPrimary, target.getIntersection().point);
            }
        } else if (interactionState.type == InteractionType.ONE_HAND_MOVE && isPrimary) {
            // Move the moving thing. 
            let fromRay = interactionState.data.startRay;
            let fromOrientation = new THREE.Quaternion().copy(interactionState.data.startRayOrientation);
            let toRay = raycaster.ray;
            let toOrientation = orientation;

            let rotation = new THREE.Quaternion()
                .multiplyQuaternions(toOrientation, fromOrientation.invert());
            let newPosition = new THREE.Vector3().copy(interactionState.data.startPosition)
                .sub(fromRay.origin).applyQuaternion(rotation).add(toRay.origin);

            interactionState.data.rootTarget.setWorldPosition(newPosition);
        } else {
            console.error('invalid state:' + toolMode.tool + ", " + interactionState.type);
        }
    } else {
        // secondary controller does nothing.
    }
}

function pointerDown(raycaster, orientation, isPrimary, interactionState, toolMode, model, sessionController, sceneController, helperPointController) {
    let hovered = isPrimary ? interactionState.primaryHovered : interactionState.secondaryHovered;
    if (hovered) {
        if (interactionState.type == InteractionType.NONE) {
            if (toolMode.surfaceSettings.mode == SurfaceToolButtons.FLATTEN ||
                toolMode.surfaceSettings.mode == SurfaceToolButtons.RESET) {
                interactionState.type = InteractionType.BRUSHING;
                interactionState.data = { target: hovered };
            } else if (toolMode.surfaceSettings.mode == SurfaceToolButtons.PULL) {
                startOneHandMove(raycaster, orientation, hovered, interactionState);
            } else {
                console.error("Not handled:" + toolMode.surfaceSettings.mode);
            }
        } else {
            console.error("TODO: Handle this edge case");
        }
    }
}

function pointerUp(raycaster, orientation, isPrimary, interactionState, toolMode, model, sessionController, sceneController, helperPointController) {
    // secondary controller has no effect.
    let reaction;

    if (!isPrimary) return reaction;

    let type = interactionState.type;
    let data = interactionState.data;

    interactionState.type = InteractionType.NONE;
    interactionState.data = {};

    helperPointController.hidePoint();

    if (type == InteractionType.BRUSHING || type == InteractionType.ONE_HAND_MOVE) {
        // we are either flattening or resetting.
        let transaction = data.target.getTransaction(toolMode);
        if (transaction) reaction = transaction;
    } 

    return reaction;
}

function startOneHandMove(raycaster, orientation, target, interactionState) {
    interactionState.type = InteractionType.ONE_HAND_MOVE;
    let rootTarget = target.getRoot();
    interactionState.data = {
        target,
        rootTarget,
        startRay: new THREE.Ray().copy(raycaster.ray),
        startRayOrientation: new THREE.Quaternion().copy(orientation),
        startOrientation: rootTarget.getWorldOrientation(),
        startPosition: rootTarget.getWorldPosition(),
    }
}

export const SurfaceToolHandler = {
    pointerMove,
    pointerDown,
    pointerUp,
}