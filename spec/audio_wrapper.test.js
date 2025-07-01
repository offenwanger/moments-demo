
import { cleanup, setup } from './test_utils/test_environment.js';

import { AssetTypes, MenuNavButtons } from '../js/constants.js';
import { addPictureAsset, canvasClickMenuButton, canvaspointerdown, clickButtonInput, createAndOpenStoryMoment, createAudioInCanvasEnvironment, lookHead, movePageHead, pointermove, pointerup, setupEnvironmentWith3DAsset, testmodel } from './test_utils/test_actions.js';



describe('Test Audio Wrapper', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('canvas creation tests', function () {
        it('should create audio without crashing', function () {
            createAndOpenStoryMoment();
            createAudioInCanvasEnvironment(0, 0, 0);
        });
    });

    describe('canvas drag tests', function () {
        it('should drag audio', function () {
            createAndOpenStoryMoment();
            createAudioInCanvasEnvironment(0, 0, 0);

            let audio = testmodel().audios[0];
            expect(audio.x).toBeCloseTo(0, 3);
            expect(audio.y).toBeCloseTo(0, 3);
            expect(audio.z).toBeCloseTo(0, 3);
            expect(audio.attachedId).toBeNull();

            let canvas = document.querySelector('#main-canvas');
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);
            pointermove(canvas.width / 2, canvas.height / 2);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 100, canvas.height / 2);
            pointerup(canvas.width / 2 - 100, canvas.height / 2);

            audio = testmodel().audios[0];
            expect(audio.x).toBeCloseTo(0.18839, 3);
            expect(audio.y).toBeCloseTo(0, 3);
            expect(audio.z).toBeCloseTo(-0.0179069, 3);
            expect(audio.attachedId).toBeNull();
        });

        it('should create and drag audio and add to picture', function () {
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
            lookHead(0, 0, 1)
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

            createAudioInCanvasEnvironment(0, 0, 0);

            let audio = testmodel().audios[0];
            expect(audio.x).toBeCloseTo(0, 3);
            expect(audio.y).toBeCloseTo(0, 3);
            expect(audio.z).toBeCloseTo(0, 3);
            expect(audio.attachedId).toBeNull();

            movePageHead(0, 0, -1)
            lookHead(0, 0, 1)
            // I don't know why but calling move twice causes the intersect to trigger.
            // Must be something that it causes to get set.
            pointermove(canvas.width / 2, canvas.height / 2);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 100, canvas.height / 2);
            pointerup(canvas.width / 2 - 100, canvas.height / 2);

            audio = testmodel().audios[0];
            expect(audio.attachedId).toBe(testmodel().pictures[0].id);
        });


        it('should create and drag audio and add to model', function () {
            setupEnvironmentWith3DAsset('oneMeshAt0.glb');
            let poseable = testmodel().poseableAssets[0];
            let mesh = testmodel().assetPoses.find(a => a.parentId == poseable.id);

            expect(mesh.x).toBeCloseTo(0, 3);
            expect(mesh.y).toBeCloseTo(0, 3);
            expect(mesh.z).toBeCloseTo(0, 3);

            let canvas = document.querySelector('#main-canvas');
            // I don't know why but calling move twice causes the intersect to trigger.
            // Must be something that it causes to get set.
            pointermove(canvas.width / 2, canvas.height / 2);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 300, canvas.height / 2);
            pointerup(canvas.width / 2 - 300, canvas.height / 2);

            mesh = testmodel().assetPoses.find(a => a.parentId == poseable.id);
            expect(mesh.x).toBeCloseTo(0, 3);
            expect(mesh.y).toBeCloseTo(0, 3);
            expect(mesh.z).toBeCloseTo(0, 3);

            createAudioInCanvasEnvironment(0, 0, 0);

            let audio = testmodel().audios[0];
            expect(audio.x).toBeCloseTo(0, 3);
            expect(audio.y).toBeCloseTo(0, 3);
            expect(audio.z).toBeCloseTo(0, 3);
            expect(audio.attachedId).toBeNull();

            // I don't know why but calling move twice causes the intersect to trigger.
            // Must be something that it causes to get set.
            pointermove(canvas.width / 2, canvas.height / 2);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 300, canvas.height / 2);
            pointerup(canvas.width / 2 - 300, canvas.height / 2);

            audio = testmodel().audios[0];
            expect(audio.attachedId).toBe(mesh.id);
        });

    });



});