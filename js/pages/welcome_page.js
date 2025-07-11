export function WelcomePage(parentContainer, lastFolder = false, mWebsocketController) {
    let mFolderSelectedCallback = () => { };
    let mLastFolderCallback = () => { };
    let mOpenRemoteStoryCallback = () => { };

    let div = document.createElement('div');
    div.style['padding'] = '10px';
    parentContainer.appendChild(div)

    div.appendChild(Object.assign(document.createElement('h1'),
        { innerHTML: '<h1>Welcome to Moments</h1>' }));
    div.appendChild(Object.assign(document.createElement('p'),
        { innerHTML: 'This is an in development application for exploring the possibilities for and of immersive narratives for people experienceing migration.' }));
    div.appendChild(Object.assign(document.createElement('p'),
        { innerHTML: 'Please choose a folder where the application can store the stories that you create.' }));

    let button = document.createElement('button');
    button.setAttribute('id', 'choose-folder-button');
    button.textContent = 'Choose Folder';
    button.addEventListener('click', () => {
        window.showDirectoryPicker()
            .then(folder => mFolderSelectedCallback(folder))
            .catch(e => { console.error(e); });
    });
    div.appendChild(button)

    if (lastFolder) {
        let button = document.createElement('button');
        button.setAttribute('id', 'use-last-folder-button');
        button.textContent = 'Use Last Folder';
        button.addEventListener('click', () => {
            mLastFolderCallback();
        });
        div.appendChild(button)
    }

    div.appendChild(Object.assign(document.createElement('h2'),
        { innerHTML: 'Shared Stories' }));

    let sharedList = document.createElement('div');
    div.appendChild(sharedList);

    mWebsocketController.onSharedStories((stories) => {
        sharedList.replaceChildren();
        for (let story of stories) {
            let li = document.createElement('li');
            li.setAttribute('id', story.id)
            sharedList.appendChild(li);

            li.appendChild(Object.assign(document.createElement('span'), { innerHTML: story.name }));

            let button = document.createElement('button')
            button.setAttribute('id', 'join-' + story.id)
            button.style['margin-left'] = '10px'
            button.textContent = '👀';
            button.addEventListener('click', () => mOpenRemoteStoryCallback(story.id));
            li.appendChild(button)
        }
    });

    this.onFolderSelected = (func) => mFolderSelectedCallback = func;
    this.onLastFolder = (func) => mLastFolderCallback = func;
    this.onOpenRemoteStory = (func) => mOpenRemoteStoryCallback = func;
}