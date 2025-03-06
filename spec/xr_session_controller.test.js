import { cleanup, setup } from './test_utils/test_environment.js';

import { Euler, Quaternion } from 'three';
import { getTHREEObjectByName, lookController, lookHead, moveXRController, moveXRHead, pressXRTrigger, releaseXRTrigger, setupEnvironmentWith3DAsset, startXR, stopXR, testmodel, toggleMoveForward, toggleTurnLeft } from './test_utils/test_actions.js';

describe('Test XR Session', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('session tests', function () {
        it('should start a session', async function () {
            await setupEnvironmentWith3DAsset('bonesAndMesh.glb');
            await startXR();
        });

        it('should stop a session', async function () {
            await setupEnvironmentWith3DAsset('bonesAndMesh.glb');
            await startXR();
            await stopXR();
        });

        it('should perform a render pass', async function () {
            await setupEnvironmentWith3DAsset('bonesAndMesh.glb');
            await startXR();
            global.test_rendererAccess.animationLoop();
        });
    });

    describe('move tests', function () {
        it('should drag', async function () {
            await setupEnvironmentWith3DAsset('threeMesh.glb');
            await startXR();

            let poseableAsset = testmodel().poseableAssets[0]

            let cubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(cubePos.x).toBeCloseTo(0.6, 3);
            expect(cubePos.y).toBeCloseTo(0, 4);
            expect(cubePos.z).toBeCloseTo(-1, 4);

            await lookHead(cubePos.x, cubePos.y, cubePos.z);
            await moveXRController(true, 0, 0, -1);
            await lookController(true, cubePos.x, cubePos.y, cubePos.z);
            await pressXRTrigger(true)
            await moveXRController(true, 1, 0, -1);
            await releaseXRTrigger(true);

            let newcubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(newcubePos.x).toBeCloseTo(1.6, 3);
            expect(newcubePos.y).toBeCloseTo(0, 4);
            expect(newcubePos.z).toBeCloseTo(-1, 4);
        });

        it('should rotate', async function () {
            await setupEnvironmentWith3DAsset('oneMesh.glb');
            await startXR();

            let poseableAsset = testmodel().poseableAssets[0]

            let cubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(cubePos.x).toBeCloseTo(0.6, 3);
            expect(cubePos.y).toBeCloseTo(0, 4);
            expect(cubePos.z).toBeCloseTo(-1, 4);
            let cubeRot = new Euler().setFromQuaternion(new Quaternion().fromArray(cubePos.orientation));
            expect(cubeRot.x).toBeCloseTo(0, 4);
            expect(cubeRot.y).toBeCloseTo(0, 4);
            expect(cubeRot.z).toBeCloseTo(0, 4);

            await lookHead(cubePos.x, cubePos.y, cubePos.z);
            await moveXRController(true, 0, 0, -1);
            await lookController(true, 0.6, 0, -1);
            await pressXRTrigger(true)
            await moveXRController(true, 0, 1, -1);
            await lookController(true, 0, 1, -1);
            await releaseXRTrigger(true);

            let newcubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(newcubePos.x).toBeCloseTo(0, 3);
            expect(newcubePos.y).toBeCloseTo(1, 4);
            expect(newcubePos.z).toBeCloseTo(-1.6, 4);
            let newcubeRot = new Euler().setFromQuaternion(new Quaternion().fromArray(newcubePos.orientation));
            expect(newcubeRot.x).toBeCloseTo(0, 4);
            expect(newcubeRot.y).toBeCloseTo(Math.PI / 2, 4);
            expect(newcubeRot.z).toBeCloseTo(0, 4);
        });

        it('should move correctly when user moves', async function () {
            await setupEnvironmentWith3DAsset('oneMesh.glb');
            await startXR();

            let poseableAsset = testmodel().poseableAssets[0]
            let cubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(cubePos.x).toBeCloseTo(0.6, 3);
            expect(cubePos.y).toBeCloseTo(0, 4);
            expect(cubePos.z).toBeCloseTo(-1, 4);
            let cubeRot = new Euler().setFromQuaternion(new Quaternion().fromArray(cubePos.orientation));
            expect(cubeRot.x).toBeCloseTo(0, 4);
            expect(cubeRot.y).toBeCloseTo(0, 4);
            expect(cubeRot.z).toBeCloseTo(0, 4);

            await moveXRHead(0, 1, 0);
            await lookHead(0, 1, -1);

            expect(getTHREEObjectByName('Cube').userData.state).toBe('idle')
            // grab and move forward
            await moveXRController(true, 0, 0, -1);
            await lookController(true, 0.6, 0, -1);

            expect(getTHREEObjectByName('Cube').userData.state).toBe('highlighted')
            await pressXRTrigger(true)
            expect(getTHREEObjectByName('Cube').userData.state).toBe('selected')

            await toggleMoveForward();
            await toggleMoveForward();

            await releaseXRTrigger(true);
            expect(getTHREEObjectByName('Cube').userData.state).toBe('highlighted')
            await moveXRController(true, 0, 0, -1);
            expect(getTHREEObjectByName('Cube').userData.state).toBe('idle')

            cubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(cubePos.x).toBeCloseTo(0.6, 3);
            expect(cubePos.y).toBeCloseTo(0, 4);
            expect(cubePos.z).toBeCloseTo(0, 4);
            cubeRot = new Euler().setFromQuaternion(new Quaternion().fromArray(cubePos.orientation));
            expect(cubeRot.x).toBeCloseTo(0, 4);
            expect(cubeRot.y).toBeCloseTo(0, 4);
            expect(cubeRot.z).toBeCloseTo(0, 4);
        });

        it('should move correctly when user is turned', async function () {
            await setupEnvironmentWith3DAsset('oneMesh.glb');
            await startXR();

            let poseableAsset = testmodel().poseableAssets[0]

            let cubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(cubePos.x).toBeCloseTo(0.6, 3);
            expect(cubePos.y).toBeCloseTo(0, 4);
            expect(cubePos.z).toBeCloseTo(-1, 4);
            let cubeRot = new Euler().setFromQuaternion(new Quaternion().fromArray(cubePos.orientation));
            expect(cubeRot.x).toBeCloseTo(0, 4);
            expect(cubeRot.y).toBeCloseTo(0, 4);
            expect(cubeRot.z).toBeCloseTo(0, 4);

            await toggleTurnLeft();
            await toggleTurnLeft();

            await moveXRHead(0, 1, 0);
            await lookHead(0, 1, -1);

            // grab and move forward
            expect(getTHREEObjectByName('Cube').userData.state).toBe('idle')
            await moveXRController(true, 0, 0, -1);
            await lookController(true, 0.6, 0, -1);

            expect(getTHREEObjectByName('Cube').userData.state).toBe('highlighted')
            await pressXRTrigger(true);
            expect(getTHREEObjectByName('Cube').userData.state).toBe('selected')
            await releaseXRTrigger(true);
            expect(getTHREEObjectByName('Cube').userData.state).toBe('highlighted')

            cubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(cubePos.x).toBeCloseTo(0.6, 3);
            expect(cubePos.y).toBeCloseTo(0, 4);
            expect(cubePos.z).toBeCloseTo(-1, 4);
            cubeRot = new Euler().setFromQuaternion(new Quaternion().fromArray(cubePos.orientation));
            expect(cubeRot.x).toBeCloseTo(0, 4);
            expect(cubeRot.y).toBeCloseTo(0, 4);
            expect(cubeRot.z).toBeCloseTo(0, 4);
        });
    });
});