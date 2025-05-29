import * as THREE from 'three';

export const WORKSPACE_DATA_FILE = 'workspace.json';
export const STORY_JSON_FILE = 'story.json';
export const FILE_FOLDER = 'assets';

export const UP = new THREE.Vector3(0, 1, 0);

export const USER_HEIGHT = 1.6;
export const CAST_ONLY_LAYER = 4;

export const AssetTypes = {
    MODEL: 'model',
    IMAGE: 'image',
    AUDIO: 'audio',
}

export const AssetExtensions = {};
AssetExtensions[AssetTypes.MODEL] = '.glb'
AssetExtensions[AssetTypes.IMAGE] = '.png'

export const BOX_ASSET_PREFIXES = ['px_', 'nx_', 'py_', 'ny_', 'pz_', 'nz_'];

export const DOUBLE_CLICK_SPEED = 500;

export const ServerMessage = {
    CONNECTION_ID: 'connectionid',
    SHARED_STORIES: 'listofsharedstories',
    START_SHARE: 'startsharing',
    CONNECT_TO_STORY: 'connectingtostory',
    UPDATE_STORY: 'updatestory',
    UPDATE_PARTICIPANT: 'updateparticipant',
    NEW_ASSET: 'newasset',
    CREATE_MOMENT: 'createMoment',
    ERROR: 'error',
}

export const InteractionType = {
    BUTTON_CLICK: 'buttonClick',
    ONE_HAND_MOVE: 'oneHandMove',
    TWO_HAND_MOVE: 'twoHandMove',
    TWO_HAND_POSE: 'twoHandPose',
    BRUSHING: 'brushing',
    DELETING: 'deleting',
    RECORDING: 'recording',
    NONE: 'none'
}

export const RINGS = 32;
export const SEGMENTS = 64;
export const SPHERE_POINTS = SEGMENTS * RINGS * 6;

export const ToolButtons = {
    MOVE: 'move',
    BRUSH: 'brush',
    SURFACE: 'surface',
    SCISSORS: 'scissors',
    RECORD: 'record',
}

export const BrushToolButtons = {
    CLEAR: 'brushToolClear',
    UNBLUR: 'brushToolUnblur',
    COLOR: 'brushToolColor',
}

export const BrushToolSettings = {
    BIGGER: 'brushToolSettingsBigger',
    SMALLER: 'brushToolSettingsSmaller',
    HUE_INC: 'brushToolSettingsHueIncrement',
    HUE_DEC: 'brushToolSettingsHueDecrement',
    LIGHT_INC: 'brushToolSettingsLightIncrement',
    LIGHT_DEC: 'brushToolSettingsLightDecrement',
    SAT_INC: 'brushToolSettingsSatIncrement',
    SAT_DEC: 'brushToolSettingsSatDecrement',
}


export const SurfaceToolButtons = {
    PULL: 'surfaceToolPull',
    FLATTEN: 'surfaceToolFlatten',
    DELETE: 'surfaceToolDelete',
}

export const RecordToolButtons = {
    DISPLAY: 'recordToolDisplay',
    RECORD: 'recordToolRecord',
    PLAYPAUSE: 'recordToolPlaypause',
    ACCEPT: 'recordToolAccept',
    DELETE: 'recordToolDelete',
}

export const MenuNavButtons = {
    MAIN_MENU: 'mainMenu',
    TOOL_MENU: 'toolMenu',
    SPHERE_SETTINGS: 'sphereSettings',
    SETTINGS: 'settings',
    ADD: 'add',
    BACK_BUTTON: 'backButton',
    PREVIOUS_BUTTON: 'previousButton',
    NEXT_BUTTON: 'nextButton',
    SPHERE_IMAGE: 'chooseSphereImage',
    SPHERE_COLOR: 'chooseSphereColor',
    ADD_AUDIO: 'addAudio',
    ADD_PICTURE: 'addPicture',
    ADD_MODEL: 'addModel',
    ADD_TELEPORT: 'addTeleport',
}

export const ItemButtons = {
    RECENTER: 'recenter',
    NEW_MOMENT: 'newMoment',
    UNDO: 'undo',
    REDO: 'redo',
}

export const AttributeButtons = {
    SPHERE_TOGGLE: 'sphereToggle',
    SPHERE_BLUR_TOGGLE: 'sphereBlurToggle',
    SPHERE_SCALE_UP: 'increaseScale',
    SPHERE_SCALE_DOWN: 'decreaseScale',
}

export const TELEPORT_COMMAND = 'updateCurrentMoment'
export const CREATE_MODEL = 'createNewGLTFAtSpecificLocation'

export const MENU_WIDTH = 1.5;

export const THUMBNAIL_PREFIX = 'thumbnail_';
export const THUMBNAIL_SUFFIX = '.jpg';
export const THUMBNAIL_SIZE = 64;