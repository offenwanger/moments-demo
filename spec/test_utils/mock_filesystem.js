import * as fs from 'fs';
import mime from 'mime';
import { dirname } from 'path';
import * as td from 'testdouble';
import { fileURLToPath } from 'url';
import { logInfo } from '../../js/utils/log_util.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FOLDER = __dirname + '/testoutput/'
if (!fs.existsSync(OUT_FOLDER)) { fs.mkdirSync(OUT_FOLDER); }
const IN_FOLDER = __dirname + '/testinput/'
if (!fs.existsSync(IN_FOLDER)) { fs.mkdirSync(IN_FOLDER); }

export async function setup() {
    global.fileSystem = {}
    await td.replaceEsm('fs', {
        existsSync: (folder) => {
            return global.fileSystem[folder] && global.fileSystem[folder].isDir;
        },
        mkdirSync: (folder) => {
            if (global.fileSystem[folder] && !global.fileSystem[folder].isDir) {
                console.error('dir shares name with file.')
            } else {
                global.fileSystem[folder] = { isDir: true }
            }
        },
        readFileSync: (filename) => {
            if (filename == './token.txt') { return 'faketoken' }
            if (global.fileSystem[filename]) {
                return global.fileSystem[filename];
            } else {
                console.error('File not in fake system')
            }
        },
        writeFileSync: (filename, contents, format) => {
            global.fileSystem[filename] = contents;
        }

    });
}

export async function cleanup() {
    delete global.fileSystem;
}

export class mockFileReader {
    callbacks = {};
    readAsDataURL = function (file) {
        let fileData = file.getFileData();
        if (Array.isArray(fileData) && fileData.length == 1) fileData = fileData[0]
        if (file.name.endsWith('glb') && fileData instanceof Blob) {
            // GLTFExporter gives us an array buffer, convert to dataURL to match 
            // the rest of the imported files. 
            fileData.arrayBuffer().then((s) => {
                const base64String = btoa(String.fromCharCode(...new Uint8Array(s)));
                this.result = 'data:application/octet-stream;base64,' + base64String;
                this.triggersFuncs()
            })
        } else if (fileData instanceof Blob) {
            // should only happen in async tests
            fileData.arrayBuffer().then(result => {
                this.result = result;
                this.triggersFuncs()
            });
        } else if (fileData.isHackedBlob) {
            if (Array.isArray(fileData.input) && fileData.input.length == 2 && typeof fileData.input[0] == 'string') {
                // it's our fake audio data uri
            }
            this.result = fileData.input.join('');
            this.triggersFuncs()
        } else if (fileData.isMockCanvas) {
            // mock canvas cannot be converted to dataURI, so return a fake one. 
            this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjAAAAHgCAYAAAC7J1fdAAAAAXNSR0IArs4c6QAAHAJJREFUeF7t3UuS';
            this.triggersFuncs()
        } else if (typeof fileData == 'string') {
            this.result = fileData;
            this.triggersFuncs()
        } else {
            console.error('conversion not implimented.')
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

    if (Array.isArray(data) && data.length == 1 && data[0] instanceof mockFile) data = data[0].getFileData();

    // writing file
    this.write = (data) => {
        if (Array.isArray(data) && data.length == 1) data = data[0];

        if (!data) {
            console.error('invalid data: ', data);
        }

        if (filename.endsWith('glb') && data instanceof Blob) {
            // GLTFExporter gives us an array buffer, convert to dataURL to match 
            // the rest of the imported files. 
            data.arrayBuffer().then((s) => {
                const base64String = btoa(String.fromCharCode(...new Uint8Array(s)));
                data = 'data:application/octet-stream;base64,' + base64String;
                global.fileSystem[filename] = data;
            })
        } else if (data instanceof ArrayBuffer) {
            let str = '';
            let bytes = new Uint8Array(data);
            let len = bytes.byteLength;
            for (let i = 0; i < len; i++) { str += String.fromCharCode(bytes[i]); }
            global.fileSystem[filename] = str;
        } else if (typeof data == 'string') {
            global.fileSystem[filename] = data;
        } else if (data.isMockCanvas) {
            global.fileSystem[filename] = data;
        } else if (data.isHackedBlob) {
            // so far this is only used for audio blobs
            let dataURL = data.input.join('');
            global.fileSystem[filename] = dataURL;
        } else {
            console.error('unhandled data stream: ', data)
        }
    }
    this.close = () => { };

    // reading file
    this.arrayBuffer = () => Promise.resolve(data);
    this.text = () => {
        if (typeof data !== 'string') {
            console.error('conversion not implemented.')
        }
        return data;
    }

    this.getFileData = () => data;
}
