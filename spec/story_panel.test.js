
import { cleanup, setup } from './test_utils/test_environment.js';

import { clickButtonInput, createAndOpenStoryMoment, testmodel } from './test_utils/test_actions.js';


describe('Test StoryPanel', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('init tests', function () {
        it('should open a story', async function () {
            await createAndOpenStoryMoment();
        });
    });

    describe('add tests', function () {
        it('should add a moment', async function () {
            await createAndOpenStoryMoment();
            expect(testmodel().moments.length == 1);
            await clickButtonInput('#story-moment-add-button');
            expect(testmodel().moments.length == 2);
        });
    });
});