
import * as THREE from 'three';
import { AssetTypes } from '../constants.js';
import { Data } from '../data.js';
import { AssetUtil } from '../utils/assets_util.js';
import { AudioRecorder } from '../utils/audio_recorder.js';
import { DataUtil } from '../utils/data_util.js';
import { IdUtil } from '../utils/id_util.js';
import { Action, ActionType, Transaction } from '../utils/transaction_util.js';
import { UrlUtil } from '../utils/url_util.js';
import { Util } from '../utils/utility.js';
import { WindowEventManager } from '../window_event_manager.js';
import { RemoteWorkSpace } from '../workspace_manager.js';
import { ModelController } from './controllers/model_controller.js';
import { PictureEditorController } from './controllers/picture_editor_controller.js';
import { SceneInterfaceController } from './controllers/scene_interface_controller.js';
import { SidebarController } from './controllers/sidebar_controller.js';
import { AssetList } from './editor_panels/asset_list.js';

export function EditorPage(parentContainer, mWebsocketController) {
    const RESIZE_TARGET_SIZE = 20;
    let mModelController;
    let mWorkspace;
    let mAssetUtil;

    let mUndoStack = []
    let mRedoStack = []

    let mSidebarDivider = 0.8;
    let mBottomDivider = 0.8;
    let mWidth = 100;
    let mHeight = 100;

    let mResizingWindows = false;
    let mWindowEventManager = new WindowEventManager();
    let mAudioRecorder = new AudioRecorder();

    let mMainContainer = document.createElement('div');
    mMainContainer.setAttribute('id', 'story-display-main-container')
    mMainContainer.style['width'] = '100%';
    mMainContainer.style['height'] = '100%';
    mMainContainer.style['display'] = 'flex';
    mMainContainer.style['flex-direction'] = 'row';
    parentContainer.appendChild(mMainContainer);

    let mStoryDisplay = document.createElement('div');
    mStoryDisplay.setAttribute('id', 'story-display')
    mStoryDisplay.style['display'] = 'flex';
    mStoryDisplay.style['flex-direction'] = 'column';
    mMainContainer.appendChild(mStoryDisplay);

    let mViewContainer = document.createElement('div');
    mViewContainer.setAttribute('id', 'canvas-view-container')
    mViewContainer.style['display'] = 'block'
    mViewContainer.style['border'] = '1px solid black'
    mStoryDisplay.appendChild(mViewContainer);

    let mSidebarContainer = document.createElement('div');
    mSidebarContainer.setAttribute('id', 'sidebar')
    mSidebarContainer.style['height'] = '100%'
    mSidebarContainer.style['display'] = 'block'
    mSidebarContainer.style['border'] = '1px solid black'
    mSidebarContainer.style['overflow-y'] = 'scroll'
    mMainContainer.appendChild(mSidebarContainer);

    let mResizeTarget = document.createElement('img');
    mResizeTarget.setAttribute('id', 'resize-control')
    mResizeTarget.setAttribute('src', 'assets/images/panning_button.png')
    mResizeTarget.style['position'] = 'absolute'
    mResizeTarget.style['width'] = RESIZE_TARGET_SIZE + 'px'
    mResizeTarget.style['height'] = RESIZE_TARGET_SIZE + 'px'
    mResizeTarget.addEventListener('dragstart', (event) => event.preventDefault())
    mResizeTarget.addEventListener('pointerdown', () => { mResizingWindows = true; });
    parentContainer.appendChild(mResizeTarget);

    let mSceneInterface = new SceneInterfaceController(mViewContainer, mWebsocketController, mAudioRecorder);
    mSceneInterface.onModelUpdate(async (transaction) => {
        pushUndo(mModelController.getModel(), transaction)
        await mModelController.applyTransaction(transaction);
        await updateModel();
    });

    // Shares a container with the sessions
    let mPictureEditorController = new PictureEditorController(mViewContainer);
    mPictureEditorController.onSave(async (id, json, dataUrl) => {
        let transaction = new Transaction([new Action(ActionType.UPDATE, id, { json, image: dataUrl })])
        pushUndo(mModelController.getModel(), transaction)
        await mModelController.applyTransaction(transaction);
        await updateModel();
    })

    let mAssetList = new AssetList(parentContainer);
    mAssetList.onAssetsUpload(async (files) => {
        let transaction = new Transaction();
        for (let file of files) {
            try {
                let t = file.type.split('/')[0];
                let type;
                if (t == 'image') {
                    type = AssetTypes.IMAGE;
                } else if (t == 'audio') {
                    type = AssetTypes.AUDIO;
                } else {
                    let extension = file.name.split('.').pop();
                    if (extension == 'glb' || extension == 'gltf') {
                        type = AssetTypes.MODEL;
                    } else {
                        console.error('Unhandled file type: ' + file.type + " " + extension);
                        continue;
                    }
                }

                let id = IdUtil.getUniqueId(Data.Asset);
                if (!mWorkspace) {
                    await mWebsocketController.newAsset(id, file, type)
                } else {
                    let newFilename = await mWorkspace.storeFile(file);
                    let asset = await mAssetUtil.loadAssetFile(newFilename, type);
                    let thumbnailFilename = await mAssetUtil.generateThumbnail(id, asset, type);
                    transaction.actions.push(...(await DataUtil.getAssetCreationActions(
                        id, file.name, newFilename, type, asset)));

                    if (mWebsocketController.isSharing()) {
                        await mWebsocketController.uploadAsset(mModelController.getModel().id, newFilename, mWorkspace);
                        await mWebsocketController.uploadAsset(mModelController.getModel().id, thumbnailFilename, mWorkspace);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
        if (transaction.actions) {
            await mModelController.applyTransaction(transaction);
            await updateModel();
        }
    })
    mAssetList.onAssetsClear(async () => {
        let transaction = new Transaction();
        let model = mModelController.getModel()
        transaction.actions = model.assets.filter(a => {
            let linked = model.findAllLinked(a.id);
            // ignore asset poses linked to model assets.
            linked = linked.filter(l => !(l instanceof Data.AssetPose));
            if (linked.length > 0) {
                return false;
            } else return true;
        }).map(a => {
            // delete all asset poses that are linked to model assets to
            let linked = model.findAllLinked(a.id);
            return [new Action(ActionType.DELETE, a.id),
            ...linked.map(l => new Action(ActionType.DELETE, l.id))];
        }).flat();

        if (transaction.actions.length > 0) {
            pushUndo(mModelController.getModel(), transaction)
            await mModelController.applyTransaction(transaction);
            await updateModel();
        }
    });

    let mSidebarController = new SidebarController(mSidebarContainer);
    mSidebarController.onAddMoment(async () => {
        await createMoment();
    })
    mSidebarController.setUpdateAttributeCallback(async (id, attrs) => {
        let transaction = new Transaction([new Action(ActionType.UPDATE, id, attrs)]);
        pushUndo(mModelController.getModel(), transaction)
        await mModelController.applyTransaction(transaction);
        await updateModel();
    })
    mSidebarController.setDeleteCallback(async (id) => {
        let actions = DataUtil.getRecursiveDelete(id, mModelController.getModel());
        let transaction = new Transaction(actions)
        pushUndo(mModelController.getModel(), transaction)
        await mModelController.applyTransaction(transaction);
        await updateModel();
    })
    mSidebarController.setEditPictureCallback(async (id) => {
        let picture = mModelController.getModel().find(id);
        if (!picture) { console.error("Invalid id:" + id); return; }
        await mPictureEditorController.show(id, picture.json);
    })
    mSidebarController.setCloseEditPictureCallback(async () => {
        await mPictureEditorController.hide()
    })
    mSidebarController.onNavigate(async id => {
        if (IdUtil.getClass(id) == Data.Moment) {
            await setCurrentMoment(id);
        } else if (IdUtil.getClass(id) == Data.StoryModel) {
            await setCurrentMoment(null);
        }
    })
    mSidebarController.onSessionStart(async session => {
        await mSceneInterface.sessionStart(session);
    })
    mSidebarController.onStartShare(async () => {
        if (!mWorkspace) { console.error("Invalid state, should not share unless running local worksapce."); }
        await mWebsocketController.shareStory(mModelController.getModel(), mWorkspace);
    })
    mSidebarController.onShowAssetManager(async () => {
        await mAssetList.show();
    })

    mWebsocketController.onStoryUpdate(async transaction => {
        mModelController.removeUpdateListener(mWebsocketController.updateStory);
        await mModelController.applyTransaction(transaction);
        mModelController.addUpdateListener(mWebsocketController.updateStory);
        updateModel();
    })

    mWebsocketController.onNewAsset(async (id, name, buffer, type) => {
        let file = new File([buffer], name);
        let newFilename = await mWorkspace.storeFile(file);
        let asset = await mAssetUtil.loadAssetFile(newFilename, type);
        let thumbnailFilename = await mAssetUtil.generateThumbnail(id, asset, type);
        await mWebsocketController.uploadAsset(mModelController.getModel().id, newFilename, mWorkspace);
        await mWebsocketController.uploadAsset(mModelController.getModel().id, thumbnailFilename, mWorkspace);
        let actions = await DataUtil.getAssetCreationActions(id, file.name, newFilename, type, asset);
        await mModelController.applyTransaction(new Transaction(actions));
        updateModel();
    })

    mSceneInterface.onAssetCreate(async (id, name, filename, type, blob) => {
        let file = new File([blob], filename);
        if (!mWorkspace) {
            await mWebsocketController.newAsset(id, file, type)
        } else {
            let newFilename = await mWorkspace.storeFile(file);
            let asset = await mAssetUtil.loadAssetFile(newFilename, type);
            let thumbnailFilename = await mAssetUtil.generateThumbnail(id, asset, type);
            let actions = await DataUtil.getAssetCreationActions(id, name, newFilename, type, asset)

            if (mWebsocketController.isSharing()) {
                await mWebsocketController.uploadAsset(mModelController.getModel().id, newFilename, mWorkspace);
                await mWebsocketController.uploadAsset(mModelController.getModel().id, thumbnailFilename, mWorkspace);
            }

            await mModelController.applyTransaction(new Transaction(actions));
            updateModel();
        }
    });

    mSceneInterface.onTeleport(async (id) => {
        let isTeleport = IdUtil.getClass(id) == Data.Teleport;
        let teleport = mModelController.getModel().teleports.find(t => isTeleport ? t.id == id : t.attachedId == id);
        if (!teleport) { console.error('Invalid id: ' + id); }
        let pos = new THREE.Vector3(teleport.sceneX, teleport.sceneY, teleport.sceneZ)
        let direction = new THREE.Vector3(teleport.sceneDirX, teleport.sceneDirY, teleport.sceneDirZ);
        await setCurrentMoment(teleport.destinationId, pos, direction);
        updateModel();
    });

    mSceneInterface.onCreateMoment(async () => {
        await createMoment();
    });
    mSceneInterface.onUndo(undo);
    mSceneInterface.onRedo(redo);


    mSceneInterface.onSelect(async (id) => {
        mSidebarController.navigate(id);
    });

    mWebsocketController.onCreateMoment(async () => {
        await createMoment();
    })

    async function show(workspace = null) {
        mWorkspace = workspace;

        await mAudioRecorder.init();

        const storyId = UrlUtil.getParam('story');
        if (!storyId) { console.error("Story not set!"); return; }

        const remote = UrlUtil.getParam("remote") == 'true';

        if (remote) {
            mSidebarController.hideShare();
            let story = await new Promise((resolve, reject) => {
                mWebsocketController.connectToStory(storyId);
                mWebsocketController.onStoryConnect(async (story) => {
                    resolve(story);
                })
            })
            let model = Data.StoryModel.fromObject(story);

            mModelController = new ModelController(model);

            mAssetUtil = new AssetUtil(new RemoteWorkSpace(storyId));
        } else {
            let story = await mWorkspace.getStory(storyId);
            if (!story) throw Error("Invalid workspace!");

            mModelController = new ModelController(story);
            mModelController.addUpdateListener((transaction, model) => mWorkspace.updateStory(model));
            mAssetUtil = new AssetUtil(mWorkspace);

            if (story.moments.length == 0) {
                await createMoment();
            }
        }

        mAssetList.setAssetUtil(mAssetUtil);
        mModelController.addUpdateListener(mWebsocketController.updateStory);

        resize(mWidth, mHeight);

        await updateModel();

        const momentId = UrlUtil.getParam('moment')
        if (momentId) {
            await setCurrentMoment(momentId);
        } else {
            await setCurrentMoment(null);
        }
    }

    function pushUndo(model, transaction) {
        if (transaction.actions.length == 0) { return; }

        mRedoStack = [];
        let inverse = transaction.invert(model);
        if (inverse.actions.length == 0) { console.error('Failed to get inverse for transaction: ' + JSON.stringify(transaction.actions)); return; }

        mUndoStack.push(inverse);
    }

    async function undo() {
        if (mUndoStack.length == 0) return;
        let transaction = mUndoStack.pop()
        let inverse = transaction.invert(mModelController.getModel());
        mModelController.applyTransaction(transaction);
        mRedoStack.push(inverse);
        updateModel();
    }

    async function redo() {
        if (mRedoStack.length == 0) return;
        let transaction = mRedoStack.pop()
        let inverse = transaction.invert(mModelController.getModel());
        mModelController.applyTransaction(transaction);
        mUndoStack.push(inverse);
        updateModel();
    }

    async function updateModel() {
        try {
            let model = mModelController.getModel();
            await mAssetUtil.updateModel(model);
            await mAssetList.updateModel(model);

            await mSidebarController.updateModel(model);
            await mSceneInterface.updateModel(model, mAssetUtil);
        } catch (e) {
            console.error(e);
        }
    }

    async function setCurrentMoment(momentId, position = new THREE.Vector3(), direction = new THREE.Vector3(0, 0, -1)) {
        if (!momentId) { UrlUtil.updateParams({ 'moment': null }); }

        let model = mModelController.getModel();
        let moment = model.find(momentId);
        if (moment) {
            UrlUtil.updateParams({ 'moment': momentId });
            await mSidebarController.navigate(momentId);
        } else {
            UrlUtil.updateParams({ 'moment': null });
            await mSidebarController.navigate(model.id);
        }
        await mSceneInterface.setCurrentMoment(momentId, position, direction);
    }

    async function createMoment() {
        let momentId = IdUtil.getUniqueId(Data.Moment);
        let name = DataUtil.getNextName('Moment', mModelController.getModel().moments.map(m => m.name));
        let transaction = new Transaction([
            new Action(ActionType.CREATE,
                momentId, { name }),
            new Action(ActionType.CREATE,
                IdUtil.getUniqueId(Data.Photosphere), { momentId })
        ]);
        pushUndo(mModelController.getModel(), transaction)
        await mModelController.applyTransaction(transaction);
        await updateModel();
    }

    mWindowEventManager.onResize(resize);
    function resize(windowWidth, windowHeight) {
        mWidth = windowWidth;
        mHeight = windowHeight;

        mSidebarController.resize(mWidth - Math.round(mWidth * mSidebarDivider), mHeight);

        let viewCanvasWidth = Math.round(mWidth * mSidebarDivider)
        let viewCanvasHeight = Math.round(mHeight /* * mBottomDivider*/)

        mResizeTarget.style['left'] = (viewCanvasWidth - RESIZE_TARGET_SIZE / 2) + "px"
        mResizeTarget.style['top'] = (viewCanvasHeight - RESIZE_TARGET_SIZE / 2) + "px"

        mSceneInterface.resize(viewCanvasWidth, viewCanvasHeight);
        mPictureEditorController.resize(viewCanvasWidth, viewCanvasHeight);
    }

    mWindowEventManager.onPointerUp((screenCoords) => {
        if (mResizingWindows) {
            mSidebarDivider = Util.limit(screenCoords.x / mWidth, 0.01, 0.99);
            mBottomDivider = Util.limit(screenCoords.y / mHeight, 0.01, 0.99);
            resize(mWidth, mHeight);
        }
    });

    mWindowEventManager.onPointerUp(() => {
        mResizingWindows = false;
    });

    mWindowEventManager.onUndo(undo);
    mWindowEventManager.onRedo(redo);

    this.show = show;
}