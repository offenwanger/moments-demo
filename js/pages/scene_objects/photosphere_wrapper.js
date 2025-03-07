import * as THREE from 'three';
import { BrushToolButtons, SurfaceToolButtons, ToolButtons } from '../../constants.js';
import { Data } from "../../data.js";
import { Action, ActionType, Transaction } from '../../utils/transaction_util.js';
import { Util } from '../../utils/utility.js';
import { InteractionTargetInterface } from "./interaction_target_interface.js";

const DEFAULT_TEXTURE = 'assets/images/default_sphere_texture.png';

const BASE_CANVAS_WIDTH = 2048;
const BASE_CANVAS_HEIGHT = 1024;

const POSITION_NUM_COMPONENTS = 3;
const UV_NUM_COMPONENTS = 2;
const COLOR_NUM_COMPONENTS = 4;
const NORMAL_NUM_COMPONENTS = 3;

const SURFACE_COLORS = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000']

export function PhotosphereWrapper(parent) {
    let mParent = parent;
    let mModel = new Data.StoryModel();
    let mPhotosphere = new Data.Photosphere();
    let mStrokes = [];
    let mSurfaces = [];
    let mSurfacePivots = [];
    let mSurfaceAreas = [];
    let mInteractionTarget = createInteractionTarget();

    let mBasePointUVs = Data.Photosphere.basePointUVs;
    let mSurfaceOffsets = [];

    let mInputStrokes = [];
    let mInputPath3D = [];
    let mDrawingDeletedStrokes = [];
    let mDrawingNewStrokes = [];
    let mDrawingSurfaceAreas = [];
    let mDrawAllSurfaceAreas = false;

    const mGeometry = new THREE.BufferGeometry();
    let mPositionAttribute;
    let mPositionArray;
    let mUVAttribute;
    let mUVArray;
    let mColorAttribute;
    let mColorArray;
    let mNormalsAttribute;
    let mNormalsArray;
    let mIndicesArray;

    // the original image which we will manipulate
    let mImage = document.createElement('canvas');

    // extra canvases to reduce draw calls
    // also they're smaller than the main canvas so the 
    // aliasing softens the edges of the lines without actually
    // blurring them. Turns out using a blur filters for soft
    // edges is a really bad idea, seizes up the browser.
    let mBlur = document.createElement('canvas');
    mBlur.width = BASE_CANVAS_WIDTH / 4;
    mBlur.height = BASE_CANVAS_HEIGHT / 4;
    let mBlurCtx = mBlur.getContext('2d')
    let mColor = document.createElement('canvas');
    mColor.width = BASE_CANVAS_WIDTH / 4;
    mColor.height = BASE_CANVAS_HEIGHT / 4;
    let mColorCtx = mColor.getContext('2d')
    let mSurfaceArea = document.createElement('canvas');
    mSurfaceArea.width = BASE_CANVAS_WIDTH / 4;
    mSurfaceArea.height = BASE_CANVAS_HEIGHT / 4;
    let mSurfaceAreaCtx = mSurfaceArea.getContext('2d')

    // The canvas for the sphere
    const mCanvas = document.createElement('canvas');
    mCanvas.width = BASE_CANVAS_WIDTH;
    mCanvas.height = BASE_CANVAS_HEIGHT;
    const mCtx = mCanvas.getContext('2d');
    const mCanvasMaterial = new THREE.CanvasTexture(mCanvas);

    const mMaterial = new THREE.MeshStandardMaterial({ map: mCanvasMaterial });

    const mSphere = new THREE.Mesh(mGeometry, mMaterial);

    const mPlaneHelper = new THREE.Plane();
    const mRayHelper = new THREE.Ray();

    async function update(photosphere, model, assetUtil) {
        mInputStrokes = [];
        mInputPath3D = [];
        mDrawingDeletedStrokes = [];
        mDrawingNewStrokes = [];
        mDrawingSurfaceAreas = [];
        mDrawAllSurfaceAreas = false;

        mPhotosphere = photosphere;
        mModel = model;

        if (!mPhotosphere || !mPhotosphere.enabled) {
            mParent.remove(mSphere);
            return;
        } else {
            mParent.add(mSphere)
        }

        mStrokes = model.strokes.filter(s => s.photosphereId == mPhotosphere.id);

        mSurfaces = model.surfaces.filter(s => s.photosphereId == mPhotosphere.id);
        mSurfacePivots = [];
        mSurfaceAreas = [];

        mSurfaces.forEach(s => {
            mSurfaceAreas.push(...model.areas.filter(a => a.photosphereSurfaceId == s.id));

            // make the pivot
            let center = new THREE.Vector3();
            for (let i = 0; i < s.points.length; i += 2) {
                center.add(Util.uvToPoint(s.points[i], s.points[i + 1]));
            }
            center.normalize();

            let pivot = new THREE.Vector3();
            mPlaneHelper.normal.set(...s.normal);
            mPlaneHelper.constant = s.dist;
            mRayHelper.direction.copy(center);
            mRayHelper.intersectPlane(mPlaneHelper, pivot);
            if (pivot.length() == 0) {
                console.error('Invalid pivot:' + pivot.toArray())
                pivot.copy(center);
            }
            mSurfacePivots.push(pivot);
        })

        // TODO: Might need to fix performance here. 
        updateMesh();

        if (mPhotosphere.assetId) {
            mImage = await assetUtil.loadImage(mPhotosphere.assetId);
        } else {
            mImage = await (new THREE.ImageLoader()).loadAsync(DEFAULT_TEXTURE)
        }
        mSphere.userData.id = mPhotosphere.id;

        drawBlur();
        drawColor();
        drawSurfaceArea();

        draw();
    }

    function draw() {
        mCtx.reset();
        mCtx.drawImage(mBlur, 0, 0, BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT);
        mCtx.globalCompositeOperation = 'source-atop'
        mCtx.drawImage(mImage, 0, 0, BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT);
        mCtx.filter = 'blur(15px)'
        mCtx.globalCompositeOperation = 'destination-over'
        mCtx.drawImage(mImage, 0, 0, BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT);
        mCtx.globalCompositeOperation = 'source-over'
        mCtx.filter = "none";
        mCtx.drawImage(mColor, 0, 0, BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT)
        mCtx.drawImage(mSurfaceArea, 0, 0, BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT);
        mCanvasMaterial.needsUpdate = true;
    }

    function drawBlur() {
        mBlurCtx.reset();
        // Draw the focus strokes.
        let focusStokes = mStrokes
            .filter(s => !mDrawingDeletedStrokes.includes(s.id))
            .concat(mDrawingNewStrokes)
            .filter(s => s.type == Data.StrokeType.FOCUS)
        for (let s of focusStokes) {
            drawStroke(mBlur, mBlurCtx, s);
        }
    }

    function drawColor() {
        mColorCtx.reset();
        // Draw the color
        let drawStrokes = mStrokes.filter(s => !mDrawingDeletedStrokes.includes(s.id))
            .concat(mDrawingNewStrokes)
            .filter(s => s.type == Data.StrokeType.COLOR)
        for (let s of drawStrokes) {
            drawStroke(mColor, mColorCtx, s);
        }
    }

    function drawSurfaceArea() {
        mSurfaceAreaCtx.reset();
        mDrawingSurfaceAreas.forEach(s => { drawArea(s); });
        if (mDrawAllSurfaceAreas) {
            mSurfaceAreas.forEach(s => { drawArea(s); });
        }
    }

    function drawStroke(canvas, ctx, stroke) {
        ctx.globalCompositeOperation = 'source-over'
        ctx.lineCap = 'round'
        ctx.lineWidth = stroke.width * canvas.height;
        ctx.color = stroke.color;

        ctx.beginPath();
        ctx.moveTo((stroke.points[0] * canvas.width) - 1, ((1 - stroke.points[1]) * canvas.height) - 1)
        for (let i = 0; i < stroke.points.length; i += 2) {
            ctx.lineTo(stroke.points[i] * canvas.width, (1 - stroke.points[i + 1]) * canvas.height);
        }
        ctx.stroke();
        ctx.closePath();
    }

    function drawArea(area) {
        mCtx.globalCompositeOperation = 'source-over'
        mCtx.lineWidth = mCanvas.height * 0.05;
        let index = mSurfaces.indexOf(s => s.id == area.photosphereSurfaceId);
        mCtx.color = SURFACE_COLORS[index % SURFACE_COLORS.length]
        mCtx.fillStyle = mCtx.color + /*alpha*/ '30';
        mCtx.filter = 'none'

        mCtx.beginPath();
        mCtx.moveTo(area.points[0], area.points[1])
        for (let i = 0; i < area.points.length; i += 2) {
            mCtx.lineTo(area.points[i] * mCanvas.width, (1 - area.points[i + 1]) * mCanvas.height)
        }
        mCtx.fill();
        mCtx.stroke();
    }

    function updateMesh() {
        let numVertices = mBasePointUVs.length / 2 + mSurfaces.reduce((sum, surface) => {
            // add the length of the array /2 since it's a flat u,v array
            sum += surface.points.length / 2;
            return sum;
        }, 0);
        mPositionArray = new Float32Array(numVertices * POSITION_NUM_COMPONENTS);
        mNormalsArray = new Float32Array(numVertices * NORMAL_NUM_COMPONENTS);
        mUVArray = new Float32Array(numVertices * UV_NUM_COMPONENTS);
        mColorArray = new Float32Array(numVertices * COLOR_NUM_COMPONENTS);

        let points = [...mBasePointUVs];
        mSurfaceOffsets = [];
        for (let surface of mSurfaces) {
            // the offset where this surfaces points start. 
            mSurfaceOffsets.push(points.length / 2);
            points.push(...surface.points);
        }
        for (let i = 0; i < numVertices; i++) {
            let u = points[i * 2];
            let v = points[i * 2 + 1];
            let point = Util.uvToPoint(u, v);
            let scaledPoint = new THREE.Vector3();
            let surface = getSurfaceForPointIndex(i);
            if (surface) {
                mPlaneHelper.normal.set(...surface.normal);
                mPlaneHelper.constant = surface.dist;
                mRayHelper.direction.copy(point);
                mRayHelper.intersectPlane(mPlaneHelper, scaledPoint);
                if (scaledPoint.length() == 0) {
                    console.error('Invalid point:' + [u, v] + ", " + scaledPoint.toArray())
                    scaledPoint.copy(point);
                }
            } else {
                scaledPoint.copy(point);
            }
            scaledPoint.multiplyScalar(mPhotosphere.scale);

            mPositionArray.set(scaledPoint.toArray(), i * POSITION_NUM_COMPONENTS);
            mNormalsArray.set(point, i * NORMAL_NUM_COMPONENTS);
            mUVArray.set([u, v], i * UV_NUM_COMPONENTS);
            mColorArray.set([0, 0, 1, 0], i * COLOR_NUM_COMPONENTS);
        }

        mPositionAttribute = new THREE.BufferAttribute(mPositionArray, POSITION_NUM_COMPONENTS);
        mPositionAttribute.setUsage(THREE.DynamicDrawUsage);
        mUVAttribute = new THREE.BufferAttribute(mUVArray, UV_NUM_COMPONENTS);
        mUVAttribute.setUsage(THREE.DynamicDrawUsage);
        mColorAttribute = new THREE.BufferAttribute(mColorArray, COLOR_NUM_COMPONENTS)
        mColorAttribute.setUsage(THREE.DynamicDrawUsage);
        mNormalsAttribute = new THREE.BufferAttribute(mNormalsArray, NORMAL_NUM_COMPONENTS)
        mNormalsAttribute.setUsage(THREE.DynamicDrawUsage);

        let delauny = new Delaunator(mUVArray);
        mIndicesArray = Array.from(delauny.triangles);
        for (let i = 0; i < mIndicesArray.length; i += 3) {
            let x = mIndicesArray[i]
            mIndicesArray[i] = mIndicesArray[i + 2]
            mIndicesArray[i + 2] = x;
        }

        mGeometry.setAttribute('position', mPositionAttribute);
        mGeometry.setAttribute('color', mColorAttribute);
        mGeometry.setAttribute('uv', mUVAttribute);
        mGeometry.setAttribute('normal', mNormalsAttribute);
        mGeometry.setIndex(mIndicesArray);
    }

    function getSurfaceForPointIndex(pointIndex) {
        if (pointIndex < mBasePointUVs.length / 2) {
            return mSurfaces.find(s => s.basePointIndices.includes(pointIndex));
        } else {
            // if it's base the end of the offsets, it's in the last surface.
            if (pointIndex > mSurfaceOffsets[mSurfaceOffsets.length - 1]) {
                return mSurfaces[mSurfaces.length - 1];
            } else {
                for (let i = 1; i < mSurfaceOffsets.length; i++) {
                    if (pointIndex < mSurfaceOffsets[i]) {
                        return mSurfaces[i - 1];
                    }
                }
            }
        }
    }

    function getId() {
        return mPhotosphere?.id;
    }

    function remove() {
        mParent.remove(mSphere);
    }

    function getTargets(ray, toolMode) {
        if (!mPhotosphere) return [];

        if (toolMode.tool != ToolButtons.BRUSH &&
            toolMode.tool != ToolButtons.SURFACE &&
            toolMode.tool != ToolButtons.SCISSORS) {
            // not a target for whatever this tool is
            return [];
        }

        let intersect = ray.intersectObject(mSphere);
        if (intersect.length == 0) return [];
        intersect = intersect[0];

        let targetedId = mPhotosphere.id;
        if (toolMode.tool == ToolButtons.SURFACE &&
            toolMode.surfaceSettings.mode == SurfaceToolButtons.PULL) {
            let pointIndex = intersect.face.a
            let surface = getSurfaceForPointIndex(pointIndex);
            if (!surface) return [];
            else targetedId = surface.id;
        }

        mInteractionTarget.getIntersection = () => intersect;
        mInteractionTarget.getId = () => targetedId;
        mInteractionTarget.highlight = function (toolMode) {
            mDrawAllSurfaceAreas = false;
            if (toolMode.tool == ToolButtons.BRUSH) {
                if (toolMode.brushSettings.mode == BrushToolButtons.CLEAR) {
                    let { deletedStrokes, newStrokes } = eraseStrokesWithStrokes(mStrokes, [{
                        points: [intersect.uv.x, intersect.uv.y]
                    }]);
                    mDrawingNewStrokes = newStrokes;
                    mDrawingDeletedStrokes = deletedStrokes;
                    drawBlur();
                    drawColor();
                    draw();
                } else if (toolMode.brushSettings.mode == BrushToolButtons.UNBLUR) {
                    let stroke = new Data.Stroke();
                    stroke.points = [intersect.uv.x, intersect.uv.y]
                    stroke.type = Data.StrokeType.FOCUS;
                    stroke.width = toolMode.brushSettings.width;
                    mDrawingNewStrokes = [stroke];
                    drawBlur();
                    draw();
                } else if (toolMode.brushSettings.mode == BrushToolButtons.COLOR) {
                    let stroke = new Data.Stroke();
                    stroke.points = [intersect.uv.x, intersect.uv.y]
                    stroke.type = Data.StrokeType.COLOR;
                    stroke.width = toolMode.brushSettings.width;
                    stroke.color = toolMode.brushSettings.color;
                    mDrawingNewStrokes = [stroke];
                    drawColor();
                    draw();
                }
            } else if (toolMode.tool == ToolButtons.SURFACE &&
                toolMode.surfaceSettings.mode == SurfaceToolButtons.PULL) {
                let surfaceIndex = mSurfaces.findIndex(s => s.id == targetedId);
                if (surfaceIndex == -1) { console.error('Invalid surface: ' + targetedId); return; }
                console.log('Set drawing surfaces to this one')
                drawSurfaceArea();
                draw();
            } else if (toolMode.tool == ToolButtons.SURFACE &&
                (toolMode.surfaceSettings.mode == SurfaceToolButtons.RESET
                    || toolMode.surfaceSettings.mode == SurfaceToolButtons.FLATTEN)) {
                mDrawAllSurfaceAreas = true;
                draw();
            } else {
                // nothing to do. 
            }
        };

        mInteractionTarget.select = (toolMode) => {
            // add a stroke to the input strokes. If it's very far away from the last one, start a new stroke
            // this can happen if the user exists and enters the sphere, 
            // or if they cross the seam.
            if (mInputStrokes.length == 0) {
                mInputStrokes.push([...intersect.uv]);
            } else {
                let lastPoint = mInputStrokes[mInputStrokes.length - 1].slice(mInputStrokes[mInputStrokes.length - 1].length - 2);
                if (intersect.uv.distanceTo({ x: lastPoint[0], y: lastPoint[1] }) > toolMode.brushSettings.width * 1.5) {
                    mInputStrokes.push([]);
                    if (1 - Math.abs(lastPoint[0] - intersect.uv) < toolMode.brushSettings.width * 1.5) {
                        // we crossed the boundry. Add the extended points to their respective arrays
                        mInputStrokes[mInputStrokes.length - 1].push(
                            lastPoint[0] < 0.5 ? lastPoint[0] + 1 : lastPoint[0] - 1,
                            lastPoint[1])
                        mInputStrokes[mInputStrokes.length - 2].push(
                            intersect.uv.x < 0.5 ? intersect.uv.x + 1 : intersect.uv.x - 1,
                            intersect.uv.y);
                    }
                }
                mInputStrokes[mInputStrokes.length - 1].push(...intersect.uv);
            }
            mInputPath3D.push(new THREE.Vector3().copy(intersect.point).normalize());

            if (toolMode.tool == ToolButtons.BRUSH) {
                if (toolMode.brushSettings.mode == BrushToolButtons.CLEAR) {
                    let { deletedStrokes, newStrokes } = eraseStrokesWithStrokes(mStrokes,
                        mInputStrokes.map(points => { return { points, width: toolMode.brushSettings.width } }));
                    mDrawingNewStrokes = newStrokes;
                    mDrawingDeletedStrokes = deletedStrokes;
                    drawBlur();
                    drawColor();
                    draw();
                } else if (toolMode.brushSettings.mode == BrushToolButtons.UNBLUR) {
                    mDrawingNewStrokes = mInputStrokes.map(points => {
                        let s = new Data.Stroke();
                        s.photosphereId = mPhotosphere.id;
                        s.width = toolMode.brushSettings.width;
                        s.type = Data.StrokeType.FOCUS;
                        s.points = points;
                        return s;
                    });
                    drawBlur();
                    draw();
                } else if (toolMode.brushSettings.mode == BrushToolButtons.COLOR) {
                    mDrawingNewStrokes = mInputStrokes.map(points => {
                        let s = new Data.Stroke();
                        s.photosphereId = mPhotosphere.id;
                        s.width = toolMode.brushSettings.width;
                        s.color = toolMode.brushSettings.color;
                        s.type = Data.StrokeType.COLOR;
                        s.points = points;
                        return s;
                    });
                    drawColor();
                    draw();
                }
            } else if (toolMode.tool == ToolButtons.SURFACE) {
                if (toolMode.surfaceSettings.mode == SurfaceToolButtons.FLATTEN ||
                    toolMode.surfaceSettings.mode == SurfaceToolButtons.RESET) {
                    let areas = inputPathToAreas(mInputPath3D, mInputStrokes);
                    mDrawingSurfaceAreas = areas;
                } else if (toolMode.surfaceSettings.mode == SurfaceToolButtons.PULL) {
                    mDrawAllSurfaceAreas = false;
                    mDrawingSurfaceAreas = mSurfaceAreas.filter(s => s.photosphereSurfaceId == targetedId);
                } else {
                    console.error('Invalid tool state: ' + toolMode.surfaceSettings.mode);
                }
                drawSurfaceArea();
                draw();
            }
        }
        mInteractionTarget.idle = (toolMode) => {
            mInputStrokes = [];
            mInputPath3D = [];
            mDrawingDeletedStrokes = [];
            mDrawingNewStrokes = [];
            mDrawingSurfaceAreas = [];
            mDrawAllSurfaceAreas = false;
        }

        return [mInteractionTarget]
    }

    function eraseStrokesWithStrokes(strokes, eraseStrokes) {
        let deletedStrokes = []
        let newStrokes = []

        strokes.forEach(stroke => {
            let deletes = new Array(stroke.points.length / 2).fill(false);
            for (let i = 0; i < stroke.points.length / 2; i++) {
                let p = new THREE.Vector2(stroke.points[i * 2], stroke.points[i * 2 + 1]);
                for (let { width, points } of eraseStrokes) {
                    for (let j = 0; j < points.length; j += 2) {
                        if (p.distanceTo(new THREE.Vector2(points[j], points[j + 1])) < width) {
                            deletes[i] = true;
                            break;
                        }
                    }
                    if (deletes[i] == true) break;
                }
            }
            if (deletes.some(d => d)) {
                deletedStrokes.push(stroke.id);
                let currStroke = []
                for (let i = 0; i < deletes.length; i++) {
                    if (deletes[i] && currStroke.length > 0) {
                        let s = new Data.Stroke();
                        s.points = currStroke;
                        s.type = stroke.type;
                        s.width = stroke.width;
                        s.color = stroke.color;
                        s.photosphereId = stroke.photosphereId;
                        newStrokes.push(s);
                        currStroke = [];
                    } else if (!deletes[0]) {
                        currStroke.push(stroke.points[i * 2], stroke.points[i * 2 + 1]);
                    }
                }
            }
            return false;
        });

        return { deletedStrokes, newStrokes };
    }

    function inputPathToAreas(path3D, paths) {
        // no paths no area
        if (paths.length == 0) return [];
        // less than 3 points, no area
        if (paths.flat().length < 6) return [];

        // We only make an area that's total angle is less than 120degrees. 
        for (let i = 0; i < path3D.length; i++) {
            for (let j = i; j < path3D.length; j++) {
                if (path3D[i].angleTo(path3D[j]) > (2 / 3 * Math.PI)) {
                    // too big
                    return [];
                }
            }
        }

        // first determine if we close by crossing the seam or not
        // we do this by checking the first and last points. 
        let p1 = paths[0].slice(0, 2);
        let lastPath = paths[paths.length - 1];
        let pn = lastPath.slice(lastPath.length - 2);

        if (Math.abs(p1[0] - pn[0]) > 0.5) {
            // closer to go around. 
            // extend the last path to the first point, and add a second segment
            paths[paths.length - 1] = paths[paths.length - 1].concat([
                p1[0] > 0.5 ? p1[0] - 1 : p1[0] + 1,
                p1[1]
            ]);
            paths.push([
                pn[0] > 0.5 ? pn[0] - 1 : pn[0] + 1,
                pn[1],
                p1[0],
                p1[1]
            ])
        } else {
            // closer to go direct, no changes needed.
        }

        if (paths.length == 1) {
            // if there's only one path, then it's a closed shape, 
            // making one area
            let area = new Data.PhotosphereArea();
            area.points = paths[0];
            area.photosphereId = mPhotosphere.id;
            return [area];
        }

        // there's more than one path, start by connecting the start and end
        let start = paths.shift();
        paths[paths.length - 1].push(...start);

        // now we add points so that wrapping paths include the 
        // whole bottom, and otherwise just return everything as an area. 
        for (let path of paths) {
            if (path[0] < 0 && path[path.length - 2] > 1) {
                path.unshift([path[0], path[1] > 0.5 ? 1.1 : -0.1]);
                path.push([path[path.length - 2], path[path.length - 1] > 0.5 ? 1.1 : -0.1]);
            }
        }

        return paths.map(points => {
            let area = new Data.PhotosphereArea();
            area.points = points;
            area.photosphereId = mPhotosphere.id;
            return area;
        })
    }

    function createInteractionTarget() {
        let target = new InteractionTargetInterface();
        target.getObject3D = () => { return mSphere; }
        target.getTransaction = () => {
            let actions = [];
            actions.push(...mDrawingDeletedStrokes.map(id => new Action(ActionType.DELETE, id)))
            actions.push(...mDrawingNewStrokes.map(s => {
                let params = Object.assign({}, s);
                delete params.id;
                return new Action(ActionType.CREATE, s.id, params);
            }));
            actions.push(...mDrawingSurfaceAreas.map(s => {
                let params = Object.assign({}, s);
                delete params.id;
                return new Action(ActionType.CREATE, s.id, params);
            }));
            if (actions.length > 0) {
                return new Transaction(actions);
            } else {
                return null;
            }
        };
        // these are only for moving surfaces
        target.getWorldPosition = function () {
            let surfaceId = this.getId();
            let surfaceIndex = mSurfaces.findIndex(s => s.id == surfaceId);
            if (surfaceIndex == -1) console.error('invalid target: ' + this.getId());
            return mSurfacePivots[surfaceIndex];
        }
        target.setWorldPosition = function (pos) {
            let surfaceId = this.getId();
            let surfaceIndex = mSurfaces.findIndex(s => s.id == surfaceId);
            if (surfaceIndex == -1) console.error('invalid target: ' + this.getId());
            let ray = new THREE.Ray()
            ray.direction.copy(mSurfacePivots[surfaceIndex]).normalize();
            let newPos = new THREE.Vector3()
            ray.closestPointToPoint(pos, newPos);
            mPlaneHelper.setFromNormalAndCoplanarPoint(new THREE.Vector3(...mSurfaces[surfaceIndex].normal), newPos);
            mSurfaces[surfaceIndex].dist = mPlaneHelper.constant;
            updateMesh();
        }
        target.getLocalOrientation = function () {
            let surfaceId = this.getId();
            let surface = mSurfaces.find(s => s.id == surfaceId);
            if (!surface) console.error('invalid target: ' + this.getId());
            return new THREE.Quaternion().setFromRotationMatrix(
                new THREE.Matrix4().lookAt(new THREE.Vector3(...surface.normal),
                    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0)));
        }
        target.getWorldOrientation = target.getLocalOrientation;
        target.setWorldOrientation = function (orientation) {
            let surfaceId = this.getId();
            let surfaceIndex = mSurfaces.findIndex(s => s.id == surfaceId);
            if (surfaceIndex == -1) console.error('invalid target: ' + this.getId());
            mSurfaces[surfaceIndex].normal = new THREE.Vector3(0, 0, 1).applyQuaternion(orientation).toArray();
            mPlaneHelper.setFromNormalAndCoplanarPoint(new THREE.Vector3(...mSurfaces[surfaceIndex].normal), mSurfacePivots[surfaceIndex]);
            mSurfaces[surfaceIndex].dist = mPlaneHelper.constant;
            updateMesh();
        }
        target.getNormalAndDist = function () {
            let surfaceId = this.getId();
            let surface = mSurfaces.find(s => s.id == surfaceId);
            if (!surface) console.error('invalid target: ' + this.getId());
            return { normal: surface.normal, dist: surface.dist };
        }
        return target;
    }

    this.getTargets = getTargets;
    this.update = update;
    this.getId = getId;
    this.remove = remove;
}