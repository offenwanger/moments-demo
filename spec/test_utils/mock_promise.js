// grab a reference to the real promise. 
let RealPromise = Promise;

export function mockResolvePromise(result) {
    return {
        then: (callback) => {
            try {
                let result2 = callback(result);
                if (!result2 || !result2.then) return new mockResolvePromise(result2);
                else return result2;
            } catch (e) {
                return new mockRejectPromise(e);
            }
        },
        catch: function () { return this; },
        finally: function (callback) { callback(); return this },
    }
}

export function mockRejectPromise(error) {
    return {
        then: function () { return this; },
        catch: (callback) => {
            try {
                let result2 = callback(error);
                if (!result2 || !result2.then) return new mockResolvePromise(result2);
                else return result2;
            } catch (e) {
                return new mockRejectPromise(e);
            }
        },
        finally: function (callback) { callback(); return this },
    }
}

export const mockPromiseSync = new Proxy(Promise, {
    construct(target, args) {
        // Force promises to call syncronously.
        let result = null;
        let error = null;
        if (typeof args[0] === 'function') {
            let promiseFund = args[0]
            let resolved = false;
            promiseFund(
                (r) => {
                    resolved = true;
                    result = r
                },
                (e) => {
                    error = e
                }
            );
        } else {
            result = args[0];
        }

        if (error) {
            return mockRejectPromise(error);
        } else {
            return mockResolvePromise(result);
        }
    }
});
export let mockPromiseSyncAll = (arr) => {
    let results = arr.map(p => {
        if (p.then) {
            let result;
            p.then(r => result = r);
            return result;
        } else return p;
    })
    return mockResolvePromise(results);
};

export function mockResponseSync(input) {
    this.arrayBuffer = function () {
        if (input instanceof ReadableStream) {
            let buffer = input.getBuffer();
            const arrayBuffer = new ArrayBuffer(buffer.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < buffer.length; ++i) {
                view[i] = buffer[i];
            }
            return mockResolvePromise(arrayBuffer);
        } else {
            console.error('Not handled');
        }
    }

};

export function mockReadableStreamSync(input) {
    // read in
    let buffer = null;
    input.start({
        close: () => { },
        enqueue: (value) => { buffer = value; }
    });

    this.getReader = () => {
        let count = 0;
        return {
            read: function () {
                if (count == 0) {
                    count++;
                    return mockResolvePromise({ done: false, value: buffer });
                } else {
                    return mockResolvePromise({ done: true });
                }

            }
        }
    }
    this.getBuffer = () => buffer;
};


function makePromiseAsync(type, args) {
    try {
        let promi;

        if (type == 'Promise') {
            promi = new global.RealPromise(...args);
        } else if (type == 'all') {
            promi = global.RealPromise.all(args[0])
        } else if (type == 'resolve') {
            promi = new global.RealPromise(resolve => resolve(args[0]))
        } else if (type == 'wrap') {
            promi = args;
        } else { console.error('Invalid call: ' + type); }

        promi.realThen = promi.then;
        promi.then = (...args) => {
            let returnable = promi.realThen(...args);
            if (!returnable.faked) makePromiseAsync('wrap', returnable)
            return returnable;
        }

        promi.realCatch = promi.catch;
        promi.catch = (...args) => {
            let returnable = promi.realCatch(...args);
            if (!returnable.faked) makePromiseAsync('wrap', returnable)
            return returnable;
        }

        promi.realFinally = promi.finally;
        promi.finally = (...args) => {
            let returnable = promi.realFinally(...args);
            if (!returnable.faked) makePromiseAsync('wrap', returnable)
            return returnable;
        }
        promi.faked = true;

        global.promises.push(promi);
        return promi;
    } catch (e) {
        console.error(e);
        console.error('Promise problems.')
    }
}

export async function clearPromises() {
    while (global.promises.length > 0) {
        let promises = global.promises;
        global.promises = [];
        for (let p of promises) {
            try {
                await p;
            } catch (e) { }
        }
    }
}


export function setup(runAsync = false) {
    global.RealBlob = Blob;
    global.RealPromise = Promise;
    global.RealPromiseResolve = Promise.resolve;
    global.RealPromiseAll = Promise.all;
    global.RealResponse = global.Response;
    global.RealReadableStream = global.ReadableStream;

    global.promises = [];
    if (!runAsync) {
        global.Blob = function (input) {
            // this is to get around async blob extraction calls
            let blb = new RealBlob(input);
            blb.input = input;
            blb.isHackedBlob = true;
            return blb;
        }

        global.Promise = mockPromiseSync;

        global.Promise.resolve = mockResolvePromise;
        global.Promise.all = mockPromiseSyncAll;
        // this is for hacking into the GLTF loader to make it syncronous.
        global.Response = mockResponseSync;
        global.ReadableStream = mockReadableStreamSync;
    } else {
        global.Promise = function (...args) {
            return makePromiseAsync('Promise', args);
        };
        global.Promise.resolve = function (...args) {
            return makePromiseAsync('resolve', args);
        };
        global.Promise.all = function (...args) {
            return makePromiseAsync('all', args);
        };
        // flags to help with log debugging
        global.Promise.resolve.faked = true
        global.Promise.all.faked = true
    }
}

export function cleanup() {
    global.Blob = global.RealBlob;
    global.Promise = global.RealPromise;
    global.Promise.resolve = global.RealPromiseResolve;
    global.Promise.all = global.RealPromiseAll;
    global.Response = global.RealResponse
    global.ReadableStream = global.RealReadableStream
    global.promises = [];
}