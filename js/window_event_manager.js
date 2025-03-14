/**
 * Listens to global browser events 
 */

export function WindowEventManager() {
    let mPointerUpCallback = async (screenCoords) => { }
    let mPointerMoveCallback = async (screenCoords) => { }
    let mUndoCallback = async () => { }
    let mRedoCallback = async () => { }
    let mResizeCallback = async (width, height) => { }

    window.addEventListener('resize', async () => {
        try {
            await mResizeCallback(window.innerWidth, window.innerHeight);
        } catch (e) { console.error(e); }
    });

    window.addEventListener('pointermove', async (event) => {
        try {
            await mPointerMoveCallback({ x: event.clientX, y: event.clientY });
        } catch (e) { console.error(e); }
    });

    window.addEventListener('pointerup', async (event) => {
        try {
            await mPointerUpCallback({ x: event.clientX, y: event.clientY });
        } catch (e) { console.error(e); }
    });

    window.addEventListener('keydown', async (event) => {
        if (event.ctrlKey && event.key === 'z') {
            await mUndoCallback();
        }
    });

    window.addEventListener('keydown', async (event) => {
        if (event.ctrlKey && event.key === 'y') {
            await mRedoCallback();
        }
    });

    window.addEventListener('keydown', async (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'z') {
            await mRedoCallback();
        }
    });

    return {
        onPointerUp: (func) => mPointerUpCallback = func,
        onPointerMove: (func) => mPointerMoveCallback = func,
        onUndo: (func) => mUndoCallback = func,
        onRedo: (func) => mRedoCallback = func,
        onResize: (func) => {
            mResizeCallback = func;
            mResizeCallback(window.innerWidth, window.innerHeight);
        },
    }
}

