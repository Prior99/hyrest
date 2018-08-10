import { is, specify } from "hyrest";
import { field, hasFields, Field, ValidationStatus } from "hyrest-mobx";

class A {
    @is()
    public something: string;
}

class List {
    @is() @specify(() => A)
    public items: A[];
}

@hasFields(() => ({}))
class Container {
    @field(List) public list: Field<List>;
    @field(List) public anotherList: Field<List>;
}

let instance: Container;

beforeEach(() => instance = new Container());

test("with the status being valid", async () => {
    await instance.list.update({ items: [{ something: "a string" }] });
    expect(instance.list.nested.items.status).toBe(ValidationStatus.VALID);
    expect(instance.list.nested.items.valid).toBe(true);
    expect(instance.list.nested.items.invalid).toBe(false);
    expect(instance.list.nested.items.unknown).toBe(false);
    expect(instance.list.nested.items.inProgress).toBe(false);
});

test("with the status being invalid", async () => {
    await instance.list.update({ items: [{ something: 9 } as any] });
    expect(instance.list.nested.items.status).toBe(ValidationStatus.INVALID);
    expect(instance.list.nested.items.valid).toBe(false);
    expect(instance.list.nested.items.invalid).toBe(true);
    expect(instance.list.nested.items.unknown).toBe(false);
    expect(instance.list.nested.items.inProgress).toBe(false);
});

test("with the status being unkown", async () => {
    expect(instance.list.nested.items.status).toBe(ValidationStatus.UNKNOWN);
    expect(instance.list.nested.items.valid).toBe(false);
    expect(instance.list.nested.items.invalid).toBe(false);
    expect(instance.list.nested.items.unknown).toBe(true);
    expect(instance.list.nested.items.inProgress).toBe(false);
});

test("with the status being unkown", async () => {
    await instance.list.nested.items.add({ something: "a string" });
    instance.list.nested.items.at(0).nested.something.update("a string");
    expect(instance.list.nested.items.status).toBe(ValidationStatus.IN_PROGRESS);
    expect(instance.list.nested.items.valid).toBe(false);
    expect(instance.list.nested.items.invalid).toBe(false);
    expect(instance.list.nested.items.unknown).toBe(false);
    expect(instance.list.nested.items.inProgress).toBe(true);
});

test("resetting", async () => {
    await instance.list.update({ items: [{ something: "a string" }] });
    expect(instance.list.value).toMatchSnapshot();
    expect(instance.list.status).toBe(ValidationStatus.VALID);
    await instance.list.nested.items.reset();
    expect(instance.list.value).toMatchSnapshot();
    expect(instance.list.status).toBe(ValidationStatus.UNKNOWN);
});

test("length", async () => {
    expect(instance.list.nested.items.length).toBe(0);
    await instance.list.update({ items: [{ something: "a string" }] });
    expect(instance.list.nested.items.length).toBe(1);
});

test("concattenating", async () => {
    await instance.list.update({ items: [{ something: "a string" }] });
    await instance.anotherList.update({ items: [{ something: "another string" }] });
    const array = instance.list.nested.items.concat(instance.anotherList.nested.items);
    expect(array.length).toBe(2);
    expect(array.value).toMatchSnapshot();
});

test("slice", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
            { something: 78 } as any,
        ],
    });
    const subArray = instance.list.nested.items.slice(0, 2);
    expect(subArray.length).toBe(2);
    expect(subArray.value).toMatchSnapshot();
    expect(instance.list.nested.items.status).toBe(ValidationStatus.INVALID);
    expect(subArray.status).toBe(ValidationStatus.VALID);
});

test("indexOf", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    expect(instance.list.nested.items.indexOf(instance.list.nested.items.at(2))).toBe(2);
});

test("lastIndexOf", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    expect(instance.list.nested.items.lastIndexOf(instance.list.nested.items.at(0))).toBe(0);
});

test("every", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    expect(instance.list.nested.items.every(subField => subField.value.something.includes("string"))).toBe(true);
    expect(instance.list.nested.items.every(subField => subField.value.something.includes("1st"))).toBe(false);
});

test("some", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    expect(instance.list.nested.items.some(subField => subField.value.something.includes("4th"))).toBe(false);
    expect(instance.list.nested.items.some(subField => subField.value.something.includes("1st"))).toBe(true);
});

test("forEach", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    const strings: string[] = [];
    instance.list.nested.items.forEach(subField => strings.push(subField.value.something));
    expect(strings).toMatchSnapshot();
});

test("map", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    expect(instance.list.nested.items.map(subField => subField.value)).toMatchSnapshot();
});

test("filter", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
            { something: "4th string" },
            { something: "5th string" },
        ],
    });
    const newArray = instance.list.nested.items.filter(subField => subField.nested.something.value.includes("th"));
    expect(newArray.length).toBe(2);
    expect(newArray.value).toMatchSnapshot();
});

test("reduce", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    const reduced = instance.list.nested.items.reduce((result, subField) => {
        return `${result}-${subField.nested.something.value}`;
    }, "");
    expect(reduced).toMatchSnapshot();
});

test("reduceRight", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    const reduced = instance.list.nested.items.reduceRight((result, subField) => {
        return `${result}-${subField.nested.something.value}`;
    }, "");
    expect(reduced).toMatchSnapshot();
});

test("find", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    const foundField = instance.list.nested.items.find(subField => subField.nested.something.value === "2nd string");
    expect(instance.list.nested.items.indexOf(foundField)).toBe(1);
    expect(foundField.value).toMatchSnapshot();
});

test("findIndex", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    expect(instance.list.nested.items.findIndex(subField => subField.nested.something.value === "2nd string")).toBe(1);
});

test("valueAt", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
        ],
    });
    expect(instance.list.nested.items.valueAt(1)).toMatchSnapshot();
});

test("updating with existing fields", async () => {
    await instance.list.update({
        items: [
            { something: "1st string" },
            { something: "2nd string" },
            { something: "3rd string" },
        ],
    });
    expect(instance.list.status).toBe(ValidationStatus.VALID);
    await instance.list.nested.items.update([
        {},
        { something: 78 },
        {},
        { something: "4th string" },
    ] as any[]);
    expect(instance.list.status).toBe(ValidationStatus.INVALID);
    expect(instance.list.value).toMatchSnapshot();
});
