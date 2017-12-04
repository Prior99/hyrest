/**
 * Returns a list of all keys on the object specified as an argument
 * including all keys on the objects prototypes.
 *
 * @param obj The object to list the keys from.
 *
 * @return A list of all keys on the object.
 */
export function allKeys(obj: Object) {
    let current = obj;
    const keys = Object.keys(obj);
    while (true) {
        current = Object.getPrototypeOf(current);
        if (current === null) { // tslint:disable-line
            break;
        }
        Object.getOwnPropertyNames(current).forEach(key => {
            if (key === "__proto__" || key === "prototype") {
                return;
            }
            if (typeof Reflect.getOwnPropertyDescriptor(current, key).get !== "undefined") {
                keys.push(key);
            }
        });
    }
    return keys;
}
