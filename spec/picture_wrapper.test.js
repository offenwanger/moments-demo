
import { cleanup, setup } from './test_utils/test_environment.js';

import { canvaspointerdown, lookHead, movePageHead, pointermove, pointerup, setupEnvironmentWithPicture, testmodel } from './test_utils/test_actions.js';



describe('Test Picture Wrapper', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('init tests', function () {
        it('should load a Picture', async function () {
            await setupEnvironmentWithPicture();
        });
    });

    describe('canvas drag tests', function () {
        it('should drag picture', async function () {
            await setupEnvironmentWithPicture();
            let picture = testmodel().pictures[0];

            expect(picture.x).toBeCloseTo(0, 3);
            expect(picture.y).toBeCloseTo(0, 3);
            expect(picture.z).toBeCloseTo(0, 3);

            let canvas = document.querySelector('#main-canvas');

            await movePageHead(0, 0, -1);
            await lookHead(0, 0, 0);
            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 100, canvas.height / 2);
            await pointerup(canvas.width / 2 - 100, canvas.height / 2);

            picture = testmodel().pictures[0];
            expect(picture.x).toBeCloseTo(0.18839, 3);
            expect(picture.y).toBeCloseTo(0, 3);
            expect(picture.z).toBeCloseTo(-0.0179069, 3);
        });
    });
});