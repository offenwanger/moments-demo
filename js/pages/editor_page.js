
import * as THREE from 'three';
import { Data } from '../data.js';
import { AssetUtil } from '../utils/assets_util.js';
import { AudioRecorder } from '../utils/audio_recorder.js';
import { DataUtil } from '../utils/data_util.js';
import { FileUtil } from '../utils/file_util.js';
import { IdUtil } from '../utils/id_util.js';
import { Action, ActionType, Transaction } from '../utils/transaction_util.js';
import { UrlUtil } from '../utils/url_util.js';
import { Util } from '../utils/utility.js';
import { WindowEventManager } from '../window_event_manager.js';
import { RemoteWorkSpace } from '../workspace_manager.js';
import { ModelController } from './controllers/model_controller.js';
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
    mSceneInterface.onModelUpdate(transaction => {
        pushUndo(mModelController.getModel(), transaction)
        mModelController.applyTransaction(transaction);
        updateModel();
    });

    let mAssetList = new AssetList(parentContainer);
    mAssetList.onAssetsUpload((files) => {
        let chain = Promise.resolve();
        for (let file of files) {
            let id = IdUtil.getUniqueId(Data.Asset);
            let type;
            try {
                type = FileUtil.getTypeFromFile(file);;
            } catch (e) {
                console.error(e);
                continue;
            }

            let oldFilename = file.name;
            file.name = FileUtil.cleanFilename(file.name);

            if (!mWorkspace) {
                mWebsocketController.newAsset(id, file, type)
            } else {
                storeAsset(id, file, type)
            }

            chain = chain
                .then(() => FileUtil.getDataUriFromFile(file))
                .then(uri => mAssetUtil.cache(id, uri, type))
                .then(() => mAssetUtil.loadAsset(id, type))
                .then((asset) => {
                    if (!asset) { throw new Error('Asset loading failed after caching: ' + file.name) }
                    let actions = DataUtil.getAssetCreationActions(id, oldFilename, file.name, type, asset);
                    let transaction = new Transaction(actions);
                    if (transaction.actions) {
                        mModelController.applyTransaction(transaction);
                        updateModel();
                    }
                }).catch(e => {
                    console.error(e);
                    console.error('Asset upload failed for ' + file.name);
                });
        }

    })

    mAssetList.onAssetsClear(() => {
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
            mModelController.applyTransaction(transaction);
            updateModel();
        }
    });

    let mSidebarController = new SidebarController(mSidebarContainer);
    mSidebarController.onAddMoment(() => { createMoment(); })
    mSidebarController.setUpdateAttributeCallback((id, attrs) => {
        let transaction = new Transaction([new Action(ActionType.UPDATE, id, attrs)]);
        pushUndo(mModelController.getModel(), transaction)
        mModelController.applyTransaction(transaction);
        updateModel();
    })

    mSidebarController.setDeleteCallback((id) => {
        let actions = DataUtil.getRecursiveDelete(id, mModelController.getModel());
        let transaction = new Transaction(actions)
        pushUndo(mModelController.getModel(), transaction)
        mModelController.applyTransaction(transaction);
        updateModel();
    })

    mSidebarController.onNavigate(id => {
        if (IdUtil.getClass(id) == Data.Moment) {
            setCurrentMoment(id);
        } else if (IdUtil.getClass(id) == Data.StoryModel) {
            setCurrentMoment(null);
        }
    })
    mSidebarController.onSessionStart(session => {
        mSceneInterface.sessionStart(session);
    })
    mSidebarController.onStartShare(() => {
        if (!mWorkspace) { console.error("Invalid state, should not share unless running local worksapce."); }
        // upload asynconously
        mWebsocketController.shareStory(mModelController.getModel(), mWorkspace);
    })
    mSidebarController.onShowAssetManager(() => {
        mAssetList.show();
    })

    mWebsocketController.onStoryUpdate(transaction => {
        mModelController.removeUpdateListener(mWebsocketController.updateStory);
        mModelController.applyTransaction(transaction);
        mModelController.addUpdateListener(mWebsocketController.updateStory);
        updateModel();
    })

    mWebsocketController.onNewAsset((id, name, buffer, type) => {
        let file = new File([buffer], name);
        // store the asset, make a thumbnail
        return storeAsset(id, file, type)
    })

    mSceneInterface.onAssetCreate((id, name, filename, type, blob) => {
        let file = new File([blob], filename);

        if (!mWorkspace) {
            // launch asynconously
            // send the new file to the host. 
            mWebsocketController.newAsset(id, file, type);
        } else {
            // launch asynconously
            // store the file, handle thumbnails and sending to the server
            storeAsset(id, file, type)
        }

        let chain = FileUtil.getDataUriFromFile(file)
            .then(uri => mAssetUtil.cache(id, uri, type))
            .then(() => mAssetUtil.loadAsset(id, type))
            .then((asset) => {
                if (!asset) { throw new Error('Asset loading failed after caching: ' + file.name) }
                let actions = DataUtil.getAssetCreationActions(id, name, filename, type, asset);
                return mModelController.applyTransaction(new Transaction(actions));
            })
            .catch(e => {
                console.error(e);
                console.error('Asset creation failed.');
            });

        return chain;
    });

    function storeAsset(id, file, type) {
        let chain = mWorkspace.storeFile(file);

        // do thumbnail asynconously.
        chain
            .then(() => mAssetUtil.loadAssetFile(file.name, type))
            .then((asset) => {
                if (!asset) { throw new Error('Cannot load asset to make thumbnail.'); }
                return mAssetUtil.generateThumbnail(id, asset, type)
            })
            .then(thumbnailFilename => mWorkspace.isSharing ? mWebsocketController.uploadAsset(mModelController.getModel().id, thumbnailFilename, mWorkspace) : null)
            .catch(e => {
                console.error(e);
                console.error('Failed to create thumbnail.')
            })

        chain = chain
            .then(() => mWorkspace.isSharing ? mWebsocketController.uploadAsset(mModelController.getModel().id, file.name, mWorkspace) : null)

        return chain;
    }

    mSceneInterface.onTeleport((id) => {
        let isTeleport = IdUtil.getClass(id) == Data.Teleport;
        let teleport = mModelController.getModel().teleports.find(t => isTeleport ? t.id == id : t.attachedId == id);
        if (!teleport) { console.error('Invalid id: ' + id); }
        let pos = new THREE.Vector3(teleport.sceneX, teleport.sceneY, teleport.sceneZ)
        let direction = new THREE.Vector3(teleport.sceneDirX, teleport.sceneDirY, teleport.sceneDirZ);
        setCurrentMoment(teleport.destinationId, pos, direction);
        updateModel();
    });

    mSceneInterface.onCreateMoment(() => { createMoment(); });
    mSceneInterface.onUndo(undo);
    mSceneInterface.onRedo(redo);


    mSceneInterface.onSelect((id) => {
        mSidebarController.navigate(id);
    });

    mWebsocketController.onCreateMoment(() => { createMoment(); })

    function show(workspace = null) {
        mWorkspace = workspace;

        const storyId = UrlUtil.getParam('story');
        if (!storyId) { console.error("Story not set!"); return; }

        let chain = Promise.resolve();

        const remote = UrlUtil.getParam("remote") == 'true';
        if (remote) {
            mSidebarController.hideShare();
            mAssetUtil = new AssetUtil(new RemoteWorkSpace(storyId));

            chain = chain
                .then(() => new Promise((resolve, reject) => {
                    try {
                        mWebsocketController.onStoryConnect((story) => resolve(story))
                        mWebsocketController.connectToStory(storyId);
                    } catch (e) {
                        reject(e);
                    }
                }))
                .then(story => Data.StoryModel.fromObject(story))
                .then(model => mModelController = new ModelController(model))
                .catch(e => {
                    console.error(e);
                    console.error("Remote story init failed");
                })
        } else {
            mAssetUtil = new AssetUtil(mWorkspace);
            chain = chain
                .then(() => mWorkspace.getStory(storyId))
                .then(story => {
                    if (!story) throw Error("Invalid workspace!");

                    mModelController = new ModelController(story);
                    mModelController.addUpdateListener((transaction, model) => mWorkspace.updateStory(model));

                    if (story.moments.length == 0) { createMoment(); }
                })
                .catch(e => {
                    console.error(e);
                    console.error("Local story init failed");
                })
        }

        chain = chain
            .then(() => mAudioRecorder.init())
            .catch(e => {
                console.error(e)
                console.error('Audio init failed.');
            })
            .then(() => {
                mAssetList.setAssetUtil(mAssetUtil);
                mModelController.addUpdateListener(mWebsocketController.updateStory);
                resize(mWidth, mHeight);

                updateModel();

                const momentId = UrlUtil.getParam('moment')
                if (momentId) {
                    setCurrentMoment(momentId);
                } else {
                    setCurrentMoment(null);
                }
            });
        return chain;
    }

    function pushUndo(model, transaction) {
        if (transaction.actions.length == 0) { return; }

        mRedoStack = [];
        let inverse = transaction.invert(model);
        if (inverse.actions.length == 0) { console.error('Failed to get inverse for transaction: ' + JSON.stringify(transaction.actions)); return; }

        mUndoStack.push(inverse);
    }

    function undo() {
        if (mUndoStack.length == 0) return;
        let transaction = mUndoStack.pop()
        let inverse = transaction.invert(mModelController.getModel());
        mModelController.applyTransaction(transaction);
        mRedoStack.push(inverse);
        updateModel();
    }

    function redo() {
        if (mRedoStack.length == 0) return;
        let transaction = mRedoStack.pop()
        let inverse = transaction.invert(mModelController.getModel());
        mModelController.applyTransaction(transaction);
        mUndoStack.push(inverse);
        updateModel();
    }

    function updateModel() {
        try {
            let model = mModelController.getModel();
            mAssetUtil.updateModel(model);
            mAssetList.updateModel(model);

            mSidebarController.updateModel(model);
            mSceneInterface.updateModel(model, mAssetUtil);
        } catch (e) {
            console.error(e);
        }
    }

    function setCurrentMoment(momentId, position = new THREE.Vector3(), direction = new THREE.Vector3(0, 0, -1)) {
        if (!momentId) { UrlUtil.updateParams({ 'moment': null }); }

        let model = mModelController.getModel();
        let moment = model.find(momentId);
        if (moment) {
            UrlUtil.updateParams({ 'moment': momentId });
            mSidebarController.navigate(momentId);
        } else {
            UrlUtil.updateParams({ 'moment': null });
            mSidebarController.navigate(model.id);
        }
        mSceneInterface.setCurrentMoment(momentId, position, direction);
    }

    function createMoment() {
        let momentId = IdUtil.getUniqueId(Data.Moment);
        let name = DataUtil.getNextName('Moment', mModelController.getModel().moments.map(m => m.name));
        let transaction = new Transaction([
            new Action(ActionType.CREATE,
                momentId, { name }),
            new Action(ActionType.CREATE,
                IdUtil.getUniqueId(Data.Photosphere), { momentId })
        ]);
        pushUndo(mModelController.getModel(), transaction)
        mModelController.applyTransaction(transaction);
        updateModel();
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