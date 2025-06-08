
import { dirname } from 'path';
import syncFetch from 'sync-fetch';
import * as td from 'testdouble';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FOLDER = __dirname + '/testoutput/'

export async function mockServerSetup() {
    global.endpoints = { socketEndpoints: {} };
    // don't use real fetch but we'll keep track of it anyway.
    // might need to put it back some day.
    let realFetch = fetch;
    global.fetch = (request, data = {}) => {
        // req needs a body, res is the callback;
        let res = {
            status: () => { return res },
            send: () => { return res },
        }
        data.body ? data.body = JSON.parse(data.body) : '';
        if (global.endpoints[request]) {
            global.endpoints[request](data, res);
        } else {
            let result = syncFetch(request.url)
            return Promise.resolve(result);
        }
    }

    await td.replaceEsm('express', new mockExpress());
    await td.replaceEsm('path', new mockPath());
    await td.replaceEsm('child_process', new mockChildProcess());
    await td.replaceEsm('http', new mockHttp());
    await td.replaceEsm('socket.io', new mockSocketIO());
}

function mockPath() {
    return {
        default: {
            dirname: function (path) {
                // it's the app path
                if (path == 'C:\\Users\\annao\\OneDrive\\Desktop\\Moments\\Moments Code\\app.js') {
                    return OUT_FOLDER;
                } else {
                    return dirname(path);
                }
            }
        }
    }
}

function mockExpress() {
    let e = {
        default: function () {
            return {
                use: () => { },
                get: (endpoint, handler) => { global.endpoints[endpoint] = handler },
                post: (endpoint, handler) => { global.endpoints[endpoint] = handler }
            }
        }
    };
    e.default.static = () => { };
    return e;
}

function mockChildProcess() {
    return {
        spawn: function () {
            return {
                stdout: { on: () => { } },
                stderr: { on: () => { } },
                on: () => { },
            }
        },
        execSync: function () {
            return 'Did thing';
        },
    }
}

function mockHttp() {
    return {
        default: {
            createServer: () => {
                return {
                    listen: () => { }
                }
            }
        }
    }
}

function mockSocketIO() {
    return {
        Server: function () {
            this.on = function (event, handler) {
                global.endpoints.socketEndpoints[event] = handler;
            }
            this.emit = function (event, data) {
                console.error("Impliment me!")
            }
        }
    }
}