
import * as THREE from 'three';
import { Data } from '../../js/data.js';
import { loadRealFile, mockFile, mockFileSystemDirectoryHandle } from './mock_filesystem.js';
import { AssetTypes, MenuNavButtons, RecordToolButtons, ToolButtons } from '../../js/constants.js';
import { forceIntercept } from './mock_three.js';

export function testmodel() {
    let storyFile = Object.keys(global.fileSystem).find(k => k.startsWith('test/StoryModel_'))
    return Data.StoryModel.fromObject(JSON.parse(global.fileSystem[storyFile]))
}

export async function canvaspointerdown(x, y) {
    await document.querySelector("#main-canvas").eventListeners.pointerdown({
        clientX: x,
        clientY: y
    });
}

export async function pointermove(x, y) {
    if (!window.callbacks.pointermove) console.error("No callbacks registered for pointermove");
    for (let cb of window.callbacks.pointermove)
        await cb({ clientX: x, clientY: y });
    
    await global.test_rendererAccess.animationLoop();
}

export async function pointerup(x, y) {
    if (!window.callbacks.pointerup) console.error("No callbacks registered for pointerup");
    for (let cb of window.callbacks.pointerup)
        await cb({ clientX: x, clientY: y });

    await global.test_rendererAccess.animationLoop();
}

export async function chooseFolder() {
    window.directories.push(new mockFileSystemDirectoryHandle('test'));
    await document.querySelector('#choose-folder-button').eventListeners.click();
    await window.mainFunc();
}

export async function createAndOpenStoryMoment() {
    await chooseFolder();
    await document.querySelector('#new-story-button').eventListeners.click();
    await document.querySelector('#edit-' + testmodel().id).eventListeners.click();
    await window.mainFunc();
    expect(testmodel().moments.length).toBe(1);
    await clickButtonInput('#moment-button-' + testmodel().moments[0].id);

    await global.test_rendererAccess.animationLoop();
}

export async function createAudioInCanvasEnvironment() {
    await canvasClickMenuButton(ToolButtons.RECORD);

    let canvas = document.querySelector('#main-canvas');
    await pointermove(canvas.width / 2, canvas.height / 2);
    await canvaspointerdown(canvas.width / 2, canvas.height / 2)
    await pointermove(canvas.width / 2 - 100, canvas.height / 2);
    await pointerup(canvas.width / 2 - 100, canvas.height / 2);

    await canvasClickMenuButton(RecordToolButtons.ACCEPT);
    await canvasClickMenuButton(ToolButtons.MOVE);

    await global.test_rendererAccess.animationLoop();
}

export async function setupEnvironmentWith3DAsset(assetName) {
    await createAndOpenStoryMoment();

    await loadRealFile(assetName);
    // add the file to the 'choosen file' queue.
    window.files.push(new mockFile(assetName, "model/gltf-binary", global.fileSystem[assetName]));
    await clickButtonInput('#asset-manager-button');
    await clickButtonInput('#asset-add-button');
    await clickButtonInput('#dialog-close-button');

    let assetId = testmodel().assets.find(a => a.type == AssetTypes.MODEL).id;

    await canvasClickMenuButton(MenuNavButtons.ADD);
    await canvasClickMenuButton(MenuNavButtons.ADD_MODEL);
    await canvasClickMenuButton(assetId);
    await canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
    await canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);

    expect(document.querySelector('#assets-container').children.length).toBeGreaterThan(0);
    document.querySelector('#assets-container').children[0].eventListeners.click();

    expect(testmodel().poseableAssets.length).toBe(1);
    await clickButtonInput('#poseable-asset-button-' + testmodel().poseableAssets[0].id);

    await global.test_rendererAccess.animationLoop();
}

