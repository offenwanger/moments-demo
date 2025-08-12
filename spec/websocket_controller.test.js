
import { cleanup, setup } from './test_utils/test_environment.js';

import { ServerMessage } from '../js/constants.js';
import { ActionType } from '../js/utils/transaction_util.js';
import { websocketClientConnect } from './test_utils/mock_server.js';
import { clickButtonInput, createAndOpenStoryMoment, createAudioInCanvasEnvironment, createBasicStoryModel, enterInputValue, getInputValue, setupEnvironmentWith3DAsset, testmodel } from './test_utils/test_actions.js';


describe('Test WebSocketController', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('share tests', function () {
        it('should start share empty story without error', function () {
            websocketClientConnect()
            createAndOpenStoryMoment();
            clickButtonInput('#share-button');
            expect(document.querySelector('#share-button').textContent).toBe("Sharing!")
        });

        it('should share story with asset files', function () {
            websocketClientConnect()
            setupEnvironmentWith3DAsset('bonesAndMesh.glb');
            clickButtonInput('#share-button');
            expect(document.querySelector('#share-button').textContent).toBe("Sharing!")
            let uploads = Object.entries(global.fileSystem).filter(([filename, contents]) => !contents.isDir && filename.includes('/uploads'));
            expect(uploads.length).toBe(3);
            expect(uploads.map(([filename, c]) => filename.split('.')[1])).toEqual(['glb', 'jpg', 'jpg']);
            expect(global.endpoints.socketServerEndpoints['SENT_' + ServerMessage.SHARED_STORIES].length).toBe(1)
            expect(global.endpoints.socketServerEndpoints['SENT_' + ServerMessage.SHARED_STORIES][0].id).toBe(testmodel().id);
        });
    })

    describe('host tests', function () {
        it('should update shared story', function () {
            websocketClientConnect()
            setupEnvironmentWith3DAsset('bonesAndMesh.glb');
            clickButtonInput('#share-button');
            expect(document.querySelector('#share-button').textContent).toBe("Sharing!")
            let uploads = Object.entries(global.fileSystem).filter(([filename, contents]) => !contents.isDir && filename.includes('/uploads'));
            // one asset two thumbnails
            expect(uploads.length).toBe(3);
            expect(uploads.map(([filename, c]) => filename.split('.')[1])).toEqual(['glb', 'jpg', 'jpg']);
            expect(global.endpoints.socketServerEndpoints['SENT_' + ServerMessage.SHARED_STORIES].length).toBe(1)
            expect(global.endpoints.socketServerEndpoints['SENT_' + ServerMessage.SHARED_STORIES][0].id).toBe(testmodel().id);

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

            expect(getInputValue("#poseableAsset-name-input")).toBe('bonesAndMesh.glb');
            expect(testmodel().poseableAssets[0].name).toBe('bonesAndMesh.glb');
            enterInputValue("#poseableAsset-name-input", 'new name')
            expect(getInputValue("#poseableAsset-name-input")).toBe('new name');

            expect(shareListener.events.length).toBe(3)
            expect(shareListener.events[2].data.actions.length).toBe(1)
            expect(shareListener.events[2].data.actions[0].type).toBe(ActionType.UPDATE)
            expect(shareListener.events[2].data.actions[0].id).toBe(testmodel().poseableAssets[0].id)
            expect(shareListener.events[2].data.actions[0].params).toEqual({ name: 'new name' })
        });

        it('should upload a new audio', function () {
            websocketClientConnect()
            createAndOpenStoryMoment();

            clickButtonInput('#share-button');
            expect(document.querySelector('#share-button').textContent).toBe("Sharing!")

            let uploads = Object.entries(global.fileSystem)
                .filter(([filename, contents]) => !contents.isDir && filename.includes('/uploads'));
            // just the moment thumbnail
            expect(uploads.length).toBe(1);

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

            createAudioInCanvasEnvironment(0, 0, 0);

            uploads = Object.entries(global.fileSystem)
                .filter(([filename, contents]) => !contents.isDir);
            // TODO check this
            expect(uploads.map(([filename, c]) => filename.split('.')[1])).toEqual(['json', 'json', 'jpg', 'jpg', 'wav', 'jpg', 'jpg', 'wav']);
            expect(global.endpoints.socketServerEndpoints['SENT_' + ServerMessage.SHARED_STORIES].length).toBe(1)
            expect(global.endpoints.socketServerEndpoints['SENT_' + ServerMessage.SHARED_STORIES][0].id).toBe(testmodel().id);
        });
    });

    describe('remote tests', function () {
        it('should update remote story', function () {
            let story = createBasicStoryModel();
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
            shareListener.handlers[ServerMessage.START_SHARE](story);

            window.mainFunc();
            websocketClientConnect();
            let button = document.querySelector('#join-' + story.id);
            expect(Object.keys(button.eventListeners)).toEqual(['click']);
            button.eventListeners.click();
            window.mainFunc();
            clickButtonInput('#moment-button-' + story.moments[0].id);

            expect(getInputValue("#moment-name-input")).toBe('Moment');
            expect(story.moments[0].name).toBe('Moment');
            enterInputValue("#moment-name-input", 'new name')
            expect(getInputValue("#moment-name-input")).toBe('new name');

            expect(shareListener.events.length).toBe(3)
            expect(shareListener.events[2].data.actions.length).toBe(1)
            expect(shareListener.events[2].data.actions[0].type).toBe(ActionType.UPDATE)
            expect(shareListener.events[2].data.actions[0].id).toBe(story.moments[0].id)
            expect(shareListener.events[2].data.actions[0].params).toEqual({ name: 'new name' });
        });

        it('should upload remote audio', function () {
            let story = createBasicStoryModel();
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
            shareListener.handlers[ServerMessage.START_SHARE](story);

            window.mainFunc();
            websocketClientConnect();
            let button = document.querySelector('#join-' + story.id);
            expect(Object.keys(button.eventListeners)).toEqual(['click']);
            button.eventListeners.click();
            window.mainFunc();
            clickButtonInput('#moment-button-' + story.moments[0].id);

            createAudioInCanvasEnvironment(0, 0, 0);

            expect(shareListener.events.length).toBe(5)
            expect(shareListener.events.map(e => e.event)).toEqual(['listofsharedstories', 'startsharing', 'newasset', 'updatestory', 'updatestory']);
            expect(shareListener.events[2].data.name).toContain('wav')
            expect(shareListener.events[3].data.actions[0].type).toBe(ActionType.CREATE)
            expect(shareListener.events[4].data.actions[0].type).toBe(ActionType.CREATE)
        });

    });
});