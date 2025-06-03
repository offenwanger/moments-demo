
import { cleanup, setup } from './test_utils/test_environment.js';

import { BrushToolButtons, SurfaceToolButtons, ToolButtons } from '../js/constants.js';
import { Data } from '../js/data.js';
import { canvasClickMenuButton, canvaspointerdown, createAndOpenStoryMoment, ctrlZ, lookHead, movePageHead, pointermove, pointerup, testmodel } from './test_utils/test_actions.js';



describe('Test Photosphere Wrapper', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('canvas creation tests', function () {
        it('should create photosphere without crashing', function () {
            createAndOpenStoryMoment();
        });
    });

    describe('blur drawing tests', function () {
        it('should draw unblur', function () {
            createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);

            canvasClickMenuButton(ToolButtons.BRUSH);
            canvasClickMenuButton(BrushToolButtons.UNBLUR);

            let canvas = document.querySelector('#main-canvas');
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            pointermove(canvas.width / 2 - 20, canvas.height / 2);
            pointermove(canvas.width / 2 - 30, canvas.height / 2);
            pointerup(canvas.width / 2 - 30, canvas.height / 2);

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(1);

            let stroke = strokes[0];
            expect(stroke.points.length).toBe(4);
            expect(stroke.type).toBe(Data.StrokeType.FOCUS);
        });

        it('should draw color', function () {
            createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);

            canvasClickMenuButton(ToolButtons.BRUSH);
            canvasClickMenuButton(BrushToolButtons.COLOR);

            let canvas = document.querySelector('#main-canvas');
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            pointermove(canvas.width / 2 - 20, canvas.height / 2);
            pointermove(canvas.width / 2 - 30, canvas.height / 2);
            pointerup(canvas.width / 2 - 30, canvas.height / 2);

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(1);

            let stroke = strokes[0];
            expect(stroke.points.length).toBe(4);
            expect(stroke.type).toBe(Data.StrokeType.COLOR);
        });

        it('should clear blur and color', function () {
            createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);

            let canvas = document.querySelector('#main-canvas');
            canvasClickMenuButton(ToolButtons.BRUSH);
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);

            canvasClickMenuButton(BrushToolButtons.UNBLUR);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            pointermove(canvas.width / 2 - 20, canvas.height / 2);
            pointermove(canvas.width / 2 - 30, canvas.height / 2);
            pointerup(canvas.width / 2 - 30, canvas.height / 2);

            canvasClickMenuButton(BrushToolButtons.COLOR);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            pointermove(canvas.width / 2 - 20, canvas.height / 2);
            pointermove(canvas.width / 2 - 30, canvas.height / 2);
            pointerup(canvas.width / 2 - 30, canvas.height / 2);

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(2);

            canvasClickMenuButton(BrushToolButtons.CLEAR);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            pointermove(canvas.width / 2 - 20, canvas.height / 2);
            pointermove(canvas.width / 2 - 30, canvas.height / 2);
            pointerup(canvas.width / 2 - 30, canvas.height / 2);

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);
        });

        it('should undo clear and blur', function () {
            createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);

            let canvas = document.querySelector('#main-canvas');
            canvasClickMenuButton(ToolButtons.BRUSH);
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);

            canvasClickMenuButton(BrushToolButtons.UNBLUR);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            pointermove(canvas.width / 2 - 20, canvas.height / 2);
            pointermove(canvas.width / 2 - 30, canvas.height / 2);
            pointerup(canvas.width / 2 - 30, canvas.height / 2);

            canvasClickMenuButton(BrushToolButtons.COLOR);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            pointermove(canvas.width / 2 - 20, canvas.height / 2);
            pointermove(canvas.width / 2 - 30, canvas.height / 2);
            pointerup(canvas.width / 2 - 30, canvas.height / 2);

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(2);

            canvasClickMenuButton(BrushToolButtons.CLEAR);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            pointermove(canvas.width / 2 - 20, canvas.height / 2);
            pointermove(canvas.width / 2 - 30, canvas.height / 2);
            pointerup(canvas.width / 2 - 30, canvas.height / 2);

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);

            ctrlZ();

            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(2);

            ctrlZ();
            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(1);

            ctrlZ();
            strokes = testmodel().strokes.filter(s => s.photosphereId == photosphere.id);
            expect(strokes.length).toBe(0);
        });
    });

    describe('surface tests', function () {
        it('should flatten a section', function () {
            createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(0);

            let canvas = document.querySelector('#main-canvas');
            canvasClickMenuButton(ToolButtons.SURFACE);
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);

            canvasClickMenuButton(SurfaceToolButtons.FLATTEN);
            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            canvaspointerdown(canvas.width / 2 - 10, canvas.height / 2)
            pointermove(canvas.width / 2 - 10, canvas.height / 2);
            pointermove(canvas.width / 2 - 30, canvas.height / 2);
            pointermove(canvas.width / 2 - 30, canvas.height / 2 - 5);
            pointermove(canvas.width / 2 - 30, canvas.height / 2 - 30);
            pointermove(canvas.width / 2 - 10, canvas.height / 2 - 30);
            pointerup(canvas.width / 2 - 30, canvas.height / 2 - 30);

            surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(1);
            let areas = testmodel().areas.filter(a => a.photosphereSurfaceId == surfaces[0].id);
            expect(areas.length).toBe(1);
            expect(areas[0].points.length).toBe(8);
        });

        it('should flatten a simple shape across the seam', function () {
            createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(0);

            let canvas = document.querySelector('#main-canvas');
            canvasClickMenuButton(ToolButtons.SURFACE);
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);

            canvasClickMenuButton(SurfaceToolButtons.FLATTEN);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 + 30, canvas.height / 2 - 30);
            pointermove(canvas.width / 2 - 30, canvas.height / 2 - 30);
            pointermove(canvas.width / 2 - 30, canvas.height / 2 + 30);
            pointermove(canvas.width / 2 + 30, canvas.height / 2 + 30);
            pointerup(canvas.width / 2 + 30, canvas.height / 2 + 30);

            surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(1);
            let areas = testmodel().areas.filter(a => a.photosphereSurfaceId == surfaces[0].id);
            expect(areas.length).toBe(2);
            expect(areas[0].points.length).toBe(8);
            expect(areas[1].points.length).toBe(8);
        });

        it('should flatten a complex shape across the seam', function () {
            createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(0);

            let canvas = document.querySelector('#main-canvas');
            canvasClickMenuButton(ToolButtons.SURFACE);
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);

            canvasClickMenuButton(SurfaceToolButtons.FLATTEN);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    pointermove(
                        canvas.width / 2 + Math.cos(((2 * Math.PI) + 0.5) * -i / 10) * 200,
                        canvas.height / 2 + Math.sin(((2 * Math.PI) + 0.5) * -i / 10) * 200
                    );
                }
            }
            pointermove(canvas.width / 2, canvas.height / 2);
            pointerup(canvas.width / 2, canvas.height / 2);

            surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(1);

            let areas = testmodel().areas.filter(a => a.photosphereSurfaceId == surfaces[0].id);
            expect(areas.length).toBe(2);
            // 10 points plus 4 for the overlap = 14*2 = 28
            expect(areas[0].points.length).toBe(12);
            expect(areas[1].points.length).toBe(16);
        });

        it('should flatten the bottom pole', function () {
            createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(0);

            let canvas = document.querySelector('#main-canvas');
            canvasClickMenuButton(ToolButtons.SURFACE);
            movePageHead(0, 0, 0);
            lookHead(0, -1, 0);

            canvasClickMenuButton(SurfaceToolButtons.FLATTEN);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            pointermove(canvas.width / 2 + 30, canvas.height / 2 - 30);
            pointermove(canvas.width / 2 - 30, canvas.height / 2 - 30);
            pointermove(canvas.width / 2 - 30, canvas.height / 2 + 30);
            pointermove(canvas.width / 2 + 30, canvas.height / 2 + 30);
            pointerup(canvas.width / 2 + 30, canvas.height / 2 + 30);

            surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(1);
            let areas = testmodel().areas.filter(a => a.photosphereSurfaceId == surfaces[0].id);
            expect(areas.length).toBe(1);
            // four points plus the four for the edges and corners
            expect(areas[0].points.length).toBe(16);
        });


        it('should delete a surface', function () {
            createAndOpenStoryMoment();

            let photosphere = testmodel().photospheres[0];
            let surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(0);

            let canvas = document.querySelector('#main-canvas');
            canvasClickMenuButton(ToolButtons.SURFACE);
            movePageHead(0, 0, -1);
            lookHead(0, 0, 0);

            canvasClickMenuButton(SurfaceToolButtons.FLATTEN);
            pointermove(canvas.width / 2, canvas.height / 2);
            canvaspointerdown(canvas.width / 2, canvas.height / 2)
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    pointermove(
                        canvas.width / 2 + Math.cos(((2 * Math.PI) + 0.5) * -i / 10) * 50,
                        canvas.height / 2 + Math.sin(((2 * Math.PI) + 0.5) * -i / 10) * 50
                    );
                }
            }
            pointermove(canvas.width / 2, canvas.height / 2);
            pointerup(canvas.width / 2, canvas.height / 2);


            pointermove(canvas.width / 2 + 100, canvas.height / 2 + 100);
            canvaspointerdown(canvas.width / 2 + 100, canvas.height / 2 + 100)
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    pointermove(
                        canvas.width / 2 + Math.cos(((2 * Math.PI) + 0.5) * -i / 10) * 50 + 100,
                        canvas.height / 2 + Math.sin(((2 * Math.PI) + 0.5) * -i / 10) * 50 + 100
                    );
                }
            }
            pointermove(canvas.width / 2, canvas.height / 2 + 100);
            pointerup(canvas.width / 2, canvas.height / 2 + 100);

            surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(2);

            canvasClickMenuButton(SurfaceToolButtons.DELETE);
            pointermove(canvas.width / 2 + 100, canvas.height / 2 + 100);
            canvaspointerdown(canvas.width / 2 + 100, canvas.height / 2 + 100)
            pointerup(canvas.width / 2, canvas.height / 2 + 100);

            surfaces = testmodel().surfaces.filter(s => s.photosphereId == photosphere.id);
            expect(surfaces.length).toBe(1);
        });
    });

    describe('surface tests', function () {
        it('should scissors a section', function () {
            createAndOpenStoryMoment();

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

            expect(testmodel().poseableAssets.length).toBe(1);
        });
    });
});