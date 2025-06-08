/**
 * Listens to global browser events 
 */

export function WindowEventManager() {
    let mPointerUpCallback = (screenCoords) => { }
    let mPointerMoveCallback = (screenCoords) => { }
    let mUndoCallback = () => { }
    let mRedoCallback = () => { }
    let mResizeCallback = (width, height) => { }

    window.addEventListener('resize', () => {
        try {
            mResizeCallback(window.innerWidth, window.innerHeight);
        } catch (e) { console.error(e); }
    });

    window.addEventListener('pointermove', (event) => {
        try {
            mPointerMoveCallback({ x: event.clientX, y: event.clientY });
        } catch (e) { console.error(e); }
    });

    window.addEventListener('pointerup', (event) => {
        try {
            mPointerUpCallback({ x: event.clientX, y: event.clientY });
        } catch (e) { console.error(e); }
    });

    window.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'z') {
            mUndoCallback();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'y') {
            mRedoCallback();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'z') {
            mRedoCallback();
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

