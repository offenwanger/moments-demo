import * as fs from 'fs';
import mime from 'mime';
import { dirname } from 'path';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { fileURLToPath } from 'url';
import { logInfo } from '../../js/utils/log_util.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FOLDER = __dirname + '/testoutput/'
if (!fs.existsSync(OUT_FOLDER)) { fs.mkdirSync(OUT_FOLDER); }
const IN_FOLDER = __dirname + '/testinput/'
if (!fs.existsSync(IN_FOLDER)) { fs.mkdirSync(IN_FOLDER); }

export function setup() {
    global.fileSystem = {}
}

export function cleanup() {
    delete global.fileSystem;
}

export class mockFileReader {
    callbacks = {};
    readAsDataURL = function (file) {
        // wait for load functions to get set. Dumb requirement for GLTFExporter to work. 
        this.result = file.text();

        if (this.result instanceof Blob) {
            // should only happen in async tests
            this.result.arrayBuffer().then(result => {
                this.result = result;
                this.triggersFuncs()
            })
        } else {
            this.triggersFuncs()
        }
    }
    readAsArrayBuffer = function (blob) {
        let enc = new TextEncoder(); // always utf-8
        let load = Promise.resolve();
        if (blob.isMockCanvas) {
            // mock canvas cannot be converted to dataURI, so return a fake one. 
            load = load.then(() => enc.encode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjAAAAHgCAYAAAC7J1fdAAAAAXNSR0IArs4c6QAAHAJJREFUeF7t3UuS'))
        } else if (blob instanceof Blob) {
            load = load.then(() => blob.arrayBuffer())
        } else {
            logInfo(blob)
            console.error('not implemented.')
        };
        load.then(result => {
            this.result = result;
            this.triggersFuncs()
        })
    }
    addEventListener = function (e, func) {
        this.callbacks[e] = func;
    }
    set onload(func) {
        this._onload = func;
        if (this.result) this._onload(result);
    }
    set onloadend(func) {
        this._onloadend = func;
        if (this.result) this._onloadend(result);
    }
    triggersFuncs = function () {
        if (this.callbacks.load) {
            this.callbacks.load(this.result)
        }
        if (this.callbacks.loadend) {
            this.callbacks.loadend(this.result)
        }
        if (this._onload) {
            this._onload(this.result)
        }
        if (this._onloadend) {
            this._onloadend(this.result)
        }

    }
}

export function mockFileSystemDirectoryHandle(directoryName) {
    this.permission = 'granted';
    this.queryPermission = () => {
        return Promise.resolve(this.permission)
    };
    this.requestPermission = () => Promise.resolve(this.permission);
    this.getFileHandle = (filename, config) => {
        return new Promise((resolve, reject) => {
            try {
                let f = new mockFileSystemFileHandle(directoryName + "/" + filename, config);
                resolve(f)
            } catch (e) {
                reject(e);
            }
        });
    }
    this.getDirectoryHandle = (dirName) => {
        return new Promise((resolve, reject) => {
            try {
                let f = new mockFileSystemDirectoryHandle(directoryName + "/" + dirName)
                resolve(f)
            } catch (e) {
                reject(e);
            }
        });
    }
}

export function loadRealFile(filename) {
    try {
        const contents = fs.readFileSync(IN_FOLDER + filename, { encoding: 'base64' });
        global.fileSystem[filename] = 'data:' + mime.getType(filename) + ";base64," + contents;
    } catch (e) {
        console.error(e);
    }
}

export function mockFileSystemFileHandle(filename, config) {
    this.name = filename;
    if (config && config.create && !global.fileSystem[filename]) { global.fileSystem[filename] = "new" }
    if (!global.fileSystem[filename]) {
        throw new Error("A requested file or directory could not be found at the time an operation was processed => fake filesystem: " +
            filename + " Existing files: " + (global.fileSystem ? JSON.stringify(Object.keys(global.fileSystem)) : "No filesystem: " + global.fileSystem));
    }
    this.getFile = () => new mockFile(global.fileSystem[filename], filename);
    this.createWritable = () => new mockFile(null, filename);
}

export function mockFile(data, filename, params = null) {
    this.name = filename;
    this.type = params ? params.type : null;

    // writing file
    this.write = (stream) => {
        if (Array.isArray(stream) && stream.length == 1) stream = stream[0];

        if (!stream) {
            console.error('invalid stream: ', stream);
        }

        if (filename.endsWith('glb') && stream instanceof Blob) {
            // GLTFExporter gives us an array buffer, convert to dataURL to match 
            // the rest of the imported files. 
            stream.arrayBuffer().then((s) => {
                const base64String = btoa(String.fromCharCode(...new Uint8Array(s)));
                stream = 'data:application/octet-stream;base64,' + base64String;
                global.fileSystem[filename] = stream;
            })
        } else if (stream instanceof ArrayBuffer) {
            let str = '';
            let bytes = new Uint8Array(stream);
            let len = bytes.byteLength;
            for (let i = 0; i < len; i++) { str += String.fromCharCode(bytes[i]); }
            global.fileSystem[filename] = str;
        } else if (typeof stream == 'string') {
            global.fileSystem[filename] = stream;
        } else if (stream.isMockCanvas) {
            global.fileSystem[filename] = stream;
        } else if (stream.isHackedBlob) {
            // so far this is only used for audio blobs
            let dataURL = stream.input.join('');
            global.fileSystem[filename] = dataURL;
        } else {
            console.error('unhandled data stream: ', stream)
        }
    }
    this.close = () => { };

    // reading file
    this.arrayBuffer = () => data;
    this.text = () => data;
}

let counter = 0;
export function exportGLTF(scene) {
    return new Promise((resolve, reject) => {
        const exporter = new GLTFExporter();
        exporter.parse(
            scene,
            function (gltf) {
                const filename = OUT_FOLDER + "testout" + Date.now() + "_" + (counter++) + ".glb";
                try {
                    fs.writeFileSync(filename, JSON.stringify(gltf), err => err ? console.error(err) : null);
                    resolve();
                } catch (e) {
                    console.error(e);
                    reject();
                }
            },
            function (error) {
                console.error(error);
                reject();
            });
    })
}

