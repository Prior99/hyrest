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
    const keys = [];
    while (current !== null) { // tslint:disable-line
        const theseKeys = Object.keys(current);
        keys.push(...);
        theseKeys.forEach(key => console.log(Reflect.getOwnPropertyDescriptor(current, key)))
        current = Object.getPrototypeOf(current);
    }
    return keys;
}
