
import { cleanup, setup } from './test_utils/test_environment.js';

import { ToolButtons } from '../js/constants.js';
import { clearPromises } from './test_utils/mock_promise.js';
import { canvasClickMenuButton, canvaspointerdown, lookHead, movePageHead, pointermove, pointerup, testmodel } from './test_utils/test_actions.js';
import { createAndOpenStoryMomentAsync } from './test_utils/test_actions_async.js';



describe('Test Photosphere Wrapper Async', function () {
    beforeEach(async function () {
        await setup(true);
    });

    afterEach(async function () {
        await cleanup();
    })


    describe('surface tests', function () {
        // needs to be async because of the GLTF Exporter
        it('should scissors a section', async function () {
            await createAndOpenStoryMomentAsync();

            expect(testmodel().poseableAssets.length).toBe(0);

            let canvas = document.querySelector('#main-canvas');
            canvasClickMenuButton(ToolButtons.SCISSORS);
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);

            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            canvaspointerdown(canvas.width / 2 - 10, canvas.height / 2)

            pointermove(canvas.width / 2 - 10, canvas.height / 2 - 100);
            pointermove(canvas.width / 2 - 200, canvas.height / 2 - 100);
            pointermove(canvas.width / 2 - 200, canvas.height / 2 + 100);
            pointermove(canvas.width / 2 - 10, canvas.height / 2 + 100);

            pointermove(canvas.width / 2 - 10, canvas.height / 2 - 30);
            pointerup(canvas.width / 2 - 30, canvas.height / 2 - 30);
            await clearPromises();


            expect(testmodel().poseableAssets.length).toBe(1);

            await clearPromises();
        });
    });
});