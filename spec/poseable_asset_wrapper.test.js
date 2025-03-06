
import { cleanup, setup } from './test_utils/test_environment.js';

import { canvaspointerdown, lookHead, movePageHead, pointermove, pointerup, setupEnvironmentWith3DAsset, testmodel } from './test_utils/test_actions.js';



describe('Test Posable Asset Wrapper', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('init tests', function () {
        it('should load a 3D model', async function () {
            await setupEnvironmentWith3DAsset('bonesAndMesh.glb');
        });
    });

    describe('canvas drag tests', function () {
        it('should target model mesh', async function () {
            await setupEnvironmentWith3DAsset('bonesAndMesh.glb');
            let poseableAsset = testmodel().poseableAssets[0];
            let cubeData = testmodel().assetPoses.find(p =>
                p.name == "Cube" && p.parentId == poseableAsset.id)
            expect(cubeData.x).toBeCloseTo(0.6, 3);
            expect(cubeData.y).toBeCloseTo(0, 4);
            expect(cubeData.z).toBeCloseTo(-1, 4);

            let canvas = document.querySelector('#main-canvas');

            await movePageHead(0.6, 0, 0)
            await lookHead(cubeData.x, cubeData.y, cubeData.z)

            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 100, canvas.height / 2);
            await pointerup(canvas.width / 2 - 100, canvas.height / 2);


            cubeData = testmodel().assetPoses.find(p =>
                p.name == "Cube" && p.parentId == poseableAsset.id)
            expect(cubeData.x).toBeCloseTo(0.4116, 3);
            expect(cubeData.y).toBeCloseTo(0, 4);
            expect(cubeData.z).toBeCloseTo(-0.9821, 3);
        });

        it('should drag skinnedmesh', async function () {
            await setupEnvironmentWith3DAsset('bonesAndMesh.glb');
            let poseableAsset = testmodel().poseableAssets[0];

            expect(testmodel().assetPoses
                .find(p => p.name == "Bone" && p.parentId == poseableAsset.id).x)
                .toBeCloseTo(0.004, 3);
            expect(testmodel().assetPoses
                .find(p => p.name == "Bone" && p.parentId == poseableAsset.id).z)
                .toBeCloseTo(0.0, 4);

            let canvas = document.querySelector('#main-canvas');

            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 100, canvas.height / 2);
            await pointerup(canvas.width / 2 - 100, canvas.height / 2);

            expect(testmodel().assetPoses
                .find(p => p.name == "Bone" && p.parentId == poseableAsset.id).x)
                .toBeCloseTo(-0.185, 3);
            expect(testmodel().assetPoses
                .find(p => p.name == "Bone" && p.parentId == poseableAsset.id).z)
                .toBeCloseTo(0.0172, 3);
        });
    });
});