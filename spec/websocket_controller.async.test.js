
import { cleanup, setup } from './test_utils/test_environment.js';

import { ServerMessage, ToolButtons } from '../js/constants.js';
import { clearPromises } from './test_utils/mock_promise.js';
import { websocketClientConnect } from './test_utils/mock_server.js';
import { canvasClickMenuButton, canvaspointerdown, clickButtonInput, lookHead, movePageHead, pointermove, pointerup, testmodel } from './test_utils/test_actions.js';
import { createAndOpenStoryMomentAsync } from './test_utils/test_actions_async.js';


describe('Test WebSocketController', function () {
    beforeEach(async function () {
        await setup(true);
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('async host tests', function () {
        it('should upload a new glb', async function () {
            websocketClientConnect()
            await createAndOpenStoryMomentAsync();

            clickButtonInput('#share-button');
            await clearPromises();

            expect(document.querySelector('#share-button').textContent).toBe("Sharing!")
            let uploads = Object.entries(global.fileSystem)
                .filter(([filename, contents]) => !contents.isDir && filename.includes('/uploads'));
            expect(uploads.length).toBe(0);

            let shareListener = {
                handlers: {},
                events: [],
                on: function (event, handler) {
                    this.handlers[event] = handler;
                },
                emit: function (event, data) {
                    this.events.push({ event, data });
                },
            };
            global.endpoints.socketServerEndpoints.connection(shareListener);
            shareListener.handlers[ServerMessage.CONNECTION_ID]({});
            shareListener.handlers[ServerMessage.CONNECT_TO_STORY](testmodel().id);
            await clearPromises();

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
            await clearPromises();

            uploads = Object.entries(global.fileSystem)
                .filter(([filename, contents]) => !contents.isDir);
            expect(uploads.map(([filename, c]) => filename.split('.')[1])).toEqual(['json', 'json', 'glb', 'jpg']);
            expect(global.endpoints.socketServerEndpoints['SENT_' + ServerMessage.SHARED_STORIES].length).toBe(1)
            expect(global.endpoints.socketServerEndpoints['SENT_' + ServerMessage.SHARED_STORIES][0].id).toBe(testmodel().id);

            await clearPromises();
        });
    });
});