export async function setupEnvironmentWithPicture() {
    await createAndOpenStoryMoment();

    // add the file to the 'choosen file' queue.
    window.files.push(new mockFile('fakePicture', 'image/gif', 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAAC'));
    await clickButtonInput('#asset-manager-button');
    await clickButtonInput('#asset-add-button');
    await clickButtonInput('#dialog-close-button');

    let assetId = testmodel().assets.find(a => a.type == AssetTypes.IMAGE).id;

    await canvasClickMenuButton(MenuNavButtons.ADD);
    await canvasClickMenuButton(MenuNavButtons.ADD_PICTURE);
    await canvasClickMenuButton(assetId);
    await canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
    await canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);

    expect(document.querySelector('#assets-container').children.length).toBeGreaterThan(0);
    document.querySelector('#assets-container').children[0].eventListeners.click();

    expect(testmodel().pictures.length).toBe(1);
    await clickButtonInput('#picture-button-' + testmodel().pictures[0].id);

    await global.test_rendererAccess.animationLoop();
}

export async function uploadImageAsset() {
    await loadRealFile('fish.png')
    window.files.push(new mockFile('fish.png', "image/x-png", global.fileSystem['fish.png']));
    await clickButtonInput('#asset-manager-button');
    await clickButtonInput('#asset-add-button');
    await clickButtonInput('#dialog-close-button');

    expect(document.querySelector('#assets-container').children.length).toBeGreaterThan(0);
    expect(testmodel().assets.filter(a => a.type == AssetTypes.IMAGE).length).toBeGreaterThan(0);
    document.querySelector('#assets-container').children[0].eventListeners.click();
}

export async function canvasClickMenuButton(buttonId) {
    forceIntercept(buttonId);
    await pointermove(0, 0);
    await canvaspointerdown(0, 0);
    await pointerup(0, 0);
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

export async function enterInputValue(id, value) {
    let inputContainer = document.querySelector(id);
    expect(Object.keys(inputContainer.children).length).toBe(2);
    let input = inputContainer.children[1];
    if (input.attrs['type'] == 'text' || input.attrs['type'] == 'number') {
        input.value = value;
        await input.eventListeners.blur();
    } else if (input.attrs['type'] == 'checkbox') {
        input.checked = value;
        await input.eventListeners.change();
    } else {
        console.error("Not a valid type", input.attrs['type'])
    }
}

export async function clickButtonInput(id) {
    let inputContainer = document.querySelector(id);
    expect(Object.keys(inputContainer.eventListeners)).toEqual(['click', 'pointerup', 'pointerdown', 'pointerenter', 'pointerout']);
    await inputContainer.eventListeners.pointerenter();
    await inputContainer.eventListeners.pointerdown();
    await inputContainer.eventListeners.pointerup();
    await inputContainer.eventListeners.click();
    await inputContainer.eventListeners.pointerout();
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

export async function startXR() {
    await document.querySelector('#enter-vr-button').eventListeners.click();
    let c0 = global.navigator.xr.getController(0)
    c0.eventListeners.connected({ data: { handedness: c0.handedness } });
    let c1 = global.navigator.xr.getController(1)
    c1.eventListeners.connected({ data: { handedness: c1.handedness } });
    await global.test_rendererAccess.animationLoop();
}

export async function stopXR() {
    global.navigator.xr.getController(0).eventListeners.disconnected({ data: { handedness: 'left' } });
    global.navigator.xr.getController(1).eventListeners.disconnected({ data: { handedness: 'right' } });
    global.navigator.xr.eventListeners.sessionend();
}

export async function lookHead(x, y, z) {
    await global.test_rendererAccess.animationLoop();
    let camera = global.test_rendererAccess.lastRender.camera;
    camera.lookAt(x, y, z);
    camera.updateWorldMatrix(true)
    await global.test_rendererAccess.animationLoop();
}

export async function movePageHead(x, y, z) {
    let camera = global.test_rendererAccess.lastRender.camera;
    camera.position.set(x, y, z);
    camera.updateWorldMatrix()
    await global.test_rendererAccess.animationLoop();
}

export async function moveXRHead(x, y, z) {
    let camera = global.test_rendererAccess.lastRender.camera;
    let cPos = camera.parent.worldToLocal(new THREE.Vector3(x, y, z));
    camera.position.copy(cPos);
    camera.updateWorldMatrix(true);
    await global.test_rendererAccess.animationLoop();
}

export async function lookController(primary, x, y, z) {
    let controller = await getController(primary);
    let lookPos = new THREE.Vector3(x, y, z);
    let pos = controller.getWorldPosition(new THREE.Vector3());
    // for some reason controllers need to face backwards. I don't know why. 
    lookPos.sub(pos).negate().add(pos);
    controller.lookAt(lookPos.x, lookPos.y, lookPos.z);
    await moveXRController(primary, pos.x, pos.y, pos.z);
}

export async function moveXRController(primary, x, y, z) {
    let controller = await getController(primary);
    let cPos = controller.parent.worldToLocal(new THREE.Vector3(x, y, z));
    controller.position.copy(cPos);
    controller.updateWorldMatrix(true);
    await global.test_rendererAccess.animationLoop();
}

export async function pressXRTrigger(primary) {
    let controller = await getController(primary);
    controller.gamepad.buttons[0].pressed = true;
    await global.navigator.xr.getSession().eventListeners.selectstart();
    await global.test_rendererAccess.animationLoop();
}

export async function releaseXRTrigger(primary) {
    let controller = await getController(primary);
    controller.gamepad.buttons[0].pressed = false;
    await global.navigator.xr.getSession().eventListeners.selectend();
    await global.test_rendererAccess.animationLoop();
}

export async function pushXRToggle(primary, axes) {
    let controller = await getController(primary);
    controller.gamepad.axes = axes;
    await global.test_rendererAccess.animationLoop();
}

export async function releaseXRToggle(primary) {
    let controller = await getController(primary);
    controller.gamepad.axes = [0, 0, 0, 0];
    await global.test_rendererAccess.animationLoop();
}

export async function toggleMoveForward() {
    let axes = [0, 0, 0, 0];
    axes[3] = 1;
    await pushXRToggle(true, axes);
    await releaseXRToggle(true);
}

export async function toggleMoveBack() {
    let axes = [0, 0, 0, 0];
    axes[3] = -1;
    await pushXRToggle(true, axes);
    await releaseXRToggle(true);
}

export async function toggleTurnLeft() {
    let axes = [0, 0, 0, 0];
    axes[2] = -1;
    await pushXRToggle(true, axes);
    await releaseXRToggle(true);
}

export async function toggleTurnRight() {
    let axes = [0, 0, 0, 0];
    axes[2] = 1;
    await pushXRToggle(true, axes);
    await releaseXRToggle(true);
}

export function getTHREEObjectByName(name) {
    let scene = global.test_rendererAccess.lastRender.scene;
    if (!scene) return null;
    return scene.getObjectByName(name);
}

async function getController(primary) {
    let controller = global.navigator.xr.getSession().inputSources
        .find(s => s.handedness == (primary ? 'right' : 'left'));
    controller.updateWorldMatrix(true)
    return controller;
}