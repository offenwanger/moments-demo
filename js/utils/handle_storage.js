// needed for storing file handles.
export const HandleStorage = function () {
    const DB_NAME = 'FileHandles';
    const OBJECT_STORE_NAME = 'HandleStore';
    let mDatabase = null;

    function getDatabase() {
        return new Promise((resolve, reject) => {
            if (mDatabase) {
                resolve(mDatabase);
                return;
            }

            let req = indexedDB.open(DB_NAME, 1);
            req.onerror = function () {
                reject(req.error.name);
            };
            req.onupgradeneeded = function () {
                // database did not yet exist
                req.result.createObjectStore(OBJECT_STORE_NAME);
            };
            req.onsuccess = function () {
                mDatabase = req.result;
                resolve(mDatabase);
            };
        });
    }

    function executeTransaction(type, storeCall) {
        return getDatabase()
            .then(database => new Promise((resolve, reject) => {
                let transaction = database.transaction([OBJECT_STORE_NAME], type);
                let store = transaction.objectStore(OBJECT_STORE_NAME);
                let req = storeCall(store);
                req.onerror = function () {
                    reject(req.error)
                }
                req.onsuccess = function () {
                    resolve(req.result)
                }
            }));

    }

    function getItem(key) {
        return executeTransaction('readonly', store => store.get(key));
    }

    function setItem(key, value) {
        return executeTransaction('readwrite', store => store.put(value, key));
    }

    function removeItem(key) {
        return executeTransaction('readwrite', store => store.delete(key));
    }

    function clear() {
        return executeTransaction('readwrite', store => store.clear());
    }

    return {
        getItem,
        setItem,
        removeItem,
        clear,
    };
}();