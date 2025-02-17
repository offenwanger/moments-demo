
import { enterInputValue, getInputValue, setupEnvironmentWith3DAsset, testmodel } from './test_utils/test_actions.js';
import { cleanup, setup } from './test_utils/test_environment.js';

describe('Test PoseableAsset Panel', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('init tests', function () {
        it('should open a poseableAsset panel', async function () {
            await setupEnvironmentWith3DAsset('bonesAndMesh.glb');
        });
    });

    describe('edit tests', function () {
        it('should update asset name', async function () {
            await setupEnvironmentWith3DAsset('threeMesh.glb');
            expect(getInputValue("#poseableAsset-name-input")).toBe('threeMesh.glb');
            expect(testmodel().find(testmodel().moments[0].poseableAssetIds[0]).name).toBe('threeMesh.glb');
            await enterInputValue("#poseableAsset-name-input", 'new name')
            expect(getInputValue("#poseableAsset-name-input")).toBe('new name');
            expect(testmodel().find(testmodel().moments[0].poseableAssetIds[0]).name).toBe("new name");
        });
    });
});