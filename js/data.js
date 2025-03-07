import { IdUtil } from "./utils/id_util.js";

class DataItem {
    id = IdUtil.getUniqueId(this.constructor);

    find(childId) {
        if (childId == this.id) return this;
        for (let key of Object.keys(this)) {
            let item = this[key];
            if (!item) {
                continue;
            } else if (item instanceof DataItem) {
                let result = item.find(childId);
                if (result) return result;
            } else if (Array.isArray(item)) {
                for (let arrItem of item) {
                    if (arrItem instanceof DataItem) {
                        let result = arrItem.find(childId);
                        if (result) return result;
                    } else if (arrItem == null || arrItem == undefined) {
                        console.error('Invalid array item!');
                    } else {
                        // not an array of data items, skip it.
                        break;
                    }
                }
            } else {
                continue;
            }
        }
        // we iterated all the items and didn't find it.
        return null;
    }

    findAllLinked(linkedId, results = []) {
        let addThis = false;
        for (let key of Object.keys(this)) {
            let item = this[key];
            if (!item) {
                continue;
            } else if (key != 'id' && item == linkedId) {
                addThis = true;
            } else if (item instanceof DataItem) {
                results = item.findAllLinked(childId, results);
            } else if (Array.isArray(item)) {
                for (let arrItem of item) {
                    if (arrItem instanceof DataItem) {
                        results = item.findAllLinked(childId, results);
                    } else if (arrItem == null || arrItem == undefined) {
                        console.error('Invalid array item!');
                    } else {
                        // not an array of data items, skip it.
                        break;
                    }
                }
            } else {
                continue;
            }
        }
        if (addThis) { results.push(this); }
        return results;
    }

    clone(newIds = false) {
        let c = new this.constructor();
        let id = newIds ? c.id : this.id;

        for (let key of Object.keys(this)) {
            if (!Object.hasOwn(c, key)) { console.error("Invalid property: " + this.id + " - " + key); continue; }
            let item = this[key];
            if (Array.isArray(item)) {
                c[key] = item.map(i => cloneItem(i, newIds));
            } else {
                c[key] = cloneItem(item, newIds);
            }
        }

        c.id = id;
        return c;
    }

    delete(id) {
        for (let key of Object.keys(this)) {
            if (!this[key]) {
                continue;
            } else if (typeof this[key] == 'string') {
                if (this[key] == id) this[key] = null;
            } else if (Array.isArray(this[key])) {
                this[key] = this[key].filter(item => {
                    if (typeof item == 'number') return true;
                    if (typeof item == 'string') return item != id;
                    if (!item) {
                        console.error('Removing invalid item: ' + this.id + " - " + key + " - " + item);
                        return false;
                    }
                    return !item instanceof DataItem || item.id != id;
                })
                for (let item of this[key]) {
                    if (item instanceof DataItem) {
                        item.delete(id);
                    } else {
                        break;
                    }
                }
            } else if (this[key] instanceof DataItem) {
                if (this[key].id == id) {
                    this[key] = null;
                } else {
                    this[key].delete(id);
                }
            } else {
                continue;
            }
        }
    }

    getIndex(index = {}) {
        if (this.id) {
            index[this.id] = this;
        } else return index;

        for (let key of Object.keys(this)) {
            let item = this[key];
            if (item instanceof DataItem) {
                item.getIndex(index);
            } else if (Array.isArray(item)) {
                item.forEach(i => {
                    if (i instanceof DataItem) i.getIndex(index)
                });
            }
        }

        return index;
    }

    static fromObject(ob) {
        let c = new this();
        for (let key of Object.keys(ob)) {
            if (!Object.hasOwn(c, key)) { console.error("Invalid attribute on object:" + this.name + " - " + key); continue; }
            let item = ob[key];
            if (item == null) {
                continue;
            } else if (Array.isArray(item)) {
                c[key] = item.map(o => {
                    if (o == null) { console.error("Invalid array item for: " + key); return o; }
                    let obClass = o.id ? IdUtil.getClass(o.id) : false;
                    if (obClass) {
                        return obClass.fromObject(o);
                    } else {
                        return o;
                    }
                })
            } else {
                let itemClass = item.id ? IdUtil.getClass(item.id) : false;
                if (itemClass) {
                    c[key] = itemClass.fromObject(item)
                } else {
                    c[key] = item;
                }
            }
        }
        return c;
    }
}

