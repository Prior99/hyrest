import { Scope, scope, createScope, dump, populate, specify, precompute } from "../scope";
import { Constructable } from "../types";

let permissive: Scope, restricted: Scope;
let A: Constructable<any>, B: Constructable<any>, C: Constructable<any>;
let a1: any, a2: any, a3: any;
let b1: any, b2: any;
let c: any;

beforeEach(() => {
    permissive = createScope();
    restricted = createScope().include(permissive);

    class AInternal {
        @scope(permissive)
        public a: string;

        @scope(restricted)
        public b: number;
    }

    class BInternal {
        @scope(permissive)
        public permissiveA: AInternal;

        @scope(restricted)
        public restrictedA: AInternal;
    }

    class CInternal {
        @scope(permissive)
        public c: string;

        @scope(restricted)
        public d: number;

        @scope(permissive) @specify(() => BInternal)
        public bs: BInternal[];
    }

    A = AInternal;
    B = BInternal;
    C = CInternal;

    a1 = new AInternal();
    a1.a = "test1";
    a1.b = 2;

    a2 = new AInternal();
    a2.a = "test3";
    a2.b = 4;

    a3 = new AInternal();
    a3.a = "test5";
    a3.b = 6;

    b1 = new BInternal();
    b1.permissiveA = a1;
    b1.restrictedA = a2;

    b2 = new BInternal();
    b2.permissiveA = a3;
    b2.restrictedA = a1;

    c = new CInternal();
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
    const instanceRestricted = populate(restricted, C, input);
    const instancePermissive = populate(permissive, C, input);
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
    class Circular {
        @scope(scope1)
        public property1: string;

        @scope(scope2)
        public property2: string;

        @scope(scope1)
        public circular1: Circular;

        @scope(scope2)
        public circular2: Circular;

        @scope(scope1, scope2) @specify(() => Circular)
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
                    circularArray: [] as any[],
                },
            ],
        },
        circular2: {
            property1: "amet",
            property2: "sit",
            circular1: { property1: "lol" },
            circular2: { property1: "rofl", circular2: {} },
            circularArray: [] as any[],
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

    class Untyped {
        @scope(scope1)
        public test: string[];
    }

    class Typed {
        @scope(scope1) @specify(() => String)
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

    class Class1 {
        @scope(scope1)
        public test: boolean;
    }

    class Class2 {
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

    class Class1 {
        @scope(scope1)
        public test: boolean;
    }

    class Class2 {
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

    class Class1 {
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

test("populating a structure with a setter", () => {
    const scope1 = createScope();
    const mock = jest.fn();

    class Class1 {
        @scope(scope1)
        public set test(num: number) { mock(num); }
    }
    populate(scope1, Class1, { test: 29 });
    expect(mock).toHaveBeenCalledWith(29);
});

test("dumping a structure with a getter", () => {
    const scope1 = createScope();

    class Class1 {
        @scope(scope1)
        public get test1() { return 1; }
    }

    class Class2 extends Class1 {
        @scope(scope1)
        public get test2() { return 2; }
    }
    expect(dump(scope1, new Class2())).toEqual({
        test1: 1,
        test2: 2,
    });
});

test("dumping an array", () => {
    const scope1 = createScope();

    class Class1 {
        constructor(test: string) {
            this.test = test;
        }

        @scope(scope1)
        public test: string;
    }
    expect(dump(scope1, [
        new Class1("a"),
        new Class1("b"),
        new Class1("c"),
    ])).toEqual([
        { test: "a" },
        { test: "b" },
        { test: "c" },
    ]);
});

test("dumping null in an array", () => {
    const scope1 = createScope();

    class Class1 {}

    expect(dump(scope1, [
        null, // tslint:disable-line
    ])).toEqual([
        null, // tslint:disable-line
    ]);
});

test("populating an array", () => {
    const scope1 = createScope();

    class Class1 {
        @scope(scope1)
        public test: string;
    }
    const aInstance = new Class1();
    aInstance.test = "a";
    const bInstance = new Class1();
    bInstance.test = "b";
    const cInstance = new Class1();
    cInstance.test = "c";
    const expected = [ aInstance, bInstance, cInstance ];
    const input = [ { test: "a" }, { test: "b" }, { test: "c" } ];
    expect(populate(scope1, Array, Class1 as any, input)).toEqual(expected);
    expect((populate(scope1, Array, Class1 as any) as any)(input)).toEqual(expected);
});

test("populating a cyclic dependency", () => {
    const scope1 = createScope();

    class Class1 {
        @scope(scope1) @specify(() => Class2)
        public class2: undefined;
    }

    class Class2 {
        @scope(scope1) @specify(() => Class1)
        public class1: undefined;
    }

    expect(populate(scope1, Class1, {
        class2: {
            class1: {
                class2: {
                    class1: {},
                },
            },
        },
    })).toMatchSnapshot();
});

test("populating a cyclic dependency with no type specified", () => {
    const scope1 = createScope();

    class Class1 {
        @scope(scope1)
        public class2: undefined;
    }

    class Class2 {
        @scope(scope1)
        public class1: undefined;
    }

    expect(() => populate(scope1, Class1, {
        class2: {
            class1: {
                class2: {
                    class1: {},
                },
            },
        },
    })).toThrowErrorMatchingSnapshot();
});

test("populating and dumping a structure with a date", () => {
    const scope1 = createScope();

    class Class1 {
        constructor(date?: Date) {
            this.date = date;
        }

        @scope(scope1)
        public date: Date;
    }

    const originalDate = new Date("2017-12-16T08:35:29.390Z");
    const original = new Class1(originalDate);
    expect(dump(scope1, original)).toMatchSnapshot();
    expect(populate(scope1, Class1, { date: originalDate })).toMatchSnapshot();
    expect(populate(scope1, Class1, dump(scope1, original))).toEqual(original);
});

test("populating and dumping structure with a date from a string", () => {
    const scope1 = createScope();

    class Class1 {
        @scope(scope1) @specify(() => Date)
        public date: Date;
    }

    const dateString = "2017-12-16T08:35:29.390Z";
    const date = new Date(dateString);
    const result = populate(scope1, Class1, { date: dateString });
    expect(result).toMatchSnapshot();
    expect(typeof result.date).toBe("object");
    expect(result.date.constructor).toBe(Date);
    expect(populate(scope1, Class1, dump(scope1, result))).toEqual(result);
    expect(dump(scope1, result)).toMatchSnapshot();
});

test("dumping a structure with an array of dates", () => {
    const scope1 = createScope();

    class Class1 {
        @scope(scope1) @specify(() => Date)
        public date: Date;
    }

    class Class2 {
        @scope(scope1) @specify(() => Class1)
        public class1s: Class1[];
    }

    const date1 = new Date("2017-12-16T08:00:00Z");
    const date2 = new Date("2017-12-16T08:00:00Z");
    const instance1 = new Class1();
    instance1.date = date1;
    const instance2 = new Class1();
    instance2.date = date2;
    const class2 = new Class2();
    class2.class1s = [instance1, instance2];
    expect(dump(scope1, class2)).toMatchSnapshot();
    expect(populate(scope1, Class2, dump(scope1, class2))).toEqual(class2);
});

test("populating and dumping a @precompute getter", () => {
    const scope1 = createScope();

    class Class1 {
        private value: string;

        constructor(value?: string) {
            this.value = value;
        }

        @scope(scope1) @precompute
        public get property() {
            return this.value;
        }
    }

    const instance = new Class1("some test");
    const dumped = dump(scope1, instance);
    expect(dumped).toMatchSnapshot();
    const populated = populate(scope1, Class1, dumped);
    expect(populated.constructor).toBe(Class1);
    expect(populated).toMatchSnapshot();
});
