
import { cleanup, setup } from './test_utils/test_environment.js';

import { canvaspointerdown, createAndOpenStoryMoment, createAudioInCanvasEnvironment, lookHead, movePageHead, pointermove, pointerup, setupEnvironmentWith3DAsset, setupEnvironmentWithPicture, testmodel } from './test_utils/test_actions.js';



describe('Test Audio Wrapper', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('canvas creation tests', function () {
        it('should create audio without crashing', async function () {
            await createAndOpenStoryMoment();
            await createAudioInCanvasEnvironment();
        });
    });

    describe('canvas drag tests', function () {
        it('should drag audio', async function () {
            await createAndOpenStoryMoment();
            await createAudioInCanvasEnvironment();

            let audio = testmodel().audios[0];
            expect(audio.x).toBeCloseTo(0, 3);
            expect(audio.y).toBeCloseTo(0, 3);
            expect(audio.z).toBeCloseTo(0, 3);
            expect(audio.attachedId).toBeNull();

            let canvas = document.querySelector('#main-canvas');
            await movePageHead(0, 0, -1);
            await lookHead(0, 0, 0);
            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 100, canvas.height / 2);
            await pointerup(canvas.width / 2 - 100, canvas.height / 2);

            audio = testmodel().audios[0];
            expect(audio.x).toBeCloseTo(0.18839, 3);
            expect(audio.y).toBeCloseTo(0, 3);
            expect(audio.z).toBeCloseTo(-0.0179069, 3);
            expect(audio.attachedId).toBeNull();
        });

        it('should create and drag audio and add to picture', async function () {
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

            await createAudioInCanvasEnvironment();

            let audio = testmodel().audios[0];
            expect(audio.x).toBeCloseTo(0, 3);
            expect(audio.y).toBeCloseTo(0, 3);
            expect(audio.z).toBeCloseTo(0, 3);
            expect(audio.attachedId).toBeNull();

            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 100, canvas.height / 2);
            await pointerup(canvas.width / 2 - 100, canvas.height / 2);

            audio = testmodel().audios[0];
            expect(audio.attachedId).toBe(testmodel().pictures[0].id);
        });


        it('should create and drag audio and add to model', async function () {
            await setupEnvironmentWith3DAsset('oneMeshAt0.glb');
            let poseable = testmodel().poseableAssets[0];
            let mesh = testmodel().assetPoses.find(a => a.parentId == poseable.id);

            expect(mesh.x).toBeCloseTo(0, 3);
            expect(mesh.y).toBeCloseTo(0, 3);
            expect(mesh.z).toBeCloseTo(0, 3);

            let canvas = document.querySelector('#main-canvas');
            await movePageHead(0, 0, -3);
            await lookHead(0, 0, 0);
            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 300, canvas.height / 2);
            await pointerup(canvas.width / 2 - 300, canvas.height / 2);

            mesh = testmodel().assetPoses.find(a => a.parentId == poseable.id);
            expect(mesh.x).toBeCloseTo(1.49638, 3);
            expect(mesh.y).toBeCloseTo(0, 3);
            expect(mesh.z).toBeCloseTo(-0.39983, 3);

            await createAudioInCanvasEnvironment();

            let audio = testmodel().audios[0];
            expect(audio.x).toBeCloseTo(0, 3);
            expect(audio.y).toBeCloseTo(0, 3);
            expect(audio.z).toBeCloseTo(0, 3);
            expect(audio.attachedId).toBeNull();

            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 300, canvas.height / 2);
            await pointerup(canvas.width / 2 - 300, canvas.height / 2);

            audio = testmodel().audios[0];
            expect(audio.attachedId).toBe(mesh.id);
        });

    });



});