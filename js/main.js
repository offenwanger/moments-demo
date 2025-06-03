import { WebsocketController } from './pages/controllers/websocket_controller.js';
import { EditorPage } from './pages/editor_page.js';
import { ListPage } from './pages/list_page.js';
import { WelcomePage } from './pages/welcome_page.js';
import { HandleStorage } from './utils/handle_storage.js';
import { UrlUtil } from './utils/url_util.js';
import { WorkspaceManager } from './workspace_manager.js';

export function main() {
    let mWebsocketController = new WebsocketController();

    function updatePage() {
        document.querySelector('#content').replaceChildren();

        if (UrlUtil.getParam("story") && UrlUtil.getParam("remote") == 'true') {
            // attempt to connect to the remote story
            showEditorPage()
            return;
        }

        let folder;
        HandleStorage.getItem('folder')
            .then(f => { folder = f; })
            .then(() => !folder ?
                false :
                folder.queryPermission({ mode: 'readwrite' })
                    .then(p => p !== 'granted'))
            .then(missingPermissions => {
                if (!folder) {
                    showWelcomePage(false);
                } else {
                    if (missingPermissions) {
                        showWelcomePage(true);
                    } else if (UrlUtil.getParam("story")) {
                        // we have a folder, permissions, and a story id, show it. 
                        let workspaceManager = new WorkspaceManager(folder);
                        showEditorPage(workspaceManager)
                    } else if (UrlUtil.getParam("list") == 'true') {
                        // no story, but we want to show the list!
                        let workspaceManager = new WorkspaceManager(folder);
                        showListPage(workspaceManager);
                    } else {
                        // Default to the welcome page.
                        showWelcomePage(true);
                    }
                }
            })
    }

    function showWelcomePage(withLastFolder) {
        let page = new WelcomePage(document.querySelector('#content'), withLastFolder, mWebsocketController);
        page.onFolderSelected((folder) => {
            folder.requestPermission({ mode: 'readwrite' })
                .then(permission => {
                    if (permission === 'granted') {
                        return HandleStorage.setItem('folder', folder);
                    }
                })
                .then(() => UrlUtil.navigate({ list: 'true' }))
        });

        page.onLastFolder(() => {
            HandleStorage.getItem('folder')
                .then(folder => folder.requestPermission({ mode: 'readwrite' }))
                .then(permission => {
                    if (permission !== 'granted') {
                        HandleStorage.removeItem('folder');
                    }
                    UrlUtil.navigate({ list: 'true' });
                });
        });

        page.onOpenRemoteStory((storyId) => {
            UrlUtil.navigate({ remote: 'true', story: storyId });
        });
    }

    function showListPage(workspaceManger) {
        let page = new ListPage(document.querySelector('#content'));
        page.setEditCallback((storyId) => {
            UrlUtil.navigate({ story: storyId });
        });
        page.show(workspaceManger)
    }

    function showEditorPage(workspaceManger) {
        let page = new EditorPage(document.querySelector('#content'), mWebsocketController);
        page.show(workspaceManger);
    }

    updatePage();
};