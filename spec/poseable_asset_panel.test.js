import { cleanup, setup } from './test_utils/test_environment.js';

import { enterInputValue, getInputValue, setupEnvironmentWith3DAsset, testmodel } from './test_utils/test_actions.js';

describe('Test PoseableAsset Panel', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('init tests', function () {
        it('should open a poseableAsset panel', function () {
            setupEnvironmentWith3DAsset('bonesAndMesh.glb');
        });
    });

    describe('edit tests', function () {
        it('should update asset name', function () {
            setupEnvironmentWith3DAsset('threeMesh.glb');
            expect(getInputValue("#poseableAsset-name-input")).toBe('threeMesh.glb');
            expect(testmodel().poseableAssets[0].name).toBe('threeMesh.glb');
            enterInputValue("#poseableAsset-name-input", 'new name')
            expect(getInputValue("#poseableAsset-name-input")).toBe('new name');
            expect(testmodel().poseableAssets[0].name).toBe("new name");
        });
    });
});