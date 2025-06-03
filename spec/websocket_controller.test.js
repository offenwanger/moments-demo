
import { cleanup, setup } from './test_utils/test_environment.js';

import { clickButtonInput, createAndOpenStoryMoment } from './test_utils/test_actions.js';


describe('Test ListPage', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('share tests', function () {
        it('should start share without error', function () {
            createAndOpenStoryMoment();
            clickButtonInput('#share-button');
            expect(document.querySelector('#share-button').textContent).toBe("Sharing!")
        });
    });
});