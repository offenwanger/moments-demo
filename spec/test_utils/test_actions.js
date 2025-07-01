
import * as THREE from 'three';
import { AssetTypes, MenuNavButtons, RecordToolButtons, ToolButtons } from '../../js/constants.js';
import { Data } from '../../js/data.js';
import { loadRealFile, mockFile, mockFileSystemDirectoryHandle } from './mock_filesystem.js';
import { forceIntercept } from './mock_three.js';

export function testmodel() {
    let storyFile = Object.keys(global.fileSystem).find(k => k.startsWith('test/StoryModel_'))
    return Data.StoryModel.fromObject(JSON.parse(global.fileSystem[storyFile]))
}

export function canvaspointerdown(x, y) {
    document.querySelector("#main-canvas").eventListeners.pointerdown({
        clientX: x,
        clientY: y
    });
}

export function pointermove(x, y) {
    if (!window.callbacks.pointermove) console.error("No callbacks registered for pointermove");
    for (let cb of window.callbacks.pointermove)
        cb({ clientX: x, clientY: y });

    global.test_rendererAccess.animationLoop();
}

export function pointerup(x, y) {
    if (!window.callbacks.pointerup) console.error("No callbacks registered for pointerup");
    for (let cb of window.callbacks.pointerup)
        cb({ clientX: x, clientY: y });

    global.test_rendererAccess.animationLoop();
}

export function ctrlZ() {
    if (!window.callbacks.keydown) console.error("No callbacks registered for keydown");
    for (let cb of window.callbacks.keydown)
        cb({ ctrlKey: true, key: 'z' });

    global.test_rendererAccess.animationLoop();
}

export function ctrlY() {
    if (!window.callbacks.pointerup) console.error("No callbacks registered for keydown");
    for (let cb of window.callbacks.keydown)
        cb({ ctrlKey: true, key: 'y' });

    global.test_rendererAccess.animationLoop();
}

export function chooseFolder() {
    window.directories.push(new mockFileSystemDirectoryHandle('test'));
    document.querySelector('#choose-folder-button').eventListeners.click();
    window.mainFunc();
}

export function createAndOpenStoryMoment() {
    chooseFolder();
    document.querySelector('#new-story-button').eventListeners.click();
    document.querySelector('#edit-' + testmodel().id).eventListeners.click();
    window.mainFunc();
    expect(testmodel().moments.length).toBe(1);
    clickButtonInput('#moment-button-' + testmodel().moments[0].id);

    global.test_rendererAccess.animationLoop();
}

export function createAudioInCanvasEnvironment(x, y, z) {
    global.test_rendererAccess.animationLoop();
    movePageHead(x, y, z + 0.5)
    lookHead(x, y, z - 1);

    canvasClickMenuButton(ToolButtons.RECORD);
    canvasClickMenuButton(RecordToolButtons.RECORD);
    global.test_rendererAccess.animationLoop();
    global.test_rendererAccess.animationLoop();
    canvasClickMenuButton(RecordToolButtons.RECORD);
    canvasClickMenuButton(RecordToolButtons.ACCEPT);
    canvasClickMenuButton(ToolButtons.MOVE);

    global.test_rendererAccess.animationLoop();
}

export function setupEnvironmentWith3DAsset(assetName) {
    createAndOpenStoryMoment();

    loadRealFile(assetName);
    // add the file to the 'choosen file' queue.
    window.files.push(new mockFile(global.fileSystem[assetName], assetName, { type: "model/gltf-binary" }));
    clickButtonInput('#asset-manager-button');
    clickButtonInput('#asset-add-button');
    clickButtonInput('#dialog-close-button');

    let asset = testmodel().assets.find(a => a.type == AssetTypes.MODEL);
    let assetId = asset.id;

    canvasClickMenuButton(MenuNavButtons.ADD);
    canvasClickMenuButton(MenuNavButtons.ADD_MODEL);
    canvasClickMenuButton(assetId);
    canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
    canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);

    expect(document.querySelector('#assets-container').children.length).toBeGreaterThan(0);
    document.querySelector('#dialog-close-button').eventListeners.click();

    expect(testmodel().poseableAssets.length).toBe(1);
    clickButtonInput('#poseable-asset-button-' + testmodel().poseableAssets[0].id);

    global.test_rendererAccess.animationLoop();
}

