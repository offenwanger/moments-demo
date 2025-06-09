import { cleanup, setup } from './test_utils/test_environment.js';

import { chooseFolder, testmodel } from './test_utils/test_actions.js';

describe('Test ListPage', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('init tests', function () {
        it('should create a story', function () {
            expect(Object.entries(global.fileSystem).filter(([filename, data]) => !data.isDir)).toEqual([])
            chooseFolder();
            document.querySelector('#new-story-button').eventListeners.click();
            expect(Object.keys(global.fileSystem)).toContain('test/workspace.json')
            expect(Object.keys(global.fileSystem).some(k => k.startsWith("test/Story_")))
        });
    });

    describe('init tests', function () {
        it('should open a story', function () {
            expect(Object.entries(global.fileSystem).filter(([filename, data]) => !data.isDir)).toEqual([])
            chooseFolder();
            document.querySelector('#new-story-button').eventListeners.click();
            expect(Object.keys(global.fileSystem)).toContain('test/workspace.json')
            expect(Object.keys(global.fileSystem).some(k => k.startsWith("test/Story_")))
            document.querySelector('#edit-' + testmodel().id).eventListeners.click();
            expect(window.location.href.includes("story="));
        });
    });
});