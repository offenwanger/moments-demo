import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { UP, USER_HEIGHT } from "../../../constants.js";
import { CanvasUtil } from '../../../utils/canvas_util.js';
import { Util } from "../../../utils/utility.js";

export function XRInputController(sceneContainer) {
    let mPointerDownCallback = (raycaster, orietation, isPrimary) => { }
    let mPointerMoveCallback = (raycaster, orietation, isPrimary) => { }
    let mPointerUpCallback = (raycaster, orietation, isPrimary) => { }

    let mSession = null;
    let mMoved = false;
    let mButtonState = getButtonPressedState();

    const fov = 75, aspect = 2, near = 0.1, far = 200;
    const mXRCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    mXRCamera.position.set(0, USER_HEIGHT, 0);

    const mUserGroup = new THREE.Group()
    mUserGroup.add(mXRCamera)

    let mSceneContainer = sceneContainer;
    mSceneContainer.add(mUserGroup);

    const mRaycaster = new THREE.Raycaster();
    mRaycaster.camera = mXRCamera;

    let mLeftController = /*Dummy placeholder*/ new THREE.Object3D();
    let mRightController =/*Dummy placeholder*/  new THREE.Object3D();

    const mControllerRayMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        alphaMap: new THREE.CanvasTexture(CanvasUtil.generateWhiteGradient()),
        transparent: true
    });
    const mControllerRayGeometry = new THREE.BoxGeometry(0.004, 0.004, 0.35);
    mControllerRayGeometry.translate(0, 0, -0.15);
    mControllerRayGeometry.attributes.uv.set([1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]);
    const mLinesHelper = new THREE.Mesh(mControllerRayGeometry, mControllerRayMaterial);

    const mControllerOuterMaterial = new THREE.MeshBasicMaterial({
        opacity: 0.5,
        transparent: true
    });
    const mControllerInnerMaterial = new THREE.MeshBasicMaterial({
        opacity: 0.5,
        transparent: true,
        depthTest: false,
        depthWrite: false,
    });

    const mControllerRTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.01, 0.02, 3).rotateX(-Math.PI / 2),
        mControllerOuterMaterial);
    mControllerRTip.position.set(-0.005, 0, -0.03);
    const mControllerRInnerTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.007, 0.015, 3).rotateX(-Math.PI / 2),
        mControllerInnerMaterial);
    mControllerRInnerTip.position.set(-0.005, 0, -0.03);

    const mControllerLTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.01, 0.02, 3).rotateX(-Math.PI / 2), mControllerOuterMaterial);
    mControllerLTip.position.set(0.005, 0, -0.03);
    const mControllerLInnerTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.007, 0.015, 3).rotateX(-Math.PI / 2), mControllerInnerMaterial);
    mControllerLInnerTip.position.set(0.005, 0, -0.03);

    const mLeftMenuContainer = new THREE.Group();
    mLeftMenuContainer.scale.set(0.1, 0.1, 0.1)
    mLeftMenuContainer.position.set(-0.075, 0.12, -0.05);
    mLeftMenuContainer.rotateX(-Math.PI / 4);
    const mRightMenuContainer = mLeftMenuContainer.clone();


    function setupControllers(xr) {
        setupController(0, xr)
        setupController(1, xr);
    }

    function setupController(index, xr) {
        let controller = xr.getController(index);
        const ray = mLinesHelper.clone();

        controller.add(ray);
        controller.ray = ray;

        let grip = xr.getControllerGrip(index);

        controller.addEventListener('connected', function (event) {
            addTip(event.data.handedness == "left", controller);
            controller.userData.handedness = event.data.handedness;
            grip.add(new XRControllerModelFactory()
                .createControllerModel(grip));

            controller.add(event.data.handedness == "left" ?
                mLeftMenuContainer : mRightMenuContainer);
            if (event.data.handedness == "left") {
                mLeftController = controller;
            } else {
                mRightController = controller;
            }
        });
        controller.addEventListener('disconnected', function (event) {
            removeTip(controller.userData.handedness == "left", controller);
        });

        mUserGroup.add(controller);
        mUserGroup.add(grip);
    }

    function addTip(left, controller) {
        if (left) {
            controller.add(mControllerLTip);
            controller.add(mControllerLInnerTip);
        } else {
            controller.add(mControllerRTip);
            controller.add(mControllerRInnerTip);
        }
    }

    function removeTip(left, controller) {
        if (left) {
            controller.remove(mControllerLTip);
            controller.remove(mControllerLInnerTip);
        } else {
            controller.remove(mControllerRTip);
            controller.remove(mControllerRInnerTip);
        }
    }

    function pollInteractionState() {
        let axes = getRightGamePad();
        let lastButtonState = mButtonState;
        mButtonState = getButtonPressedState();

        if (!mMoved && Math.abs(axes[3]) > 0.5) {
            let dir = new THREE.Vector3();
            mXRCamera.getWorldDirection(dir);
            dir.y = 0;
            dir.normalize();
            let sign = -axes[3] / Math.abs(axes[3])

            moveUser(dir, 0.5 * sign)

            mMoved = true;
        } else if (!mMoved && Math.abs(axes[2]) > 0.5) {
            let cameraPos = new THREE.Vector3();
            mXRCamera.getWorldPosition(cameraPos);

            let sign = -axes[2] / Math.abs(axes[2])
            let angle = Math.PI / 4 * sign;
            let rotation = new THREE.Quaternion().setFromAxisAngle(UP, angle);
            let pos = Util.pivot(mUserGroup.position, cameraPos, rotation);

            mUserGroup.position.copy(pos);
            mUserGroup.applyQuaternion(rotation);

            mMoved = true;
        } else if (!mMoved && mButtonState.toggleRPressed) {
            let dir = new THREE.Vector3();
            mXRCamera.getWorldDirection(dir);
            let sign = dir.y / Math.abs(dir.y);

            moveUser(new THREE.Vector3(0, 1, 0), 0.5 * sign)

            mMoved = true;
        } else if (mMoved && axes.every(v => v == 0) && !mButtonState.toggleRPressed) {
            mMoved = false;
        }


        setRay(mRightController, mRaycaster);
        mPointerMoveCallback(mRaycaster, getRightControllerOrientation(), true);
        if (lastButtonState.primaryRPressed != mButtonState.primaryRPressed) {
            if (mButtonState.primaryRPressed) {
                mPointerDownCallback(mRaycaster, getRightControllerOrientation(), true);
            } else {
                mPointerUpCallback(mRaycaster, getRightControllerOrientation(), true);
            }
        }

        setRay(mLeftController, mRaycaster);
        mPointerMoveCallback(mRaycaster, getLeftControllerOrientation(), false);
        if (lastButtonState.primaryLPressed != mButtonState.primaryLPressed) {
            if (mButtonState.primaryLPressed) {
                mPointerDownCallback(mRaycaster, getLeftControllerOrientation(), false);
            } else {
                mPointerUpCallback(mRaycaster, getLeftControllerOrientation(), false);
            }
        }
    }

    function getButtonPressedState() {
        let primaryLPressed = false;
        let primaryRPressed = false;
        let gripLPressed = false;
        let gripRPressed = false;
        let toggleLPressed = false;
        let toggleRPressed = false;

        if (mSession && mSession.inputSources) {
            let leftController, rightController;
            for (let source of mSession.inputSources) {
                if (source.handedness == 'left') leftController = source;
                if (source.handedness == 'right') rightController = source;
            }

            if (leftController && leftController.gamepad) {
                // trigger button
                primaryLPressed = leftController.gamepad.buttons[0]
                    && leftController.gamepad.buttons[0].pressed;
                // grip button
                gripLPressed = leftController.gamepad.buttons[1]
                    && leftController.gamepad.buttons[1].pressed;
                // toggle button
                toggleLPressed = leftController.gamepad.buttons[3]
                    && leftController.gamepad.buttons[3].pressed;
            }

            if (rightController && rightController.gamepad) {
                // trigger button
                primaryRPressed = rightController.gamepad.buttons[0]
                    && rightController.gamepad.buttons[0].pressed;
                // grip button
                gripRPressed = rightController.gamepad.buttons[1]
                    && rightController.gamepad.buttons[1].pressed;
                // toggle button
                toggleRPressed = rightController.gamepad.buttons[3]
                    && rightController.gamepad.buttons[3].pressed;
            }
        }

        return {
            primaryLPressed,
            primaryRPressed,
            gripLPressed,
            gripRPressed,
            toggleLPressed,
            toggleRPressed,
        }
    }

    function moveUser(direction, distance) {
        let dir = new THREE.Vector3();
        dir.copy(direction).normalize()
        mUserGroup.position.addScaledVector(dir, distance);
    }

    function getHeadPosition() {
        let pos = new THREE.Vector3();
        mXRCamera.getWorldPosition(pos);
        return pos;
    }

    function getHeadDirection() {
        let pos = new THREE.Vector3();
        mXRCamera.getWorldDirection(pos);
        return pos;
    }

    function getHeadOrientation() {
        let rot = new THREE.Quaternion();
        mXRCamera.getWorldQuaternion(rot);
        return rot;
    }

    function getLeftControllerPosition() {
        let pos = new THREE.Vector3();
        mControllerLTip.getWorldPosition(pos);
        return pos;
    }

    function getLeftControllerOrientation() {
        let rot = new THREE.Quaternion();
        mControllerLTip.getWorldQuaternion(rot);
        return rot;
    }

    function getRightControllerPosition() {
        let pos = new THREE.Vector3();
        mControllerRTip.getWorldPosition(pos);
        return pos;
    }

    function getRightControllerOrientation() {
        let rot = new THREE.Quaternion();
        mControllerRTip.getWorldQuaternion(rot);
        return rot;
    }

    function getUserPosition() {
        let headPos = getHeadPosition();
        let handRPos = getRightControllerPosition();
        let handLPos = getLeftControllerPosition();
        return {
            head: {
                x: headPos.x,
                y: headPos.y,
                z: headPos.z,
                orientation: getHeadOrientation().toArray()
            },
            handR: {
                x: handRPos.x,
                y: handRPos.y,
                z: handRPos.z,
                orientation: getRightControllerOrientation().toArray()
            },
            handL: {
                x: handLPos.x,
                y: handLPos.y,
                z: handLPos.z,
                orientation: getLeftControllerOrientation().toArray()
            },
        }
    }

    function setUserPositionAndDirection(worldPosition, unitDirection) {
        mUserGroup.position.subVectors(worldPosition, mXRCamera.position);
        let dir = new THREE.Vector3();
        mXRCamera.getWorldDirection(dir);

        dir.y = 0;
        unitDirection.y = 0;

        let rotation = new THREE.Quaternion()
        rotation.setFromUnitVectors(dir, unitDirection)
        mUserGroup.applyQuaternion(rotation);
    }

    function getRightGamePad() {
        if (!mSession) return [0, 0, 0, 0];
        let rightController;
        // input sources is not an array, but is iterable
        for (let source of mSession.inputSources) {
            if (source.handedness == 'right') rightController = source;
        }
        if (!rightController || !rightController.gamepad ||
            !Array.isArray(rightController.gamepad.axes)) {
            return [0, 0, 0, 0];
        } else {
            return rightController.gamepad.axes
        }
    }

    const mDummyVector = new THREE.Vector3();
    function setRay(controller, raycaster) {
        controller.getWorldPosition(mDummyVector);
        raycaster.ray.origin.copy(mDummyVector);
        controller.getWorldDirection(mDummyVector)
        // I do not know why, but a held controller's world direction 
        // points backwards towards the user.
        mDummyVector.negate();
        raycaster.ray.direction.copy(mDummyVector);
    }

    function getMenuContainer() {
        // future proofing in case we want to add a hand switch option in future.
        if (true/** Right handed */) {
            return mLeftMenuContainer
        } else {
            return mRightMenuContainer
        };
    }

    this.getCamera = () => mXRCamera;
    this.getGroup = () => mUserGroup;
    this.getMenuContainer = getMenuContainer
    this.getPrimaryRPressed = () => mPrimaryRPressed;
    this.getUserPositionAndDirection = () => { return { pos: getHeadPosition(), dir: getHeadDirection() } };
    this.getHeadPosition = getHeadPosition;
    this.getHeadDirection = getHeadDirection;
    this.getHeadOrientation = getHeadOrientation;
    this.getLeftControllerPosition = getLeftControllerPosition;
    this.getLeftControllerOrientation = getLeftControllerOrientation;
    this.getRightControllerPosition = getRightControllerPosition;
    this.getRightControllerOrientation = getRightControllerOrientation;
    this.getUserPosition = getUserPosition;
    this.setSession = (session) => mSession = session;

    this.setupControllers = setupControllers;
    this.pollInteractionState = pollInteractionState;
    this.setUserPositionAndDirection = setUserPositionAndDirection;

    this.onPointerDown = (func) => { mPointerDownCallback = func }
    this.onPointerMove = (func) => { mPointerMoveCallback = func }
    this.onPointerUp = (func) => { mPointerUpCallback = func }
}