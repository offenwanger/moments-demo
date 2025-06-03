import * as THREE from 'three';
import { logInfo } from '../../../utils/log_util.js';
import { XRInputController } from './xr_input_controller.js';

export function XRSessionController() {
    let mOnSessionStartCallback = () => { }
    let mOnSessionEndCallback = () => { }

    let mUserMovedCallback = () => { }

    let mSession = null;
    let mSceneContainer = new THREE.Group();

    let mXRInputController = new XRInputController(mSceneContainer);


    let mXRCanvas = document.createElement('canvas');
    mXRCanvas.height = 100;
    mXRCanvas.width = 100;

    let mXRRenderer = new THREE.WebGLRenderer({ antialias: true, canvas: mXRCanvas });
    mXRRenderer.xr.enabled = true;
    function sessionStart(session) {

        mSession = session;
        setupListeners();
        mOnSessionStartCallback();

        mXRInputController.setSession(mSession);

        return mXRRenderer.xr.setSession(session);
    }
    mXRRenderer.xr.addEventListener('sessionend', () => {
        mSession = null;
        mOnSessionEndCallback();
    })
    // Dumb bug workaround, makes it more convinient to enter XR
    mXRCanvas.addEventListener("webglcontextlost", function (event) {
        logInfo("Terminating the failed session");
        mXRRenderer.xr.getSession().end();
    }, false);

    mXRInputController.setupControllers(mXRRenderer.xr);

    function setupListeners() {
        if (!mSession) return;

        mSession.addEventListener('selectstart', () => mXRInputController.pollInteractionState(mSession));
        mSession.addEventListener('selectend', () => mXRInputController.pollInteractionState(mSession));
        mSession.addEventListener('squeezestart', () => mXRInputController.pollInteractionState(mSession));
        mSession.addEventListener('squeezeend', () => mXRInputController.pollInteractionState(mSession));
    }

    let lastSend = Date.now();
    function render(time) {
        if (Date.now() - lastSend > 1000) {
            let pos = mXRInputController.getUserPosition();
            mUserMovedCallback(pos.head, pos.handR, pos.handL);
        }

        mXRInputController.pollInteractionState();
    }

    this.updateState = (interactionState) => { }
    this.sessionStart = sessionStart;
    this.onSessionEnd = (func) => mOnSessionEndCallback = func;
    this.onUserMoved = (func) => { mUserMovedCallback = func }
    this.onPointerMove = mXRInputController.onPointerMove
    this.onPointerDown = mXRInputController.onPointerDown;
    this.onPointerUp = mXRInputController.onPointerUp
    this.getObject = () => mSceneContainer;
    this.getRenderer = () => mXRRenderer;
    this.render = render;
    this.getCamera = mXRInputController.getCamera;
    this.setUserPositionAndDirection = mXRInputController.setUserPositionAndDirection;
    this.getUserPositionAndDirection = mXRInputController.getUserPositionAndDirection;
    this.getMenuContainer = mXRInputController.getMenuContainer;
}
