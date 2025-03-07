
import { cleanup, setup } from './test_utils/test_environment.js';

import { BrushToolButtons, ToolButtons } from '../js/constants.js';
import { canvasClickMenuButton, canvaspointerdown, createAndOpenStoryMoment, lookHead, movePageHead, pointermove, pointerup, testmodel } from './test_utils/test_actions.js';
import { Data } from '../js/data.js';



describe('Test Photosphere Wrapper', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('canvas creation tests', function () {
        it('should create photosphere without crashing', async function () {
            await createAndOpenStoryMoment();
        });
    });

    describe('blur drawing tests', function () {
        it('should draw unblur', async function () {
            await createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);

            await canvasClickMenuButton(ToolButtons.BRUSH);
            await canvasClickMenuButton(BrushToolButtons.UNBLUR);

            let canvas = document.querySelector('#main-canvas');
            await movePageHead(0, 0, -1);
            await lookHead(0, 0, 0);
            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 10, canvas.height / 2);
            await pointermove(canvas.width / 2 - 20, canvas.height / 2);
            await pointermove(canvas.width / 2 - 30, canvas.height / 2);
            await pointerup(canvas.width / 2 - 30, canvas.height / 2);

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(1);

            let stroke = strokes[0];
            expect(stroke.points.length).toBe(6);
            expect(stroke.type).toBe(Data.StrokeType.FOCUS);
        });

        it('should draw color', async function () {
            await createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);

            await canvasClickMenuButton(ToolButtons.BRUSH);
            await canvasClickMenuButton(BrushToolButtons.COLOR);

            let canvas = document.querySelector('#main-canvas');
            await movePageHead(0, 0, -1);
            await lookHead(0, 0, 0);
            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 10, canvas.height / 2);
            await pointermove(canvas.width / 2 - 20, canvas.height / 2);
            await pointermove(canvas.width / 2 - 30, canvas.height / 2);
            await pointerup(canvas.width / 2 - 30, canvas.height / 2);

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(1);

            let stroke = strokes[0];
            expect(stroke.points.length).toBe(6);
            expect(stroke.type).toBe(Data.StrokeType.COLOR);
        });

        it('should clear blur and color', async function () {
            await createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);

            let canvas = document.querySelector('#main-canvas');
            await canvasClickMenuButton(ToolButtons.BRUSH);
            await movePageHead(0, 0, -1);
            await lookHead(0, 0, 0);

            await canvasClickMenuButton(BrushToolButtons.UNBLUR);
            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 10, canvas.height / 2);
            await pointermove(canvas.width / 2 - 20, canvas.height / 2);
            await pointermove(canvas.width / 2 - 30, canvas.height / 2);
            await pointerup(canvas.width / 2 - 30, canvas.height / 2);

            await canvasClickMenuButton(BrushToolButtons.COLOR);
            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 10, canvas.height / 2);
            await pointermove(canvas.width / 2 - 20, canvas.height / 2);
            await pointermove(canvas.width / 2 - 30, canvas.height / 2);
            await pointerup(canvas.width / 2 - 30, canvas.height / 2);

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(2);

            await canvasClickMenuButton(BrushToolButtons.CLEAR);
            await pointermove(canvas.width / 2, canvas.height / 2);
            await canvaspointerdown(canvas.width / 2, canvas.height / 2)
            await pointermove(canvas.width / 2 - 10, canvas.height / 2);
            await pointermove(canvas.width / 2 - 20, canvas.height / 2);
            await pointermove(canvas.width / 2 - 30, canvas.height / 2);
            await pointerup(canvas.width / 2 - 30, canvas.height / 2);

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);

        });

    });



});