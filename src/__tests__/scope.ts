import { Scope, scope, createScope, dump, populate, arrayOf } from "../scope";


let permissive, restricted: Scope;
let A, B, C: Function;
let a1, a2, a3: any;
let b1, b2: any;
let c: any;

beforeEach(() => {
    permissive = createScope();
    restricted = createScope().include(permissive);

    class _A { // tslint:disable-line
        @scope(permissive)
        public a: string;

        @scope(restricted)
        public b: number;
    };

    class _B { // tslint:disable-line
        @scope(permissive)
        public permissiveA: _A;

        @scope(restricted)
        public restrictedA: _A;
    };

    class _C { // tslint:disable-line
        @scope(permissive)
        public c: string;

        @scope(restricted)
        public d: number;

        @scope(permissive) @arrayOf(_B)
        public bs: _B[];
    };
    A = _A;
    B = _B;
    C = _C;

    a1 = new _A();
    a1.a = "test1";
    a1.b = 2;

    a2 = new _A();
    a2.a = "test3";
    a2.b = 4;

    a3 = new _A();
    a3.a = "test5";
    a3.b = 6;

    b1 = new _B();
    b1.permissiveA = a1;
    b1.restrictedA = a2;

    b2 = new _B();
    b2.permissiveA = a3;
    b2.restrictedA = a1;

    c = new _C();
    c.c = "test7";
    c.d = 42;
    c.bs = [b1, b2];
});

test("marking properties on a nested structure", () => {
    expect(restricted.properties).toMatchSnapshot();
    expect(permissive.properties).toMatchSnapshot();
});

test("marking properties on a nested structure with scopes and dumping them", () => {
    const dumpRestricted = dump(restricted, c);
    const dumpPermissive = dump(permissive, c);
    expect(dumpRestricted).toMatchSnapshot();
    expect(dumpPermissive).toMatchSnapshot();
    expect(dump(restricted)(c)).toEqual(dumpRestricted);
    expect(dump(permissive)(c)).toEqual(dumpPermissive);
});

test("populating a marked and nested structure", () => {
    const input = {
        c: "foo",
        d: 42,
        dangling: "dangling",
        bs: [
            {
                permissiveA: { a: "lorem", b: 30, dangling: "test" },
                restrictedA: { a: "ipsum", b: 40, dangling: "test" },
            },
            {
                permissiveA: { a: "dolor", b: 50, dangling: "test" },
                restrictedA: { a: "sit", b: 60, dangling: "test" },
            },
            {},
        ],
    };
    const instanceRestricted: C = populate(restricted, C, input);
    const instancePermissive: C = populate(permissive, C, input);
    expect(instanceRestricted).toMatchSnapshot();
    expect(instancePermissive).toMatchSnapshot();
    expect(instanceRestricted.constructor).toEqual(C);
    expect(instanceRestricted.bs[0].constructor).toEqual(B);
    expect(instanceRestricted.bs[0].permissiveA.constructor).toEqual(A);
    expect(populate(restricted, C)(input)).toEqual(instanceRestricted);
    expect(populate(permissive, C)(input)).toEqual(instancePermissive);
});

test("populating and dumping a circular structure", () => {
    const scope1 = createScope();
    const scope2 = createScope();
    class Circular { // tslint:disable-line
        @scope(scope1)
        public property1: string;

        @scope(scope2)
        public property2: string;

        @scope(scope1)
        public circular1: Circular;

        @scope(scope2)
        public circular2: Circular;

        @scope(scope1, scope2) @arrayOf(Circular)
        public circularArray: Circular[];
    }

    const input = {
        property1: "foo",
        property2: "bar",
        circular1: {
            property1: "e",
            property2: "eunt",
            circular1: { property1: "c" },
            circular2: { property2: "d" },
            circularArray: [
                {
                    property1: "a",
                    property2: "b",
                    circular1: { property2: "edipiscir" },
                    circularArray: [],
                },
            ],
        },
        circular2: {
            property1: "amet",
            property2: "sit",
            circular1: { property1: "lol" },
            circular2: { property1: "rofl", circular2: {} },
            circularArray: [],
        },
        circularArray: [
            {
                property1: "baz",
                property2: "dolor",
                circular1: {},
                circular2: {},
                circularArray: [
                    { property1: "ipsum" },
                ],
            },
        ],
    };

    const populated1 = populate(scope1, Circular, input);
    const populated2 = populate(scope2, Circular, input);
    expect(populated1).toMatchSnapshot();
    expect(populated2).toMatchSnapshot();
    const dump1_1 = dump(scope1, populated1);
    const dump2_1 = dump(scope1, populated2);
    const dump1_2 = dump(scope2, populated1);
    const dump2_2 = dump(scope2, populated2);
    expect(dump1_1).toMatchSnapshot();
    expect(dump2_1).toMatchSnapshot();
    expect(dump1_2).toMatchSnapshot();
    expect(dump2_2).toMatchSnapshot();
});

test("populating a structure with an (un-)typed array", () => {
    const scope1 = createScope();

    class Untyped {// tslint:disable-line
        @scope(scope1)
        public test: string[];
    }

    class Typed {// tslint:disable-line
        @scope(scope1) @arrayOf(String)
        public test: string[];
    }

    const input = {
        test: ["a", "b", "c"],
    };

    expect(() => populate(scope1, Untyped, input)).toThrow();
    expect(() => populate(scope1, Typed, input)).not.toThrow();
    expect(populate(scope1, Typed, input)).toMatchSnapshot();
});

test("populating a structure with a not matching input", () => {
    const scope1 = createScope();

    class Class1 {// tslint:disable-line
        @scope(scope1)
        public test: boolean;
    }

    class Class2 {// tslint:disable-line
        @scope(scope1)
        public test: Class1;
    }

    expect(() => populate(scope1, Class2, { test: "a" })).toThrow();
    expect(() => populate(scope1, Class2, { test: 1 })).toThrow();
    expect(() => populate(scope1, Class2, { test: [] })).toThrow();
    expect(() => populate(scope1, Class2, { test: false })).toThrow();
    expect(() => populate(scope1, Class2, { test: { test: 3 }})).not.toThrow();
});

test("populating a structure with a not matching input", () => {
    const scope1 = createScope();

    class Class1 {// tslint:disable-line
        @scope(scope1)
        public test: boolean;
    }

    class Class2 {// tslint:disable-line
        @scope(scope1)
        public test: Class1;
    }

    expect(() => populate(scope1, Class2, { test: "a" })).toThrow();
    expect(() => populate(scope1, Class2, { test: 1 })).toThrow();
    expect(() => populate(scope1, Class2, { test: [] })).toThrow();
    expect(() => populate(scope1, Class2, { test: false })).toThrow();
    expect(() => populate(scope1, Class2, { test: { test: 3 }})).not.toThrow();
});

test("populating a structure with an `any` or `interface` type", () => {
    const scope1 = createScope();

    interface I {
        test: boolean;
    }

    class Class1 {// tslint:disable-line
        @scope(scope1)
        public test1: any;

        @scope(scope1)
        public test2: I;
    }

    expect(populate(scope1, Class1, { test1: "a", test2: {} })).toMatchSnapshot();
    expect(populate(scope1, Class1, { test1: 1, test2: { test: false } })).toMatchSnapshot();
    expect(populate(scope1, Class1, { test1: [], test2: [] })).toMatchSnapshot();
    expect(populate(scope1, Class1, { test1: false, test2: { test: true } })).toMatchSnapshot();
    expect(populate(scope1, Class1, { test1: {}})).toMatchSnapshot();
});
