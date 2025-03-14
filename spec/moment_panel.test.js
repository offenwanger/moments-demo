
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
        it('should open a moment', async function () {
            await createAndOpenStoryMoment();
        });
    });

    describe('delete tests', function () {
        it('should delete the moment', async function () {
            await createAndOpenStoryMoment();
            expect(testmodel().moments.length == 1);
            await clickButtonInput('#moment-delete-button');
            expect(testmodel().moments.length == 0);
        });

        it('should undo the delete', async function () {
            await createAndOpenStoryMoment();
            expect(testmodel().moments.length == 1);
            await clickButtonInput('#moment-delete-button');
            expect(testmodel().moments.length == 0);

            await ctrlZ()
            expect(testmodel().moments.length == 1);
        });
    });
});