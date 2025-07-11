import { cleanup, setup } from './test_utils/test_environment.js';

import { STORY_JSON_FILE, WORKSPACE_DATA_FILE } from '../js/constants.js';
import { Data } from '../js/data.js';
import { WorkspaceManager } from '../js/workspace_manager.js';
import { mockFileSystemDirectoryHandle } from './test_utils/mock_filesystem.js';

describe('Test WorkspaceManager', function () {
    beforeEach(async function () {
        await setup();
    });

    afterEach(async function () {
        await cleanup();
    })

    describe('test initialization', function () {
        it('should inialize without error', function () {
            let fileHandle = new mockFileSystemDirectoryHandle('test');
            let workspace = new WorkspaceManager(fileHandle);
            workspace.getStoryList();
        });

        it('should create its workspace file', function () {
            let dir = "" + Math.round(Math.random() * 10000);
            let fileHandle = new mockFileSystemDirectoryHandle(dir);
            let workspace = new WorkspaceManager(fileHandle);
            workspace.newStory('someId');
            expect(global.fileSystem[dir + "/workspace.json"]).toEqual(JSON.stringify({ "storyIds": ["someId"] }));
        });
    })

    describe('story read/write tests', function () {
        it('should write a story file', function () {
            let dir = "" + Math.round(Math.random() * 10000);
            let fileHandle = new mockFileSystemDirectoryHandle(dir);
            let workspace = new WorkspaceManager(fileHandle);
            let model = new Data.StoryModel();
            workspace.newStory(model.id);
            workspace.updateStory(model);
            expect(global.fileSystem[dir + "/" + WORKSPACE_DATA_FILE]).toEqual(JSON.stringify({ "storyIds": [model.id] }));
            expect(global.fileSystem[dir + "/" + model.id + "/" + STORY_JSON_FILE]).toEqual(JSON.stringify(model));
        });

        it('should get a list of stories', function () {
            let dir = "" + Math.round(Math.random() * 10000);
            let fileHandle = new mockFileSystemDirectoryHandle(dir);
            let workspace = new WorkspaceManager(fileHandle);
            let model = new Data.StoryModel();
            model.name = "Name1";
            workspace.newStory(model.id);
            workspace.updateStory(model);
            model = new Data.StoryModel();
            model.name = "Name2";
            workspace.newStory(model.id);
            workspace.updateStory(model);
            model = new Data.StoryModel();
            model.name = "Name3";
            workspace.newStory(model.id);
            workspace.updateStory(model);
            expect(JSON.parse(global.fileSystem[dir + "/" + WORKSPACE_DATA_FILE]).storyIds.length).toEqual(3);
            let list;
            workspace.getStoryList()
                .then(l => { list = l })
                .catch((e) => console.error(e));
            if (!list) console.error('failed to set the list, asyncronous problem!')

            expect(list.map(i => i.name)).toEqual(['Name1', 'Name2', 'Name3']);
        });
    });

});