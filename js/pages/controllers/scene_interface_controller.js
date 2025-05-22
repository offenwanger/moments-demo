import * as THREE from "three";
import { AssetTypes, AttributeButtons, BrushToolButtons, BrushToolSettings, InteractionType, ItemButtons, MenuNavButtons, RecordToolButtons, SurfaceToolButtons, TELEPORT_COMMAND, ToolButtons } from "../../constants.js";
import { Data } from "../../data.js";
import { ColorUtil } from "../../utils/color_util.js";
import { DataUtil } from "../../utils/data_util.js";
import { IdUtil } from "../../utils/id_util.js";
import { Action, ActionType, Transaction } from "../../utils/transaction_util.js";
import { Util } from "../../utils/utility.js";
import { HelperPointController } from "./helper_point_controller.js";
import { MenuController } from "./menu_controllers/menu_controller.js";
import { PageSessionController } from './page_session_controller.js';
import { SceneController } from "./scene_controller.js";
import { ToolState } from "./system_state.js";
import { BrushToolHandler } from "./tool_handlers/brush_tool_handler.js";
import { MoveToolHandler } from "./tool_handlers/move_tool_handler.js";
import { SurfaceToolHandler } from "./tool_handlers/surface_tool_handler.js";
import { XRSessionController } from './xr_controllers/xr_session_controller.js';

/**
 * Handles the display of the story, including the event handling and 
 * transitions between VR and canvas viewing. 
 * @param {*} parentContainer 
 */
