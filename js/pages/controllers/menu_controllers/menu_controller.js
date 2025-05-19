import * as ThreeMeshUI from 'three-mesh-ui';
import { AssetTypes, AttributeButtons, BrushToolButtons, BrushToolSettings, ItemButtons, MENU_WIDTH, MenuNavButtons, RecordToolButtons, SurfaceToolButtons, ToolButtons } from '../../../constants.js';
import { ToolState } from '../system_state.js';
import { ButtonMenu } from './button_menu.js';
import { MeshButton } from './mesh_button.js';
import { ColorUtil } from '../../../utils/color_util.js';

export function MenuController() {
    const BUTTON_SIZE = 0.4;
    const PADDING = 0.1

    let mToolState = new ToolState();

    let mMenuContainer = new ThreeMeshUI.Block({ backgroundOpacity: 0, });
    mMenuContainer.onAfterUpdate = function () {
        mMenuContainer.position.set(
            mMenuContainer.getWidth() / 2 + PADDING / 2,
            -mMenuContainer.getHeight() / 2 - PADDING / 2,
            0);
    }

    let mCurrentToolId = ToolButtons.MOVE;
    let mCurrentNavId = MenuNavButtons.MAIN_MENU;

    let mMenus = {};
    let mDisplayedMenus = []
    // All menus that have a back button require a parent link.
    let mParentLinks = {}

    // Dynamic menus
    let mImageSelectMenu = createSelectMenu('ImageSelectMenu');
    let mAudioSelectMenu = createSelectMenu('AudioSelectMenu');
    let mModelSelectMenu = createSelectMenu('ModelSelectMenu');
    let mMomentSelectMenu = createSelectMenu('MomentSelectMenu', 5);
    mMomentSelectMenu.add(new MeshButton(ItemButtons.NEW_MOMENT, '+', BUTTON_SIZE));

    /** Tool menu and tools settings menus **/
    mMenus[MenuNavButtons.TOOL_MENU] = createMenu(MenuNavButtons.TOOL_MENU, [
        new MeshButton(ToolButtons.MOVE, 'Move', BUTTON_SIZE),
        new MeshButton(ToolButtons.BRUSH, 'Brush', BUTTON_SIZE),
        new MeshButton(ToolButtons.SURFACE, 'Surface', BUTTON_SIZE),
        new MeshButton(ToolButtons.SCISSORS, 'Scissors', BUTTON_SIZE, 0xff0000),
        new MeshButton(ToolButtons.RECORD, 'Record', BUTTON_SIZE),
    ]);
    mMenus[ToolButtons.BRUSH] = createMenu(ToolButtons.BRUSH, [
        new MeshButton(BrushToolButtons.UNBLUR, 'Unblur', BUTTON_SIZE),
        new MeshButton(BrushToolButtons.COLOR, 'Draw', BUTTON_SIZE),
        new MeshButton(BrushToolButtons.CLEAR, 'Clear', BUTTON_SIZE),
    ]);
    mMenus[BrushToolButtons.UNBLUR] = createMenu(ToolButtons.BRUSH, [
        new MeshButton(BrushToolSettings.BIGGER, 'Bigger', BUTTON_SIZE),
        new MeshButton(BrushToolSettings.SMALLER, 'Draw', BUTTON_SIZE),
    ]);
    mMenus[BrushToolButtons.COLOR] = createMenu(ToolButtons.BRUSH, [
        new MeshButton(BrushToolSettings.HUE_INC, 'Color', BUTTON_SIZE),
        new MeshButton(BrushToolSettings.SAT_INC, 'Colorful', BUTTON_SIZE),
        new MeshButton(BrushToolSettings.LIGHT_INC, 'Lighter', BUTTON_SIZE),
        new MeshButton(BrushToolSettings.HUE_DEC, 'Color', BUTTON_SIZE),
        new MeshButton(BrushToolSettings.SAT_DEC, 'Muted', BUTTON_SIZE),
        new MeshButton(BrushToolSettings.LIGHT_DEC, 'Darker', BUTTON_SIZE),
        new MeshButton(BrushToolSettings.BIGGER, 'Bigger', BUTTON_SIZE),
        new MeshButton(BrushToolSettings.SMALLER, 'Smaller', BUTTON_SIZE),
    ]);
    mMenus[BrushToolButtons.CLEAR] = createMenu(ToolButtons.BRUSH, [
        new MeshButton(BrushToolSettings.BIGGER, 'Bigger', BUTTON_SIZE),
        new MeshButton(BrushToolSettings.SMALLER, 'Smaller', BUTTON_SIZE),
    ]);
    mMenus[ToolButtons.SURFACE] = createMenu(ToolButtons.SURFACE, [
        new MeshButton(SurfaceToolButtons.FLATTEN, 'Flatten', BUTTON_SIZE),
        new MeshButton(SurfaceToolButtons.PULL, 'Pull', BUTTON_SIZE),
        new MeshButton(SurfaceToolButtons.DELETE, 'Delete', BUTTON_SIZE),
    ]);
    mMenus[ToolButtons.RECORD] = createMenu(ToolButtons.RECORD, [
        new MeshButton(RecordToolButtons.REWIND, 'Rewind', BUTTON_SIZE),
        new MeshButton(RecordToolButtons.PLAYPAUSE, 'Play/Pause', BUTTON_SIZE),
        new MeshButton(RecordToolButtons.FORWARD, 'Forward', BUTTON_SIZE),
        new MeshButton(RecordToolButtons.ACCEPT, 'Accept', BUTTON_SIZE),
        new MeshButton(RecordToolButtons.DELETE, 'Delete', BUTTON_SIZE),
    ]);

    /** Settings, add menus, and misc functions **/
    mMenus[MenuNavButtons.MAIN_MENU] = createMenu(MenuNavButtons.MAIN_MENU, [
        new MeshButton(MenuNavButtons.ADD, 'Add', BUTTON_SIZE),
        new MeshButton(MenuNavButtons.SPHERE_SETTINGS, 'Sphere Settings', BUTTON_SIZE),
        new MeshButton(MenuNavButtons.SETTINGS, 'Settings', BUTTON_SIZE, 0xff0000),
        new MeshButton(ItemButtons.RECENTER, 'Recenter', BUTTON_SIZE, 0xff0000),
        new MeshButton(ItemButtons.UNDO, 'Undo', BUTTON_SIZE),
        new MeshButton(ItemButtons.REDO, 'Redo', BUTTON_SIZE),
    ]);
    mMenus[MenuNavButtons.SPHERE_SETTINGS] = createMenu(MenuNavButtons.SPHERE_SETTINGS, [
        new MeshButton(MenuNavButtons.BACK_BUTTON, 'Back', BUTTON_SIZE),
        new MeshButton(AttributeButtons.SPHERE_TOGGLE, 'Toggle Sphere', BUTTON_SIZE),
        new MeshButton(AttributeButtons.SPHERE_BLUR_TOGGLE, 'Toggle Blur', BUTTON_SIZE),
        new MeshButton(AttributeButtons.SPHERE_SCALE_UP, 'Scale Up', BUTTON_SIZE),
        new MeshButton(MenuNavButtons.SPHERE_IMAGE, 'Image', BUTTON_SIZE),
        new MeshButton(MenuNavButtons.SPHERE_COLOR, 'Color', BUTTON_SIZE, 0xff0000),
        new MeshButton(AttributeButtons.SPHERE_SCALE_DOWN, 'Scale Down', BUTTON_SIZE),
    ]);
    mParentLinks[MenuNavButtons.SPHERE_SETTINGS] = MenuNavButtons.MAIN_MENU;

    mMenus[MenuNavButtons.SPHERE_IMAGE] = mImageSelectMenu;
    mParentLinks[MenuNavButtons.SPHERE_IMAGE] = MenuNavButtons.SPHERE_SETTINGS;

    mMenus[MenuNavButtons.SETTINGS] = createMenu(MenuNavButtons.SETTINGS, [
        new MeshButton(MenuNavButtons.BACK_BUTTON, 'Back', BUTTON_SIZE),
    ]);
    mParentLinks[MenuNavButtons.SETTINGS] = MenuNavButtons.MAIN_MENU;

    mMenus[MenuNavButtons.ADD] = createMenu(MenuNavButtons.ADD, [
        new MeshButton(MenuNavButtons.BACK_BUTTON, 'Back', BUTTON_SIZE),
        new MeshButton(MenuNavButtons.ADD_AUDIO, 'Audio', BUTTON_SIZE),
        new MeshButton(MenuNavButtons.ADD_PICTURE, 'Picture', BUTTON_SIZE),
        new MeshButton(MenuNavButtons.ADD_MODEL, 'Model', BUTTON_SIZE),
        new MeshButton(MenuNavButtons.ADD_TELEPORT, 'Teleport', BUTTON_SIZE),
    ]);
    mParentLinks[MenuNavButtons.ADD] = MenuNavButtons.MAIN_MENU;

    mMenus[MenuNavButtons.ADD_AUDIO] = mAudioSelectMenu;
    mParentLinks[MenuNavButtons.ADD_AUDIO] = MenuNavButtons.ADD;

    mMenus[MenuNavButtons.ADD_PICTURE] = mImageSelectMenu;
    mParentLinks[MenuNavButtons.ADD_PICTURE] = MenuNavButtons.ADD;

    mMenus[MenuNavButtons.ADD_MODEL] = mModelSelectMenu;
    mParentLinks[MenuNavButtons.ADD_MODEL] = MenuNavButtons.ADD;

    mMenus[MenuNavButtons.ADD_TELEPORT] = mMomentSelectMenu;
    mParentLinks[MenuNavButtons.ADD_TELEPORT] = MenuNavButtons.ADD;

    function setContainer(container) {
        container.add(mMenuContainer);
    }

    function showMenu(menuId) {
        if (menuId == MenuNavButtons.PREVIOUS_BUTTON) {
            mMenus[mCurrentNavId].decrementItemOffset();
            return;
        }

        if (menuId == MenuNavButtons.NEXT_BUTTON) {
            mMenus[mCurrentNavId].incrementItemOffset();
            return;
        }

        if (menuId == MenuNavButtons.BACK_BUTTON) {
            menuId = mParentLinks[mCurrentNavId];
            if (!menuId) { console.error('No parent specified for ' + mCurrentNavId); return; }
        }

        mCurrentNavId = menuId;

        layoutMenu();
    }

    function setToolState(toolState) {
        // Highlight the right buttons
        mMenus[MenuNavButtons.TOOL_MENU].getButtons().find(b => b.getId() == mToolState.tool)?.deactivate();
        mMenus[ToolButtons.BRUSH].getButtons().find(b => b.getId() == mToolState.brushSettings.mode)?.deactivate();
        mMenus[ToolButtons.SURFACE].getButtons().find(b => b.getId() == mToolState.surfaceSettings.mode)?.deactivate();

        mToolState = toolState.clone();

        mMenus[MenuNavButtons.TOOL_MENU].getButtons().find(b => b.getId() == mToolState.tool)?.activate();
        mMenus[ToolButtons.BRUSH].getButtons().find(b => b.getId() == mToolState.brushSettings.mode)?.activate();
        mMenus[ToolButtons.SURFACE].getButtons().find(b => b.getId() == mToolState.surfaceSettings.mode)?.activate();

        layoutMenu();
    }

    function layoutMenu() {
        mMenuContainer.remove(...mDisplayedMenus.map(m => m.getObject()));

        mDisplayedMenus = [];
        mDisplayedMenus.push(mMenus[MenuNavButtons.TOOL_MENU])
        if (mMenus[mToolState.tool]) {
            mDisplayedMenus.push(mMenus[mToolState.tool])
        }
        if (mToolState.tool == ToolButtons.BRUSH) {
            mDisplayedMenus.push(mMenus[mToolState.brushSettings.mode])
            if (mToolState.brushSettings.mode == BrushToolButtons.COLOR) {
                updateColorPicker(mToolState);
            }
        }

        let navMenu = mMenus[mCurrentNavId];
        if (!navMenu) {
            console.error("No menu for " + menuId);
            mCurrentNavId = MenuNavButtons.MAIN_MENU
            navMenu = mMenus[MenuNavButtons.MAIN_MENU];
        }
        mDisplayedMenus.push(navMenu);

        mMenuContainer.add(...mDisplayedMenus.map(m => m.getObject()));
        mMenuContainer.update(true, true, true)
    }

    function updateColorPicker(toolState) {
        toolState.brushSettings.color;
        let buttons = mMenus[BrushToolButtons.COLOR].getButtons();
        buttons.find(b => b.getId() == BrushToolSettings.HUE_INC).setColor(ColorUtil.hueIncrement(toolState.brushSettings.color));
        buttons.find(b => b.getId() == BrushToolSettings.LIGHT_INC).setColor(ColorUtil.lightIncrement(toolState.brushSettings.color));
        buttons.find(b => b.getId() == BrushToolSettings.SAT_INC).setColor(ColorUtil.satIncrement(toolState.brushSettings.color));
        buttons.find(b => b.getId() == BrushToolSettings.HUE_DEC).setColor(ColorUtil.hueDecrement(toolState.brushSettings.color));
        buttons.find(b => b.getId() == BrushToolSettings.LIGHT_DEC).setColor(ColorUtil.lightDecrement(toolState.brushSettings.color));
        buttons.find(b => b.getId() == BrushToolSettings.SAT_DEC).setColor(ColorUtil.satDecrement(toolState.brushSettings.color));
    }

    async function updateModel(model, assetUtil) {
        // update the asset add menus.
        mImageSelectMenu.empty(true)
        mAudioSelectMenu.empty(true)
        mModelSelectMenu.empty(true)
        mMomentSelectMenu.empty(true)

        for (let asset of model.assets) {
            let menu;
            if (asset.type == AssetTypes.MODEL) {
                menu = mModelSelectMenu;
            } else if (asset.type == AssetTypes.IMAGE) {
                menu = mImageSelectMenu;
            } else if (asset.type == AssetTypes.AUDIO) {
                menu = mAudioSelectMenu;
            } else {
                console.error('Invalid type: ' + asset.type);
                continue;
            }
            let button = new MeshButton(asset.id, asset.name, BUTTON_SIZE, 0xffffff, true);
            menu.add(button);
        }

        for (let moment of model.moments) {
            let button = new MeshButton(moment.id, moment.name, BUTTON_SIZE, 0xffffff, true);
            mMomentSelectMenu.add(button);
        }

        mMenuContainer.update(true, true, true)
    }

    function render() {
        ThreeMeshUI.update();
    }

    function getTargets(raycaster, toolState) {
        for (let button of mDisplayedMenus.map(m => m.getButtons()).flat()) {
            const intersection = raycaster.intersectObject(button.getObject(), true);
            if (intersection[0]) {
                return [button.getTarget(intersection[0])]
            };
        }
        return [];
    }

    function createSelectMenu(id, paginate = 6) {
        return createMenu(id, [
            new MeshButton(MenuNavButtons.BACK_BUTTON, 'Back', BUTTON_SIZE),
            new MeshButton(MenuNavButtons.PREVIOUS_BUTTON, 'Prev', BUTTON_SIZE),
            new MeshButton(MenuNavButtons.NEXT_BUTTON, 'Next', BUTTON_SIZE),
        ], paginate);
    }

    function createMenu(id, buttons, paginate = 0) {
        let menu = new ButtonMenu(id, MENU_WIDTH, paginate);
        menu.add(...buttons);
        return menu;
    }

    this.setContainer = setContainer;
    this.setToolState = setToolState;
    this.updateModel = updateModel;
    this.showMenu = showMenu;
    this.getCurrentMenuId = () => mCurrentNavId;
    this.onToolChange = func => mToolChangeCallback = func;
    this.getMode = () => mToolState;
    this.render = render
    this.getTargets = getTargets;
}
