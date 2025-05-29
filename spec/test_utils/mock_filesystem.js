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

export function mockFileReader() {
    this.callbacks = {};
    this.addEventListener = function (e, func) {
        this.callbacks[e] = func;
    }
    this.readAsDataURL = async function (file) {
        // wait for load functions to get set. Dumb requirement for GLTFExporter to work. 
        await new Promise(resolve => setTimeout(() => resolve(), 0))
        this.result = await file.text();
        if (this.callbacks.load) {
            this.callbacks.load(this.result)
        }
        if (this.callbacks.loadend) {
            this.callbacks.loadend(this.result)
        }
        if (this.onload) {
            this.onload(this.result)
        }
        if (this.onloadend) {
            this.onloadend(this.result)
        }
    }
    this.readAsArrayBuffer = async (blob) => {
        // GLTF exporter sets the load function after it calls read.
        // Putting in an await here causes that to get set. 
        await new Promise(resolve => setTimeout(() => resolve(), 0))

        // the this.result is important since GLTK expects it to be there. 
        this.result;
        let enc = new TextEncoder(); // always utf-8
        if (blob.isMockCanvas) {
            // mock canvas cannot be converted to dataURI, so return a fake one. 
            this.result = enc.encode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjAAAAHgCAYAAAC7J1fdAAAAAXNSR0IArs4c6QAAHAJJREFUeF7t3UuS');
        } else if (blob instanceof Blob) {
            // empty image.
            this.result = await blob.arrayBuffer();
        } else {
            logInfo(blob)
            console.error('not implemented.')
        };
        if (this.callbacks.load) {
            this.callbacks.load(this.result)
        }
        if (this.callbacks.loadend) {
            this.callbacks.loadend(this.result)
        }
        if (this.onload) {
            this.onload(this.result)
        }
        if (this.onloadend) {
            this.onloadend(this.result)
        }
    }
}

export function mockFileSystemDirectoryHandle(directoryName) {
    this.permission = 'granted';
    this.queryPermission = () => this.permission;
    this.requestPermission = () => this.permission;
    this.getFileHandle = (filename, config) => { return new mockFileSystemFileHandle(directoryName + "/" + filename, config) }
    this.getDirectoryHandle = (dirName) => { return new mockFileSystemDirectoryHandle(directoryName + "/" + dirName) }
}

export async function loadRealFile(filename) {
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
    this.getFile = () => new mockFile(filename, null, global.fileSystem[filename]);
    this.createWritable = () => new mockFile(filename);
}

export function mockFile(filename, type = null, text = null) {
    this.name = filename;
    this.type = type;

    // writing file
    this.write = (stream) => {
        if (filename.endsWith('glb') && stream instanceof ArrayBuffer) {
            // GLTFExporter gives us an array buffer, convert to dataURL to match 
            // the rest of the imported files. 
            const base64String = btoa(String.fromCharCode(...new Uint8Array(stream)));
            stream = 'data:application/octet-stream;base64,' + base64String;
        }

        if (stream instanceof ArrayBuffer) {
            let str = '';
            let bytes = new Uint8Array(stream);
            let len = bytes.byteLength;
            for (let i = 0; i < len; i++) { str += String.fromCharCode(bytes[i]); }
            global.fileSystem[filename] = str;
        } else if (typeof stream == 'string') {
            global.fileSystem[filename] = stream;
        } else {
            console.error('unhandled data stream: ', stream)
        }
    }
    this.close = () => { };

    // reading file
    this.arrayBuffer = () => text;
    this.text = () => text;
}

let counter = 0;
export async function exportGLTF(scene) {
    await new Promise((resolve, reject) => {
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