export function SceneInterfaceController(parentContainer, mWebsocketController, mAudioRecorder) {
    let mModelUpdateCallback = async () => { }
    let mAssetCreateCallback = async () => { }
    let mTeleportCallback = async () => { }
    let mCreateMomentCallback = async () => { }
    let mUndoCallback = async () => { }
    let mRedoCallback = async () => { }
    let mSelectCallback = async () => { }

    let isVR = false;

    let mInteractionState = {
        type: InteractionType.NONE,
        data: {},
        primaryHovered: null,
        secondaryHovered: null,
    }

    let mModel = new Data.StoryModel();
    let mToolState = new ToolState();
    let mCurrentMomentId = null;

    const mAudioListener = new THREE.AudioListener();

    let mSceneController = new SceneController(mAudioListener);
    let mMenuController = new MenuController();
    mMenuController.setToolState(mToolState);
    let mOtherUsers = {};

    let mXRSessionController = new XRSessionController();
    let mPageSessionController = new PageSessionController(parentContainer);
    let mCurrentSessionController = mPageSessionController;

    let mHelperPointController = new HelperPointController(mSceneController.getScene());

    const CHUNK_CHARACTERS = ['.', '-', 'o', '|', 'O']
    let mChunkString = '';
    mAudioRecorder.onChunk(chunk => {
        if (!mAudioRecorder.isRecording()) return;
        mChunkString += CHUNK_CHARACTERS[Math.round(Math.random() * (CHUNK_CHARACTERS.length - 1))]
        mChunkString = '\n' + mChunkString.slice(-7).trim();
        mMenuController.getAudioDisplay().setText("Recording" + mChunkString);
    })

    async function setCurrentSession(controller) {
        let scene = mSceneController.getScene();

        scene.remove(mCurrentSessionController.getObject());
        mCurrentSessionController.getRenderer().setAnimationLoop(null);
        let { pos, dir } = mCurrentSessionController.getUserPositionAndDirection();

        scene.add(controller.getObject());
        mMenuController.setContainer(controller.getMenuContainer())
        controller.getRenderer().setAnimationLoop(render);
        controller.setUserPositionAndDirection(pos, dir);
        mCurrentSessionController = controller;

        mCurrentSessionController.getCamera().add(mAudioListener);
    }

    async function render(time) {
        if (time < 0) return;

        mCurrentSessionController.getRenderer().render(
            mSceneController.getScene(),
            mCurrentSessionController.getCamera());

        await mCurrentSessionController.render();
        mMenuController.render();
    }

    async function sessionStart(session) {
        await mXRSessionController.sessionStart(session);
        isVR = true;
        setCurrentSession(mXRSessionController);
    }

    mXRSessionController.onSessionEnd(() => {
        if (isVR) {
            isVR = false;
            setCurrentSession(mPageSessionController);
        }
    })

    mWebsocketController.onParticipantUpdate((id, head, handR, handL, momentId) => {
        try {
            if (mOtherUsers[id]) {
                if (head) {
                    mSceneController.updateOtherUser(id, head, handR, handL, momentId);
                } else {
                    mSceneController.removeOtherUser(id);
                }
            } else {
                if (head) {
                    mSceneController.addOtherUser(id, head, handR, handL, momentId);
                    mOtherUsers[id] = true;
                }
            }
        } catch (error) {
            console.error(error);
        }
    })

    mXRSessionController.onUserMoved((head, handR, handL) => {
        mWebsocketController.updateParticipant(head, handR, handL, mCurrentMomentId);
    })
    mPageSessionController.onUserMoved((head) => {
        mWebsocketController.updateParticipant(head, null, null, mCurrentMomentId);
    })

    mPageSessionController.onPointerMove(onPointerMove);
    mXRSessionController.onPointerMove(onPointerMove);
    async function onPointerMove(raycaster = null, orientation = null, isPrimary = true) {
        // unhighlight buttons. 
        let hovered = (isPrimary ? mInteractionState.primaryHovered : mInteractionState.secondaryHovered)
        if (hovered && hovered.isButton()) {
            Util.updateHoverTargetHighlight(
                null,
                mInteractionState,
                mToolState,
                isPrimary,
                mCurrentSessionController,
                mHelperPointController)
        }

        let menuTargets = mInteractionState.type == InteractionType.NONE ?
            mMenuController.getTargets(raycaster, mToolState) : [];
        if (menuTargets.length > 0) {
            let closest = Util.getClosestTarget(raycaster.ray, menuTargets);
            Util.updateHoverTargetHighlight(
                closest,
                mInteractionState,
                mToolState,
                isPrimary,
                mCurrentSessionController,
                mHelperPointController);
        } else {
            let handler = getToolHandler(mToolState.tool)
            if (!handler) { console.error("Tool not handled: " + mToolState.tool); return; }
            handler.pointerMove(
                raycaster,
                orientation,
                isPrimary,
                mInteractionState,
                mToolState,
                mModel,
                mCurrentSessionController,
                mSceneController,
                mHelperPointController)
        }

    }

    mPageSessionController.onPointerDown(onPointerDown);
    mXRSessionController.onPointerDown(onPointerDown);
    async function onPointerDown(raycaster, orientation = null, isPrimary = true) {
        let hovered = isPrimary ? mInteractionState.primaryHovered : mInteractionState.secondaryHovered;
        if (!hovered) {
            // nothing to do. 
            return;
        } else if (hovered.isButton()) {
            await menuButtonClicked(hovered);
        } else {
            let handler = getToolHandler(mToolState.tool)
            if (!handler) { console.error("Tool not handled: " + mToolState.tool); return; }
            let selectedTargetId = await handler.pointerDown(
                raycaster,
                orientation,
                isPrimary,
                mInteractionState,
                mToolState,
                mModel,
                mCurrentSessionController,
                mSceneController,
                mHelperPointController);
            if (selectedTargetId) await mSelectCallback(selectedTargetId);
        }
    }

    mPageSessionController.onPointerUp(onPointerUp);
    mXRSessionController.onPointerUp(onPointerUp);
    async function onPointerUp(raycaster, orientation = null, isPrimary = true) {
        let handler = getToolHandler(mToolState.tool)
        if (!handler) { console.error("Tool not handled: " + mToolState.tool); return; }
        let reaction = handler.pointerUp(
            raycaster,
            orientation,
            isPrimary,
            mInteractionState,
            mToolState,
            mModel,
            mCurrentSessionController,
            mSceneController,
            mHelperPointController);


        if (!reaction) {
            // no reaction, do nothing.
        } else if (reaction instanceof Transaction) {
            await mModelUpdateCallback(reaction);
        } else if (reaction.type == TELEPORT_COMMAND) {
            await mTeleportCallback(reaction.id);
        } else {
            console.error('Invalid reaction', reaction);
        }
    }

    async function menuButtonClicked(target) {
        target.select(mToolState);
        let buttonId = target.getId();
        let menuId = mMenuController.getCurrentMenuId();
        if (Object.values(ToolButtons).includes(buttonId)) {
            // unhighlight evertying. 
            if (mInteractionState.primaryHovered) mInteractionState.primaryHovered.idle(mToolState);
            mInteractionState.primaryHovered = null;
            mHelperPointController.hidePoint(true);
            if (mInteractionState.secondaryHovered) mInteractionState.secondaryHovered.idle(mToolState);
            mInteractionState.secondaryHovered = null;
            mHelperPointController.hidePoint(false);

            if (mToolState.tool == buttonId && buttonId != ToolButtons.MOVE) {
                buttonId = ToolButtons.MOVE;
            }
            mToolState.tool = buttonId;
            mMenuController.setToolState(mToolState);
        } else if (Object.values(BrushToolButtons).includes(buttonId)) {
            mToolState.brushSettings.mode = buttonId;
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.BIGGER && mToolState.brushSettings.mode == BrushToolButtons.CLEAR) {
            mToolState.brushSettings.clearWidth = Math.min(0.5, mToolState.brushSettings.clearWidth * 1.1);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.SMALLER && mToolState.brushSettings.mode == BrushToolButtons.CLEAR) {
            mToolState.brushSettings.clearWidth = Math.max(0.005, mToolState.brushSettings.clearWidth * 0.9);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.BIGGER && mToolState.brushSettings.mode == BrushToolButtons.UNBLUR) {
            mToolState.brushSettings.unblurWidth = Math.min(0.5, mToolState.brushSettings.unblurWidth * 1.1);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.SMALLER && mToolState.brushSettings.mode == BrushToolButtons.UNBLUR) {
            mToolState.brushSettings.unblurWidth = Math.max(0.005, mToolState.brushSettings.unblurWidth * 0.9);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.BIGGER && mToolState.brushSettings.mode == BrushToolButtons.COLOR) {
            mToolState.brushSettings.colorWidth = Math.min(0.5, mToolState.brushSettings.colorWidth * 1.1);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.SMALLER && mToolState.brushSettings.mode == BrushToolButtons.COLOR) {
            mToolState.brushSettings.colorWidth = Math.max(0.005, mToolState.brushSettings.colorWidth * 0.9);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.HUE_INC) {
            mToolState.brushSettings.color = ColorUtil.hueIncrement(mToolState.brushSettings.color, 10);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.LIGHT_INC) {
            mToolState.brushSettings.color = ColorUtil.lightIncrement(mToolState.brushSettings.color, 10);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.SAT_INC) {
            mToolState.brushSettings.color = ColorUtil.satIncrement(mToolState.brushSettings.color, 5);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.HUE_DEC) {
            mToolState.brushSettings.color = ColorUtil.hueDecrement(mToolState.brushSettings.color, 5);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.LIGHT_DEC) {
            mToolState.brushSettings.color = ColorUtil.lightDecrement(mToolState.brushSettings.color, 5);
            mMenuController.setToolState(mToolState);
        } else if (buttonId == BrushToolSettings.SAT_DEC) {
            mToolState.brushSettings.color = ColorUtil.satDecrement(mToolState.brushSettings.color, 5);
            mMenuController.setToolState(mToolState);
        } else if (Object.values(SurfaceToolButtons).includes(buttonId)) {
            mToolState.surfaceSettings.mode = buttonId;
            mMenuController.setToolState(mToolState);
        } else if (Object.values(MenuNavButtons).includes(buttonId)) {
            mMenuController.showMenu(buttonId);
        } else if (buttonId == ItemButtons.NEW_MOMENT) {
            await mCreateMomentCallback()
        } else if (buttonId == ItemButtons.RECENTER) {
            mCurrentSessionController.setUserPositionAndDirection(
                new THREE.Vector3(),
                new THREE.Vector3(0, 0, -1));
        } else if (buttonId == ItemButtons.UNDO) {
            await mUndoCallback()
        } else if (buttonId == ItemButtons.REDO) {
            await mRedoCallback()
        } else if (Object.values(ItemButtons).includes(buttonId)) {
            console.error("Impliment me!")
        } else if (buttonId == AttributeButtons.SPHERE_SCALE_UP) {
            let moment = mModel.moments.find(m => m.id == mCurrentMomentId);
            if (!moment) { console.error("invalid moment id: " + mCurrentMomentId); return; }
            let photosphere = mModel.photospheres.find(p => p.momentId == moment.id);
            if (!photosphere) { console.error("invalid moment, no photosphere: " + moment.id); return; }
            await mModelUpdateCallback(new Transaction([new Action(ActionType.UPDATE,
                photosphere.id, {
                scale: Math.min(photosphere.scale + 0.1, 5),
            })]));
        } else if (buttonId == AttributeButtons.SPHERE_SCALE_DOWN) {
            let moment = mModel.moments.find(m => m.id == mCurrentMomentId);
            if (!moment) { console.error("invalid moment id: " + mCurrentMomentId); return; }
            let photosphere = mModel.photospheres.find(p => p.momentId == moment.id);
            if (!photosphere) { console.error("invalid moment id, no photosphere: " + moment.id); return; }
            await mModelUpdateCallback(new Transaction([new Action(ActionType.UPDATE,
                photosphere.id, {
                scale: Math.max(photosphere.scale - 0.1, 0.5),
            })]));
        } else if (buttonId == RecordToolButtons.DISPLAY) {
            // not actually a button do nothing
        } else if (buttonId == RecordToolButtons.RECORD) {
            // if we are playing do nothing
            if (mAudioRecorder.isPlaying()) return;
            if (mAudioRecorder.isRecording()) {
                mAudioRecorder.stopRecording();
                mMenuController.getAudioDisplay().setText('Paused' + mChunkString);
            } else {
                mAudioRecorder.startRecording();
                mMenuController.getAudioDisplay().setText('Recording' + mChunkString);
            }
        } else if (buttonId == RecordToolButtons.PLAYPAUSE) {
            if (mAudioRecorder.isRecording()) return;
            if (mAudioRecorder.isPlaying()) {
                mAudioRecorder.stopAudioFile();
                mMenuController.getAudioDisplay().setText('Paused' + mChunkString);
            } else {
                mAudioRecorder.playAudioFile();
                mMenuController.getAudioDisplay().setText('Playing' + mChunkString);
            }
        } else if (buttonId == RecordToolButtons.ACCEPT) {
            if (mCurrentMomentId && mAudioRecorder.hasContent()) {
                let point = target.getIntersection().point;
                let audioBlob = mAudioRecorder.getAudioBlob();
                mAudioRecorder.clearRecorder();
                mMenuController.getAudioDisplay().setText('Ready to Record');
                let assetId = IdUtil.getUniqueId(Data.Asset);
                let filename = assetId + mAudioRecorder.getExtension();
                let recordingName = 'Recorded ' + new Date().toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: '2-digit',
                    minute: '2-digit',
                });

                await mAssetCreateCallback(assetId, recordingName, filename, AssetTypes.AUDIO, audioBlob);

                let actions = DataUtil.getAudioCreationActions(mModel, mCurrentMomentId, assetId, point);
                await mModelUpdateCallback(new Transaction(actions));
            }
        } else if (buttonId == RecordToolButtons.DELETE) {
            mAudioRecorder.clearRecorder();
            mChunkString = '';
            mMenuController.getAudioDisplay().setText('Ready to Record');
        } else if (buttonId == AttributeButtons.SPHERE_TOGGLE) {
            let moment = mModel.moments.find(m => m.id == mCurrentMomentId);
            if (!moment) { console.error("invalid moment id: " + mCurrentMomentId); return; }
            let photosphere = mModel.photospheres.find(p => p.momentId == moment.id);
            if (!photosphere) { console.error("invalid moment id, no photosphere: " + moment.id); return; }
            await mModelUpdateCallback(new Transaction([new Action(ActionType.UPDATE,
                photosphere.id, {
                enabled: !photosphere.enabled
            })]));
        } else if (buttonId == AttributeButtons.SPHERE_BLUR_TOGGLE) {
            let moment = mModel.moments.find(m => m.id == mCurrentMomentId);
            if (!moment) { console.error("invalid moment id: " + mCurrentMomentId); return; }
            let photosphere = mModel.photospheres.find(p => p.momentId == moment.id);
            if (!photosphere) { console.error("invalid moment id, no photosphere: " + moment.id); return; }
            await mModelUpdateCallback(new Transaction([new Action(ActionType.UPDATE,
                photosphere.id, {
                blur: !photosphere.blur
            })]));
        } else if (IdUtil.getClass(buttonId) == Data.Asset) {
            let photosphere = mModel.photospheres.find(p => p.momentId == mCurrentMomentId);
            if (!photosphere) { console.error("invalid moment, no photosphere: " + mCurrentMomentId); return; }
            let point = target.getIntersection().point;

            if (menuId == MenuNavButtons.SPHERE_IMAGE) {
                await mModelUpdateCallback(new Transaction([new Action(ActionType.UPDATE,
                    photosphere.id, {
                    assetId: buttonId
                })]));
            } else if (menuId == MenuNavButtons.ADD_MODEL) {
                let assetId = buttonId;
                let actions = await DataUtil.getPoseableAssetCreationActions(mModel, mCurrentMomentId, assetId);
                await mModelUpdateCallback(new Transaction(actions));
            } else if (menuId == MenuNavButtons.ADD_PICTURE) {
                let assetId = buttonId;
                let actions = await DataUtil.getPictureCreationActions(
                    mModel, mCurrentMomentId, assetId,
                    point, new THREE.Quaternion());
                await mModelUpdateCallback(new Transaction(actions));
            } else if (menuId == MenuNavButtons.ADD_AUDIO) {
                let assetId = buttonId;
                let actions = await DataUtil.getAudioCreationActions(
                    mModel, mCurrentMomentId, assetId, point);
                await mModelUpdateCallback(new Transaction(actions));
            } else {
                console.error("not implimented!!");
            }
        } else if (IdUtil.getClass(buttonId) == Data.Moment) {
            if (menuId == MenuNavButtons.ADD_TELEPORT) {
                let parentMoment = mModel.moments.find(m => m.id == mCurrentMomentId);
                if (!parentMoment) { console.error("invalid moment id: " + mCurrentMomentId); return; }
                let point = target.getIntersection().point;
                let targetMoment = buttonId;
                await mModelUpdateCallback(new Transaction([
                    new Action(ActionType.CREATE,
                        IdUtil.getUniqueId(Data.Teleport), {
                        momentId: parentMoment.id,
                        destinationId: targetMoment,
                        x: point.x, y: point.y, z: point.z,
                    })
                ]));
            } else {
                console.error("not implimented!!");
            }
        } else {
            console.error('Invalid button id: ' + buttonId);
        }
    }

    function getToolHandler(tool) {
        if (tool == ToolButtons.MOVE || tool == ToolButtons.RECORD) {
            return MoveToolHandler;
        } else if (tool == ToolButtons.BRUSH) {
            return BrushToolHandler;
        } else if (tool == ToolButtons.SURFACE) {
            return SurfaceToolHandler;
        } else {
            console.error('Tool not handled.')
        }
    }

    async function updateModel(model, assetUtil) {
        // clear the highlighting / hovering.
        Util.updateHoverTargetHighlight(
            null,
            mInteractionState,
            mToolState,
            true,
            mCurrentSessionController,
            mHelperPointController)
        Util.updateHoverTargetHighlight(
            null,
            mInteractionState,
            mToolState,
            false,
            mCurrentSessionController,
            mHelperPointController)

        if (mModel.id != model.id) {
            let dir = new THREE.Vector3(0, 0, -1);
            let pos = new THREE.Vector3(0, 0, 0);
            if (isVR) mXRSessionController.setUserPositionAndDirection(pos, dir)
            else mPageSessionController.setUserPositionAndDirection(pos, dir)
        }

        mModel = model;
        await mSceneController.updateModel(model, assetUtil);
        await mMenuController.updateModel(model, assetUtil);
    }

    function resize(width, height) {
        mPageSessionController.resize(width, height);
    }

    async function setCurrentMoment(momentId, position, direction) {
        await mSceneController.setCurrentMoment(momentId);
        mCurrentSessionController.setUserPositionAndDirection(position, direction);
        mCurrentMomentId = momentId;
    }

    setCurrentSession(mPageSessionController);

    this.updateModel = updateModel;
    this.resize = resize;
    this.setCurrentMoment = setCurrentMoment;
    this.sessionStart = sessionStart;
    this.onModelUpdate = (func) => mModelUpdateCallback = func;
    this.onAssetCreate = (func) => mAssetCreateCallback = func;
    this.onTeleport = (func) => mTeleportCallback = func;
    this.onCreateMoment = (func) => mCreateMomentCallback = func;
    this.onUndo = (func) => mUndoCallback = func;
    this.onRedo = (func) => mRedoCallback = func;
    this.onSelect = (func) => mSelectCallback = func;
}

