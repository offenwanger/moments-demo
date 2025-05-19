import * as ThreeMeshUI from 'three-mesh-ui';
import { MeshButton } from './mesh_button.js';

export function ButtonMenu(id, header = '', width, paginate = 0) {
    // set of MeshButtons
    let mButtons = [];
    let mDynamicButtons = []
    let mDisplayButtons = []
    let mRows = []

    // scrolling menu parameters
    let mItemOffset = 0;
    let mPaginate = paginate;

    const mContainer = new ThreeMeshUI.Block({
        padding: 0.1,
        margin: 0.02,
        width,
        borderRadius: 0.1,
        alignItems: 'start',
    });
    mContainer.userData.id = id;

    if (header) {
        let height = (Math.round(header.length / 40)) * 0.078

        const mTextBox = new ThreeMeshUI.Block({
            margin: 0.02,
            width: width - 0.2,
            height,
            backgroundOpacity: 0,
            textAlign: 'left',
            fontSize: 0.06
        });
        mTextBox.add(new ThreeMeshUI.Text({
            content: header,
            width,
            height: 0.5,
            fontFamily: "./css/fonts/Roboto-msdf.json",
            fontTexture: "./css/fonts/Roboto-msdf.png",
        }))
        mContainer.add(mTextBox);
    }


    function layout() {
        mContainer.remove(...mRows)
        mRows = [];
        mDisplayButtons = mButtons.concat(mDynamicButtons);

        // if we are paginating only include a subset of the dynamic buttons
        if (mPaginate > 0 && mDynamicButtons.length > mPaginate) {
            let subset = mDynamicButtons.slice(mItemOffset, mItemOffset + mPaginate);
            mDisplayButtons = mButtons.concat(subset);
        }

        for (let i = 0; i < mDisplayButtons.length; i += 3) {
            let buttons = mDisplayButtons.slice(i, i + 3);
            let row = new ThreeMeshUI.Block({
                contentDirection: 'row',
                backgroundOpacity: 0,
                alignItems: 'start',
                fontFamily: "./css/fonts/Roboto-msdf.json",
                fontTexture: "./css/fonts/Roboto-msdf.png",
            });
            row.add(...buttons.map(b => b.getObject()));
            mRows.push(row);
            mContainer.add(row)
        }

        mContainer.update(true, true, false);
    }

    /**
     * Add mesh buttons.
     * @param  {...MeshButton} buttons 
     */
    function add(...buttons) {
        mButtons.push(...buttons.filter(b => !b.isDynamic()));
        mDynamicButtons.push(...buttons.filter(b => b.isDynamic()));
        layout();
    }

    /**
     * remove mesh buttons.
     * @param  {...MeshButton} buttons 
     */
    function remove(...buttons) {
        let ids = buttons.map(b => b.getId())
        mButtons = mButtons.filter(b => !ids.includes(b.getId()));
        mDynamicButtons = mDynamicButtons.filter(b => !ids.includes(b.getId()));
        constrainOffset();
        layout();
    }

    function empty(dynamicOnly = false) {
        mDynamicButtons = [];
        if (!dynamicOnly) mButtons = [];
        constrainOffset();
        layout();
    }

    function incrementItemOffset() {
        mItemOffset += 1;
        constrainOffset();
        layout();
    }
    function decrementItemOffset() {
        mItemOffset -= 1;
        constrainOffset();
        layout();
    }

    function constrainOffset() {
        mItemOffset = Math.max(0, Math.min(mItemOffset, mDynamicButtons.length - mPaginate))
    }

    this.add = add;
    this.remove = remove;
    this.empty = empty;
    this.getObject = () => mContainer;
    this.getButtons = () => [...mDisplayButtons];
    this.incrementItemOffset = incrementItemOffset;
    this.decrementItemOffset = decrementItemOffset;
}
