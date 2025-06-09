import * as THREE from 'three';
import * as ThreeMeshUI from 'three-mesh-ui';
import { InteractionTargetInterface } from '../../scene_objects/interaction_target_interface.js';

export function MeshButton(id, label, size, color = null, dynamic = false) {
    let mDynamic = dynamic;
    const mButton = new ThreeMeshUI.Block({
        padding: 0.05,
        width: size,
        height: size,
        justifyContent: 'center',
        offset: 0.05,
        margin: 0.02,
        borderRadius: 0.075,
        borderWidth: 0.01,
        borderColor: new THREE.Color(1, 1, 1),
        borderOpacity: 0,
    });
    mButton.userData.id = id;

    let mText = new ThreeMeshUI.Text({
        content: label,
        fontSize: 0.055
    })
    mButton.add(mText);

    const mInteractionTarget = createTarget();

    function setColor(hex) {
        mButton.set({
            backgroundColor: new THREE.Color(hex),
            fontColor: new THREE.Color(color ? color : '#FFFFFF')
        })
    }
    setColor('#555555')

    function setImage(image, hideText = true) {
        if (!image) return;
        new THREE.TextureLoader().load(image, (texture) => {
            mButton.set({ backgroundTexture: texture, backgroundColor: null });
            if (hideText) { mText.set({ content: '' }); }
        });
    }

    function setText(text) {
        mText.set({ content: text });
    }

    mButton.setupState({
        state: 'idle',
        attributes: {
            offset: 0.035,
            backgroundOpacity: 0.3,
        },
    });

    mButton.setupState({
        state: 'highlight',
        attributes: {
            offset: 0.035,
            backgroundOpacity: 1,
        },
    });

    mButton.setupState({
        state: 'selected',
        attributes: {
            offset: 0.02,
            backgroundOpacity: 0.9,
        }
    });

    mButton.setState('idle')

    function getTarget(intersection) {
        mInteractionTarget.getIntersection = () => intersection;
        return mInteractionTarget;
    }

    function createTarget() {
        let target = new InteractionTargetInterface();
        target.isButton = () => true;
        target.getId = () => id;
        target.highlight = (toolState) => { mButton.setState('highlight') }
        target.select = (toolState) => { mButton.setState('selected') }
        target.idle = (toolState) => { mButton.setState('idle') }
        return target;
    }

    function deactivate() {
        mButton.set({ borderOpacity: 0 });
    }

    function activate() {
        mButton.set({ borderOpacity: 1 });
    }

    this.getObject = () => mButton;
    this.getTarget = getTarget;
    this.getId = () => id;
    this.isDynamic = () => mDynamic;
    this.setColor = setColor;
    this.setImage = setImage;
    this.setText = setText;
    this.deactivate = deactivate;
    this.activate = activate;
}
