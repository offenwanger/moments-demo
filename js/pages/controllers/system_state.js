import { BrushToolButtons, SurfaceToolButtons, ToolButtons } from "../../constants.js";

export class ToolState {
    tool = ToolButtons.MOVE;
    brushSettings = {
        mode: BrushToolButtons.UNBLUR,
        // percent of sphereheight.
        width: 0.1,
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