export function addPictureAsset() {
    // add the file to the 'choosen file' queue.
    window.files.push(new mockFile('data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAAC', 'fakePicture', { type: 'image/gif' }));
    clickButtonInput('#asset-manager-button');
    clickButtonInput('#asset-add-button');
    clickButtonInput('#dialog-close-button');

    expect(document.querySelector('#assets-container').children.length).toBeGreaterThan(0);
    document.querySelector('#dialog-close-button').eventListeners.click();

    global.test_rendererAccess.animationLoop();
}

export function uploadImageAsset() {
    loadRealFile('fish.png')
    window.files.push(new mockFile(global.fileSystem['fish.png'], 'fish.png', { type: "image/x-png" }));
    clickButtonInput('#asset-manager-button');
    clickButtonInput('#asset-add-button');
    clickButtonInput('#dialog-close-button');

    expect(document.querySelector('#assets-container').children.length).toBeGreaterThan(0);
    expect(testmodel().assets.filter(a => a.type == AssetTypes.IMAGE).length).toBeGreaterThan(0);
    document.querySelector('#dialog-close-button').eventListeners.click();
}

export function canvasClickMenuButton(buttonId) {
    forceIntercept(buttonId);
    pointermove(0, 0);
    canvaspointerdown(0, 0);
    pointerup(0, 0);
    forceIntercept(null);
}

export function getInputValue(id) {
    let inputContainer = document.querySelector(id);
    expect(Object.keys(inputContainer.children).length).toBe(2);
    let input = inputContainer.children[1];
    if (input.attrs['type'] == 'text' || input.attrs['type'] == 'number') {
        return input.value;
    } else if (input.attrs['type'] == 'checkbox') {
        return input.checked;
    } else {
        console.error("Not a valid type", input.attrs['type'])
    }
}

export function enterInputValue(id, value) {
    let inputContainer = document.querySelector(id);
    expect(Object.keys(inputContainer.children).length).toBe(2);
    let input = inputContainer.children[1];
    if (input.attrs['type'] == 'text' || input.attrs['type'] == 'number') {
        input.value = value;
        input.eventListeners.blur();
    } else if (input.attrs['type'] == 'checkbox') {
        input.checked = value;
        input.eventListeners.change();
    } else {
        console.error("Not a valid type", input.attrs['type'])
    }
}

export function clickButtonInput(id) {
    let inputContainer = document.querySelector(id);
    expect(Object.keys(inputContainer.eventListeners)).toEqual(['click', 'pointerup', 'pointerdown', 'pointerenter', 'pointerout']);
    inputContainer.eventListeners.pointerenter();
    inputContainer.eventListeners.pointerdown();
    inputContainer.eventListeners.pointerup();
    inputContainer.eventListeners.click();
    inputContainer.eventListeners.pointerout();
}

export function createBasicStoryModel() {
    let model = new Data.StoryModel();
    model.moments.push(new Data.Moment());
    model.photospheres.push(new Data.Photosphere());
    model.photospheres[0].momentId = model.moments[0].id;
    return model;
}

export function createStoryModel() {
    let model = new Data.StoryModel();
    model.name = "TestStory"

    model.moments.push(new Data.Moment());

    let asset1 = new Data.Asset()
    let pose1 = new Data.AssetPose()
    pose1.parentId = asset1.id;
    let pose2 = new Data.AssetPose()
    pose2.parentId = asset1.id;
    let pose3 = new Data.AssetPose()
    pose3.parentId = asset1.id;
    let asset2 = new Data.Asset()
    let pose4 = new Data.AssetPose()
    pose4.parentId = asset2.id;
    let pose5 = new Data.AssetPose()
    pose5.parentId = asset2.id;

    let imageAsset = new Data.Asset()

    let poseableAsset1 = new Data.PoseableAsset()
    poseableAsset1.assetId = asset1.id;
    poseableAsset1.momentId = model.moments[0].id;
    let poseableAsset2 = new Data.PoseableAsset()
    poseableAsset2.assetId = asset1.id;
    poseableAsset2.momentId = model.moments[0].id;
    let poseableAsset3 = new Data.PoseableAsset()
    poseableAsset3.assetId = asset1.id;
    poseableAsset3.momentId = model.moments[0].id;
    model.poseableAssets.push(poseableAsset1);
    model.poseableAssets.push(poseableAsset2);
    model.poseableAssets.push(poseableAsset3);

    let picture = new Data.Picture();
    picture.momentId = model.moments[0].id;
    model.pictures.push(picture);

    model.assets.push(asset1);
    model.assets.push(asset2);
    model.assetPoses.push(pose1);
    model.assetPoses.push(pose2);
    model.assetPoses.push(pose3);
    model.assetPoses.push(pose4);
    model.assetPoses.push(pose5);
    model.assets.push(imageAsset);

    return model;
}