function cloneItem(item, newIds) {
    if (item instanceof DataItem) {
        return item.clone(newIds);
    } else if (item == null || item == undefined) {
        return item;
    } else if (typeof item == 'object') {
        return Object.assign({}, item);
    } else if (typeof item == 'number') {
        return item;
    } else if (typeof item == 'string') {
        return item;
    } else if (typeof item == 'boolean') {
        return item;
    } else {
        console.error("Unhandled item type", item);
        return item;
    }
}

// Story model is the database, which stores the tables
// All other objects have arrays of pointers.
class StoryModel extends DataItem {
    /* Top level data structure. */
    name = "A Story in Moments"
    // An array of the file names 
    // that have been loaded into this story
    assets = [];
    // base pose information for loaded 3D models
    assetPoses = [];
    moments = [];
    photospheres = [];
    strokes = [];
    surfaces = [];
    areas = [];
    poseableAssets = [];
    pictures = [];
    audios = [];
    teleports = [];

    version = 0.1;
}

class Moment extends DataItem {
    /* independant attributes */
    name = "Moment"
}


class Asset extends DataItem {
    /* independant attributes */
    name = "Asset";
    type = null;
    filename = null;
    updated = Date.now();
}

class PoseableAsset extends DataItem {
    /* required id links */
    assetId = null;
    momentId = null;

    /* independant attributes */
    name = "3D Model"
}

class AssetPose extends DataItem {
    /* required id links */
    // The parent can be either an asset (in which case this is a default pose)
    // or a Poseable asset. 
    parentId = null;

    /* independant attributes */
    name = "Pose";
    // indicates if this pose is relative, i.e. part of a chain,
    // or a root item
    isRoot = true;
    x = 0; y = 0; z = 0;
    orientation = [0, 0, 0, 1]; // quaternion
    scale = 1;
}

class Photosphere extends DataItem {
    /* required id links */
    momentId = null;

    /* optional id links */
    // the id of the photosphere image asset
    assetId = null;

    /* independant attributes */
    enabled = true;
    scale = 1;

    /* procedural linked attributes */
    // We add this here as it's integral to the data structure. 
    // photosphere surface references these indices. Any changes
    // here will invalidate save models. 
    static get basePointUVs() {
        const segmentsDown = 16
        const segmentsAround = 32;

        let basePointUVs = [];
        for (let down = 0; down <= segmentsDown; ++down) {
            for (let across = 0; across <= segmentsAround; ++across) {
                let u = across / segmentsAround;
                let v = down / segmentsDown;
                basePointUVs.push(u, v);
            }
        }

        return basePointUVs;
    }
}

class PhotosphereSurface extends DataItem {
    /* required id links */
    photosphereId = null;

    /* independant attributes */
    normal = [0, 0, 1]
    dist = -1;
}

class PhotosphereArea extends DataItem {
    /* required id links */
    photosphereSurfaceId = null;

    /* independant attributes */
    // uv array of u,v. 
    points = []
}

const StrokeType = {
    FOCUS: 'focus',
    COLOR: 'color'
}
class Stroke extends DataItem {
    /* required id links */
    photosphereId = null;

    /* independant attributes */
    // uv array of u,v. 
    points = [];
    // width in percent of canvas height.  
    width = 0.1;
    color = '#000000';
    type = StrokeType.COLOR;
}

class Picture extends DataItem {
    /* required id links */
    assetId = null;
    momentId = null;

    /* independant attributes */
    name = "Picture";
    x = 0; y = 0; z = 0;
    orientation = [0, 0, 0, 1];
    scale = 0.3;
}

class Audio extends DataItem {
    /* required id links */
    assetId = null;
    momentId = null;

    /* optional id links */
    attachedId = null;

    /* independant attributes */
    name = "Audio";
    x = 0; y = 0; z = 0;
    volume = 1;
    ambient = false;
}

class Teleport extends DataItem {
    /* required id links */
    momentId = null;
    destinationId = null;

    /* optional id links */
    attachedId = null;

    /* independant attributes */
    name = "Teleport";
    x = 0; y = 0; z = 0;
    sceneX = 0;
    sceneY = 0;
    sceneZ = 0;
    sceneDirX = 0;
    sceneDirY = 0;
    sceneDirZ = -1;
}

export const Data = {
    StoryModel,
    Asset,
    Moment,
    PoseableAsset,
    AssetPose,
    Photosphere,
    PhotosphereSurface,
    PhotosphereArea,
    StrokeType,
    Stroke,
    Picture,
    Audio,
    Teleport,
}