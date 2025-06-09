
import { mockFileSystemDirectoryHandle } from './mock_filesystem.js';
import { clearPromises } from './mock_promise.js';
import { clickButtonInput, testmodel } from './test_actions.js';

export async function createAndOpenStoryMomentAsync() {
    window.directories.push(new mockFileSystemDirectoryHandle('test'));
    document.querySelector('#choose-folder-button').eventListeners.click();
    await clearPromises();
    window.mainFunc();
    await clearPromises();
    document.querySelector('#new-story-button').eventListeners.click();
    await clearPromises();
    document.querySelector('#edit-' + testmodel().id).eventListeners.click();
    await clearPromises();
    window.mainFunc();
    await clearPromises();
    expect(testmodel().moments.length).toBe(1);
    clickButtonInput('#moment-button-' + testmodel().moments[0].id);
    await clearPromises();
    global.test_rendererAccess.animationLoop();
    await clearPromises();
}