export function startXR() {
    document.querySelector('#enter-vr-button').eventListeners.click();
    let c0 = global.navigator.xr.getController(0)
    c0.eventListeners.connected({ data: { handedness: c0.handedness } });
    let c1 = global.navigator.xr.getController(1)
    c1.eventListeners.connected({ data: { handedness: c1.handedness } });
    global.test_rendererAccess.animationLoop();
}

export function stopXR() {
    global.navigator.xr.getController(0).eventListeners.disconnected({ data: { handedness: 'left' } });
    global.navigator.xr.getController(1).eventListeners.disconnected({ data: { handedness: 'right' } });
    global.navigator.xr.eventListeners.sessionend();
}

export function lookHead(x, y, z) {
    global.test_rendererAccess.animationLoop();
    let camera = global.test_rendererAccess.lastRender.camera;
    camera.lookAt(x, y, z);
    camera.updateWorldMatrix(true)
    global.test_rendererAccess.animationLoop();
}

export function movePageHead(x, y, z) {
    global.test_rendererAccess.animationLoop();
    let camera = global.test_rendererAccess.lastRender.camera;
    camera.position.set(x, y, z);
    camera.updateWorldMatrix()
    global.test_rendererAccess.animationLoop();
}

export function moveXRHead(x, y, z) {
    let camera = global.test_rendererAccess.lastRender.camera;
    let cPos = camera.parent.worldToLocal(new THREE.Vector3(x, y, z));
    camera.position.copy(cPos);
    camera.updateWorldMatrix(true);
    global.test_rendererAccess.animationLoop();
}

export function lookController(primary, x, y, z) {
    let controller = getController(primary);
    let lookPos = new THREE.Vector3(x, y, z);
    let pos = controller.getWorldPosition(new THREE.Vector3());
    // for some reason controllers need to face backwards. I don't know why. 
    lookPos.sub(pos).negate().add(pos);
    controller.lookAt(lookPos.x, lookPos.y, lookPos.z);
    moveXRController(primary, pos.x, pos.y, pos.z);
}

export function moveXRController(primary, x, y, z) {
    let controller = getController(primary);
    let cPos = controller.parent.worldToLocal(new THREE.Vector3(x, y, z));
    controller.position.copy(cPos);
    controller.updateWorldMatrix(true);
    global.test_rendererAccess.animationLoop();
}

export function pressXRTrigger(primary) {
    let controller = getController(primary);
    controller.gamepad.buttons[0].pressed = true;
    global.navigator.xr.getSession().eventListeners.selectstart();
    global.test_rendererAccess.animationLoop();
}

export function releaseXRTrigger(primary) {
    let controller = getController(primary);
    controller.gamepad.buttons[0].pressed = false;
    global.navigator.xr.getSession().eventListeners.selectend();
    global.test_rendererAccess.animationLoop();
}

export function pushXRToggle(primary, axes) {
    let controller = getController(primary);
    controller.gamepad.axes = axes;
    global.test_rendererAccess.animationLoop();
}

export function releaseXRToggle(primary) {
    let controller = getController(primary);
    controller.gamepad.axes = [0, 0, 0, 0];
    global.test_rendererAccess.animationLoop();
}

export function toggleMoveForward() {
    let axes = [0, 0, 0, 0];
    axes[3] = 1;
    pushXRToggle(true, axes);
    releaseXRToggle(true);
}

export function toggleMoveBack() {
    let axes = [0, 0, 0, 0];
    axes[3] = -1;
    pushXRToggle(true, axes);
    releaseXRToggle(true);
}

export function toggleTurnLeft() {
    let axes = [0, 0, 0, 0];
    axes[2] = -1;
    pushXRToggle(true, axes);
    releaseXRToggle(true);
}

export function toggleTurnRight() {
    let axes = [0, 0, 0, 0];
    axes[2] = 1;
    pushXRToggle(true, axes);
    releaseXRToggle(true);
}

export function getTHREEObjectByName(name) {
    let scene = global.test_rendererAccess.lastRender.scene;
    if (!scene) return null;
    return scene.getObjectByName(name);
}

function getController(primary) {
    let controller = global.navigator.xr.getSession().inputSources
        .find(s => s.handedness == (primary ? 'right' : 'left'));
    controller.updateWorldMatrix(true)
    return controller;
}