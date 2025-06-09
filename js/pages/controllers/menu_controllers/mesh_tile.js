import * as THREE from 'three';
import * as ThreeMeshUI from 'three-mesh-ui';
import { InteractionTargetInterface } from '../../scene_objects/interaction_target_interface.js';

export function MeshTile(id, label, size, color = null, dynamic = false) {
    let mDynamic = dynamic;
    const mTile = new ThreeMeshUI.Block({
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
        offset: 0.035,
        backgroundOpacity: 0.3,
    });
    mTile.userData.id = id;

    let mText = new ThreeMeshUI.Text({
        content: label,
        fontSize: 0.055
    })
    mTile.add(mText);

    const mInteractionTarget = createTarget();

    function setColor(hex) {
        mTile.set({
            backgroundColor: new THREE.Color(hex),
            fontColor: new THREE.Color(color ? color : '#FFFFFF')
        })
    }
    setColor('#555555')

    function setImage(image, hideText = true) {
        if (!image) return;
        new THREE.TextureLoader().load(image, (texture) => {
            mTile.set({ backgroundTexture: texture, backgroundColor: null });
            if (hideText) { mText.set({ content: '' }); }
        });
    }

    function setText(text) {
        mText.set({ content: text });
    }

    function getTarget(intersection) {
        mInteractionTarget.getIntersection = () => intersection;
        return mInteractionTarget;
    }

    function createTarget() {
        let target = new InteractionTargetInterface();
        target.isButton = () => true;
        target.getId = () => id;
        target.highlight = (toolState) => { }
        target.select = (toolState) => { }
        target.idle = (toolState) => { }
        return target;
    }

    function deactivate() {
        mTile.set({ borderOpacity: 0 });
    }

    function activate() {
        mTile.set({ borderOpacity: 1 });
    }

    this.getObject = () => mTile;
    this.getTarget = getTarget;
    this.getId = () => id;
    this.isDynamic = () => mDynamic;
    this.setColor = setColor;
    this.setImage = setImage;
    this.setText = setText;
    this.deactivate = deactivate;
    this.activate = activate;
}
