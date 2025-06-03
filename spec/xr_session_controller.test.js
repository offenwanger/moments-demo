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
        it('should start a session', function () {
            setupEnvironmentWith3DAsset('bonesAndMesh.glb');
            startXR();
        });

        it('should stop a session', function () {
            setupEnvironmentWith3DAsset('bonesAndMesh.glb');
            startXR();
            stopXR();
        });

        it('should perform a render pass', function () {
            setupEnvironmentWith3DAsset('bonesAndMesh.glb');
            startXR();
            global.test_rendererAccess.animationLoop();
        });
    });

    describe('move tests', function () {
        it('should drag', function () {
            setupEnvironmentWith3DAsset('threeMesh.glb');
            startXR();

            let poseableAsset = testmodel().poseableAssets[0]

            let cubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(cubePos.x).toBeCloseTo(0.6, 3);
            expect(cubePos.y).toBeCloseTo(0, 4);
            expect(cubePos.z).toBeCloseTo(-1, 4);

            lookHead(cubePos.x, cubePos.y, cubePos.z);
            moveXRController(true, 0, 0, -1);
            lookController(true, cubePos.x, cubePos.y, cubePos.z);
            pressXRTrigger(true)
            moveXRController(true, 1, 0, -1);
            releaseXRTrigger(true);

            let newcubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(newcubePos.x).toBeCloseTo(1.6, 3);
            expect(newcubePos.y).toBeCloseTo(0, 4);
            expect(newcubePos.z).toBeCloseTo(-1, 4);
        });

        it('should rotate', function () {
            setupEnvironmentWith3DAsset('oneMesh.glb');
            startXR();

            let poseableAsset = testmodel().poseableAssets[0]

            let cubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(cubePos.x).toBeCloseTo(0.6, 3);
            expect(cubePos.y).toBeCloseTo(0, 4);
            expect(cubePos.z).toBeCloseTo(-1, 4);
            let cubeRot = new Euler().setFromQuaternion(new Quaternion().fromArray(cubePos.orientation));
            expect(cubeRot.x).toBeCloseTo(0, 4);
            expect(cubeRot.y).toBeCloseTo(0, 4);
            expect(cubeRot.z).toBeCloseTo(0, 4);

            lookHead(cubePos.x, cubePos.y, cubePos.z);
            moveXRController(true, 0, 0, -1);
            lookController(true, 0.6, 0, -1);
            pressXRTrigger(true)
            moveXRController(true, 0, 1, -1);
            lookController(true, 0, 1, -1);
            releaseXRTrigger(true);

            let newcubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(newcubePos.x).toBeCloseTo(0, 3);
            expect(newcubePos.y).toBeCloseTo(1, 4);
            expect(newcubePos.z).toBeCloseTo(-1.6, 4);
            let newcubeRot = new Euler().setFromQuaternion(new Quaternion().fromArray(newcubePos.orientation));
            expect(newcubeRot.x).toBeCloseTo(0, 4);
            expect(newcubeRot.y).toBeCloseTo(Math.PI / 2, 4);
            expect(newcubeRot.z).toBeCloseTo(0, 4);
        });

        it('should move correctly when user moves', function () {
            setupEnvironmentWith3DAsset('oneMesh.glb');
            startXR();

            let poseableAsset = testmodel().poseableAssets[0]
            let cubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(cubePos.x).toBeCloseTo(0.6, 3);
            expect(cubePos.y).toBeCloseTo(0, 4);
            expect(cubePos.z).toBeCloseTo(-1, 4);
            let cubeRot = new Euler().setFromQuaternion(new Quaternion().fromArray(cubePos.orientation));
            expect(cubeRot.x).toBeCloseTo(0, 4);
            expect(cubeRot.y).toBeCloseTo(0, 4);
            expect(cubeRot.z).toBeCloseTo(0, 4);

            moveXRHead(0, 1, 0);
            lookHead(0, 1, -1);

            expect(getTHREEObjectByName('Cube').userData.state).toBe('idle')
            // grab and move forward
            moveXRController(true, 0, 0, -1);
            lookController(true, 0.6, 0, -1);

            expect(getTHREEObjectByName('Cube').userData.state).toBe('highlighted')
            pressXRTrigger(true)
            expect(getTHREEObjectByName('Cube').userData.state).toBe('selected')

            toggleMoveForward();
            toggleMoveForward();

            releaseXRTrigger(true);
            expect(getTHREEObjectByName('Cube').userData.state).toBe('highlighted')
            moveXRController(true, 0, 0, -1);
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

        it('should move correctly when user is turned', function () {
            setupEnvironmentWith3DAsset('oneMesh.glb');
            startXR();

            let poseableAsset = testmodel().poseableAssets[0]

            let cubePos = testmodel().assetPoses.find(p => p.name == "Cube" && p.parentId == poseableAsset.id);
            expect(cubePos.x).toBeCloseTo(0.6, 3);
            expect(cubePos.y).toBeCloseTo(0, 4);
            expect(cubePos.z).toBeCloseTo(-1, 4);
            let cubeRot = new Euler().setFromQuaternion(new Quaternion().fromArray(cubePos.orientation));
            expect(cubeRot.x).toBeCloseTo(0, 4);
            expect(cubeRot.y).toBeCloseTo(0, 4);
            expect(cubeRot.z).toBeCloseTo(0, 4);

            toggleTurnLeft();
            toggleTurnLeft();

            moveXRHead(0, 1, 0);
            lookHead(0, 1, -1);

            // grab and move forward
            expect(getTHREEObjectByName('Cube').userData.state).toBe('idle')
            moveXRController(true, 0, 0, -1);
            lookController(true, 0.6, 0, -1);

            expect(getTHREEObjectByName('Cube').userData.state).toBe('highlighted')
            pressXRTrigger(true);
            expect(getTHREEObjectByName('Cube').userData.state).toBe('selected')
            releaseXRTrigger(true);
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