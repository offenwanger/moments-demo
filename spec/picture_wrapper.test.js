
import { cleanup, setup } from './test_utils/test_environment.js';

import { AssetTypes, MenuNavButtons } from '../js/constants.js';
import { addPictureAsset, canvasClickMenuButton, canvaspointerdown, clickButtonInput, createAndOpenStoryMoment, lookHead, movePageHead, pointermove, pointerup, testmodel } from './test_utils/test_actions.js';



describe('Test Picture Wrapper', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('init tests', function () {
        it('should load a Picture', function () {
            createAndOpenStoryMoment();
            addPictureAsset();

            let assetId = testmodel().assets.find(a => a.type == AssetTypes.IMAGE).id;
            canvasClickMenuButton(MenuNavButtons.ADD);
            canvasClickMenuButton(MenuNavButtons.ADD_PICTURE);
            canvasClickMenuButton(assetId);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
            expect(testmodel().pictures.length).toBe(1);
            clickButtonInput('#picture-button-' + testmodel().pictures[0].id);
        });
    });

    describe('canvas drag tests', function () {
        it('should drag picture', function () {
            createAndOpenStoryMoment();
            addPictureAsset();

            movePageHead(0, 0, 0.5)
            lookHead(0, 0, -1)
            let assetId = testmodel().assets.find(a => a.type == AssetTypes.IMAGE).id;
            canvasClickMenuButton(MenuNavButtons.ADD);
            canvasClickMenuButton(MenuNavButtons.ADD_PICTURE);
            canvasClickMenuButton(assetId);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
            expect(testmodel().pictures.length).toBe(1);
            clickButtonInput('#picture-button-' + testmodel().pictures[0].id);

            let picture = testmodel().pictures[0];

            expect(picture.x).toBeCloseTo(0, 3);
            expect(picture.y).toBeCloseTo(0, 3);
            expect(picture.z).toBeCloseTo(0, 3);

            let canvas = document.querySelector('#main-canvas');

            movePageHead(0, 0, -1)
            lookHead(0, 0, 0)
            // I don't know why but calling move twice causes the intersect to trigger.
            // Must be something that it causes to get set.
            pointermove(canvas.width / 2, canvas.height / 2);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 100, canvas.height / 2);
            pointerup(canvas.width / 2 - 100, canvas.height / 2);

            picture = testmodel().pictures[0];
            expect(picture.x).toBeCloseTo(0.18839, 3);
            expect(picture.y).toBeCloseTo(0, 3);
            expect(picture.z).toBeCloseTo(-0.0179069, 3);
        });
    });
});