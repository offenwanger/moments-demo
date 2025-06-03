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