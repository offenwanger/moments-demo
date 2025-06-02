export const ActionType = {
    DELETE: 'delete',
    CREATE: 'create',
    UPDATE: 'update',
}

export function Transaction(actions = []) {
    // Invert requies the model before it was changed.
    function invert(model) {
        let rActions = [...this.actions].reverse();
        let invertedActions = [];
        for (let action of rActions) {
            if (action.type == ActionType.CREATE) {
                invertedActions.push(new Action(ActionType.DELETE, action.id))
            } else if (action.type == ActionType.UPDATE) {
                let existing = model.find(action.id);
                if (existing) {
                    let params = {}
                    for (let key of Object.keys(action.params)) {
                        params[key] = existing[key];
                    }
                    invertedActions.push(new Action(ActionType.UPDATE, action.id, params));
                } else {
                    // it was a non-event, ignore
                    // most likely caused by an out of sync update.
                }
            } else if (action.type == ActionType.DELETE) {
                let existing = model.find(action.id);
                if (existing) {
                    // it was an update so create the update undo
                    let params = {}
                    for (let key of Object.keys(existing)) {
                        if (key != 'id') params[key] = existing[key];
                    }
                    invertedActions.push(new Action(ActionType.CREATE, action.id, params));

                    let linked = model.findAllLinked(action.id);
                    for (let link of linked) {
                        let keys = Object.entries(link).filter(([key, value]) => value == action.id).map(([key, value]) => key);
                        let params = {}
                        for (let key of keys) {
                            params[key] = link[key];
                        }
                        invertedActions.push(new Action(ActionType.UPDATE, link.id, params));
                    }
                } else {
                    // it was a non-event, ignore
                    // most likely caused by an out of sync update.
                }
            }
        }
        return new Transaction(invertedActions);
    }

    if (!Array.isArray(actions)) {
        console.error('Invalid action array', actions);
        actions = [];
    }

    this.actions = actions;
    this.invert = invert;
}
Transaction.fromObject = function (obj) {
    if (!obj || !obj.actions) { console.error('Invalid obj, returning empty transaction'); return new Transaction(); }
    return new Transaction(obj.actions.map(aObj => new Action(aObj.type, aObj.id, aObj.params)));
}

export function Action(type, id, params = {}) {
    this.type = type;
    this.id = id;
    this.params = params;
}