import { BrushToolButtons, SurfaceToolButtons, ToolButtons } from "../../constants.js";

export class ToolState {
    tool = ToolButtons.MOVE;
    brushSettings = {
        mode: BrushToolButtons.UNBLUR,
        // percent of sphereheight.
        clearWidth: 0.1,
        colorWidth: 0.1,
        unblurWidth: 0.1,
        color: '#333355'
    };
    surfaceSettings = {
        mode: SurfaceToolButtons.FLATTEN,
    };
    clone = function () {
        let state = new ToolState();
        Object.assign(state, this)
        state.brushSettings = Object.assign({}, this.brushSettings);
        state.surfaceSettings = Object.assign({}, this.surfaceSettings);
        return state;
    }
}