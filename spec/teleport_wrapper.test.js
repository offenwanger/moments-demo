
import { cleanup, setup } from './test_utils/test_environment.js';

import { AssetTypes, MenuNavButtons } from '../js/constants.js';
import { addPictureAsset, canvasClickMenuButton, canvaspointerdown, clickButtonInput, createAndOpenStoryMoment, lookHead, movePageHead, pointermove, pointerup, setupEnvironmentWith3DAsset, testmodel } from './test_utils/test_actions.js';



describe('Test Teleport Wrapper', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('canvas creation tests', function () {
        it('should create teleport without crashing', function () {
            createAndOpenStoryMoment();

            let momentId = testmodel().moments[0].id;
            canvasClickMenuButton(MenuNavButtons.ADD);
            canvasClickMenuButton(MenuNavButtons.ADD_TELEPORT);
            canvasClickMenuButton(momentId);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);

            expect(testmodel().teleports.length).toBe(1);
        });
    });

    describe('canvas drag tests', function () {
        it('should drag teleport', function () {
            createAndOpenStoryMoment();

            movePageHead(0, 0, 0.5);
            let momentId = testmodel().moments[0].id;
            canvasClickMenuButton(MenuNavButtons.ADD);
            canvasClickMenuButton(MenuNavButtons.ADD_TELEPORT);
            canvasClickMenuButton(momentId);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);

            let teleport = testmodel().teleports[0];
            expect(teleport.x).toBeCloseTo(0, 3);
            expect(teleport.y).toBeCloseTo(0, 3);
            expect(teleport.z).toBeCloseTo(0, 3);
            expect(teleport.attachedId).toBeNull();

            let canvas = document.querySelector('#main-canvas');
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);
            // I don't know why but calling move twice causes the intersect to trigger.
            // Must be something that it causes to get set.
            pointermove(canvas.width / 2, canvas.height / 2);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 100, canvas.height / 2);
            pointerup(canvas.width / 2 - 100, canvas.height / 2);

            teleport = testmodel().teleports[0];
            expect(teleport.x).toBeCloseTo(0.18839, 3);
            expect(teleport.y).toBeCloseTo(0, 3);
            expect(teleport.z).toBeCloseTo(-0.0179069, 3);
            expect(teleport.attachedId).toBeNull();
        });

        it('should create and drag teleport and add to picture', function () {
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
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);
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

            movePageHead(0, 0, -0.5);
            lookHead(0, 0, 0);
            let momentId = testmodel().moments[0].id;
            canvasClickMenuButton(MenuNavButtons.ADD);
            canvasClickMenuButton(MenuNavButtons.ADD_TELEPORT);
            canvasClickMenuButton(momentId);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);

            let teleport = testmodel().teleports[0];
            expect(teleport.x).toBeCloseTo(0, 3);
            expect(teleport.y).toBeCloseTo(0, 3);
            expect(teleport.z).toBeCloseTo(0, 3);
            expect(teleport.attachedId).toBeNull();

            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);
            // I don't know why but calling move twice causes the intersect to trigger.
            // Must be something that it causes to get set.
            pointermove(canvas.width / 2, canvas.height / 2);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 100, canvas.height / 2);
            pointerup(canvas.width / 2 - 100, canvas.height / 2);

            teleport = testmodel().teleports[0];
            expect(teleport.attachedId).toBe(testmodel().pictures[0].id);
        });


        it('should create and drag teleport and add to model', function () {
            setupEnvironmentWith3DAsset('oneMeshAt0.glb');
            let poseable = testmodel().poseableAssets[0];
            let mesh = testmodel().assetPoses.find(a => a.parentId == poseable.id);

            expect(mesh.x).toBeCloseTo(0, 3);
            expect(mesh.y).toBeCloseTo(0, 3);
            expect(mesh.z).toBeCloseTo(0, 3);

            let canvas = document.querySelector('#main-canvas');
            movePageHead(0, 0, -3);
            lookHead(0, 0, 0);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 300, canvas.height / 2);
            pointerup(canvas.width / 2 - 300, canvas.height / 2);

            mesh = testmodel().assetPoses.find(a => a.parentId == poseable.id);
            expect(mesh.x).toBeCloseTo(1.49638, 3);
            expect(mesh.y).toBeCloseTo(0, 3);
            expect(mesh.z).toBeCloseTo(-0.39983, 3);

            movePageHead(0, 0, 0.5);
            lookHead(0, 0, -1);
            let momentId = testmodel().moments[0].id;
            canvasClickMenuButton(MenuNavButtons.ADD);
            canvasClickMenuButton(MenuNavButtons.ADD_TELEPORT);
            canvasClickMenuButton(momentId);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);
            canvasClickMenuButton(MenuNavButtons.BACK_BUTTON);

            let teleport = testmodel().teleports[0];
            expect(teleport.x).toBeCloseTo(0, 3);
            expect(teleport.y).toBeCloseTo(0, 3);
            expect(teleport.z).toBeCloseTo(0, 3);
            expect(teleport.attachedId).toBeNull();

            movePageHead(0, 0, -3);
            lookHead(0, 0, 0);
            // I don't know why but calling move twice causes the intersect to trigger.
            // Must be something that it causes to get set.
            pointermove(canvas.width / 2, canvas.height / 2);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 300, canvas.height / 2);
            pointerup(canvas.width / 2 - 300, canvas.height / 2);

            teleport = testmodel().teleports[0];
            expect(teleport.attachedId).toBe(mesh.id);
        });

    });



});