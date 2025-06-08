import { Data } from "../data.js";
import { DataUtil } from "../utils/data_util.js";

export function ListPage(parentContainer) {
    let mEditCallback = () => { };

    let mWorkspace;
    let mStories = null;

    let h3 = document.createElement('h3');
    h3.textContent = "Stories";
    h3.style['margin'] = '10px';
    parentContainer.appendChild(h3);

    let mList = document.createElement('ul');
    parentContainer.appendChild(mList)

    let mNewStoryButton = document.createElement('button')
    mNewStoryButton.setAttribute('id', 'new-story-button')
    mNewStoryButton.style['margin-left'] = "40px";
    mNewStoryButton.textContent = "New Story";
    mNewStoryButton.addEventListener('click', () => {
        if (!mWorkspace) { console.error('Workspace needed.'); return; }
        let newStory = new Data.StoryModel();
        if (Array.isArray(mStories)) {
            newStory.name = DataUtil.getNextName('Story', mStories.map(s => s.name))
            mWorkspace.newStory(newStory.id)
                .then(() => mWorkspace.updateStory(newStory))
                // refresh
                .then(() => show(mWorkspace));
        } else {
            console.error('Stories not loaded');
        }
    });
    parentContainer.appendChild(mNewStoryButton)

    let mImportStoryButton = document.createElement('button')
    mImportStoryButton.setAttribute('id', 'import-story-button')
    mImportStoryButton.style['margin-left'] = "40px";
    mImportStoryButton.textContent = "Import Story"
    mImportStoryButton.addEventListener('click', () => {
        window.showOpenFilePicker()
            .then(fileHandles => fileHandles[0].getFile())
            .then(file => mWorkspace.loadStory(file))
            .then(() => show(mWorkspace))
            .catch(e => console.error(e));
    });
    parentContainer.appendChild(mImportStoryButton)

    function show(workspace) {
        mWorkspace = workspace;
        mWorkspace.getStoryList()
            .then(stories => {
                mStories = stories;
                mList.replaceChildren();
                stories.forEach(story => {
                    let li = document.createElement('li');
                    li.setAttribute('id', story.id)
                    mList.appendChild(li);

                    li.appendChild(Object.assign(document.createElement('span'), { innerHTML: story.name }));

                    let button = document.createElement('button')
                    button.setAttribute('id', 'edit-' + story.id)
                    button.style['margin-left'] = '10px'
                    button.textContent = '✏️';
                    button.addEventListener('click', () => mEditCallback(story.id));
                    li.appendChild(button)

                    button = document.createElement('button')
                    button.textContent = '🔽'
                    button.setAttribute('id', 'download-' + story.id)
                    button.style['margin-left'] = '10px';
                    button.addEventListener('click', () => mWorkspace.packageStory(story.id));
                    li.appendChild(button)

                    button = document.createElement('button')
                    button.textContent = '❌'
                    button.setAttribute('id', 'delete-' + story.id);
                    button.style['margin-left'] = '10px';
                    button.addEventListener('click', () => {
                        if (confirm('Deleting "' + story.name + '", this cannot be undone, are you sure?') == true) {
                            try {
                                mList.removeChild(li);
                                mWorkspace.deleteStory(story.id);
                            } catch (error) {
                                console.error(error);
                            }
                            show(mWorkspace);
                        }
                    });
                    li.appendChild(button)
                });
            }).catch(e => {
                console.error(e);
                console.error('Failed to initialize list.')
            });
    }

    this.show = show;
    this.setViewCallback = (func) => mViewCallback = func;
    this.setEditCallback = (func) => mEditCallback = func;
    this.setPackageCallback = (func) => mPackageCallback = func;
}