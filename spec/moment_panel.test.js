
import { cleanup, setup } from './test_utils/test_environment.js';

import { clickButtonInput, createAndOpenStoryMoment, ctrlZ, testmodel } from './test_utils/test_actions.js';


describe('Test MomentPanel', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('init tests', function () {
        it('should open a moment', function () {
            createAndOpenStoryMoment();
        });
    });

    describe('delete tests', function () {
        it('should delete the moment', function () {
            createAndOpenStoryMoment();
            expect(testmodel().moments.length == 1);
            clickButtonInput('#moment-delete-button');
            expect(testmodel().moments.length == 0);
        });

        it('should undo the delete', function () {
            createAndOpenStoryMoment();
            expect(testmodel().moments.length == 1);
            clickButtonInput('#moment-delete-button');
            expect(testmodel().moments.length == 0);

            ctrlZ()
            expect(testmodel().moments.length == 1);
        });
    });
});