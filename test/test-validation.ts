import "reflect-metadata";
import {
    is,
    getPropertyValidation,
    validateSchema,
    processValue,
    inferConverter,
    DataType,
    oneOf,
    required,
    length,
    specify,
} from "hyrest";

test("@is as parameter decorator infers the converter", async () => {
    class TestController {
        public method(@is() parameter1: string) {
            return;
        }
    }

    const controller = new TestController();
    const metadata = Reflect.getMetadata("validation:parameters", controller, "method");
    expect(await metadata.get(0).fullValidator("test", {})).toMatchSnapshot();
});

test("@is as parameter decorator", () => {
    const is1 = is(DataType.int);
    const is2 = is(DataType.float);
    const is3 = is(DataType.str).validate(oneOf("a", "b"));

    class TestController {
        public method(@is1 parameter1: number, @is2 parameter2: number, @is3 parameter3: string) {
            return;
        }
    }

    const controller = new TestController();

    const metadata = Reflect.getMetadata("validation:parameters", controller, "method");
    const expected = new Map();
    expected.set(0, { fullValidator: is1 });
    expected.set(1, { fullValidator: is2 });
    expected.set(2, { fullValidator: is3 });
    expect(metadata).toEqual(expected);
});

test("@is as property decorator", () => {
    const is1 = is(DataType.str).validate(oneOf("a", "b"), required);
    const is2 = is(DataType.int).validate(oneOf(1, 2, 3), required);

    class TestController {
        @is1 public test1: string;
        @is2 public test2: number;
    }

    const controller = new TestController();

    const metadata1 = Reflect.getMetadata("validation:property", controller, "test1");
    expect(metadata1).toEqual({ fullValidator: is1 });
    const metadata2 = Reflect.getMetadata("validation:property", controller, "test2");
    expect(metadata2).toEqual({ fullValidator: is2 });
    expect(getPropertyValidation(controller, "test2")).toEqual(metadata2);
});

[
    {
        testSchema: {
            a: is(DataType.int),
            b: is(DataType.float),
            c: is(DataType.str),
        },
        valid: [
            {
                a: 10,
                b: 23.5,
                c: "test",
            },
            {
                a: 10120,
                b: 123.5,
                c: "another string",
            },
        ] as any[],
        invalid: [
            {
                a: false,
                b: 123.5,
                c: "another string",
                d: "invalid",
            },
            {
                a: false,
            },
        ] as any[],
    },
    {
        testSchema: {
            arraOfArrays: is(DataType.arr(
                is(DataType.arr(
                    is(DataType.int).validate(oneOf(5, 6, 7)),
                )),
            )),
        },
        valid: [
            {
                arraOfArrays: [
                    [5, 6, 7],
                    [6, 7],
                    [],
                ],
            },
        ] as any[],
        invalid: [
            {
                arraOfArrays: [5],
            },
            {
                arraOfArrays: [
                    [8],
                ],
            },
        ] as any[],
    },
    {
        testSchema: {
            a: is(DataType.int).validate(oneOf(1, 2, 3, 4)),
            b: {
                c: is(DataType.int),
            },
            d: is(DataType.int).validate(required),
            e: is(DataType.arr(is(DataType.int).validate(oneOf(1, 2, 3)))),
            f: is(DataType.arr(is(DataType.obj).schema({
                g: is(DataType.str).validate(length(1, 5)),
            }))),
        },
        valid: [
            {
                a: 3,
                b: {
                    c: 19,
                },
                d: 8,
            },
            {
                d: 8,
                e: [1, 2, 1, 2, 1],
                f: [{ g: "foo" }, { g: "bar" }, { g: "bas" }, { g: "baz" } ],
            },
        ] as any[],
        invalid: [
            {
                a: 19,
                b: {
                    c: {
                        d: "test",
                    },
                },
            },
            {
                d: 8,
                e: [1, 2, 1, 3],
                f: [{ g: "loremipsum" }],
            },
            {
                d: 8,
                e: [5, 6, 20],
                f: [{ g: "test" }],
            },
            undefined,
        ] as any[],
    },

].forEach(({ valid, invalid, testSchema}) => {
    valid.forEach(input => {
        test("The test schema detects a valid input as valid", async () => {
            expect(await validateSchema(testSchema, input)).toEqual({});
        });
    });
    invalid.forEach(input => {
        test("The test schema detects a invalid input as invalid", async () => {
            expect(await validateSchema(testSchema, input)).toMatchSnapshot();
            expect((await validateSchema(testSchema, input)).hasErrors).toBe(true);
        });
    });
});

[
    {
        converter: DataType.str,
        validators: [oneOf("a", "b")],
        inputs: ["a", "b", "c", "", 1, null, undefined, {}, []], // tslint:disable-line
    },
    {
        converter: DataType.int,
        validators: [required],
        inputs: ["c", "", 10, null, undefined, {}, []], // tslint:disable-line
    },
].forEach(testCase => {
    testCase.inputs.forEach(input => {
        test("`processValue` processes inputs as expected", async () => {
            expect(await processValue(input, testCase.converter, testCase.validators)).toMatchSnapshot();
        });
    });
});

[
    {
        validator: DataType.arr(),
        tests: [
            [],
            [1, 2, 3],
            {},
            1,
            "",
            "1",
            null, // tslint:disable-line
            undefined,
            true,
        ],
    },
    {
        validator: DataType.arr(is(DataType.str)),
        tests: [
            [1, 2, 3, 4],
            ["a", "b", "c"],
            [],
            {},
            12,
        ],
    },
    {
        validator: DataType.arr(is(DataType.int).validate(oneOf(1, 2, 3))),
        tests: [
            [1, 2, 3],
            [1, 2],
            [1, 2, 3, 4],
            [],
            {},
            12,
        ],
    },
].forEach(testCase => {
    testCase.tests.forEach(input => {
        test("`arr` works as expected", async () => {
            expect(await testCase.validator(input)).toMatchSnapshot();
        });
    });
});

test("`inferConverter`", () => {
    expect(inferConverter(Number)).toBe(DataType.float);
    expect(inferConverter(String)).toBe(DataType.str);
    expect(inferConverter(Boolean)).toBe(DataType.bool);
    expect(inferConverter(Object)).toBe(DataType.obj);
    expect(inferConverter(Function)).toBe(DataType.obj);

    const stringArrayConverter = inferConverter(Array, String);
    const workingStringArrayConverter = DataType.arr(is(DataType.str));
    const correctArray = ["a", "b"];
    const incorrectArray = [1, 2];
    expect(stringArrayConverter(correctArray)).toEqual(workingStringArrayConverter(correctArray));
    expect(stringArrayConverter(incorrectArray)).toEqual(workingStringArrayConverter(incorrectArray));

    const workingUnknownArrayConverter = DataType.arr();
    const unknownArrayConverter = inferConverter(Array);
    expect(unknownArrayConverter(correctArray)).toEqual(workingUnknownArrayConverter(correctArray));
    expect(unknownArrayConverter(incorrectArray)).toEqual(workingUnknownArrayConverter(incorrectArray));
});

test("`processValue` without a converter", async () => {
    expect(await processValue("test", undefined, [])).toMatchSnapshot();
});

test("`@is` with no chance to infer the type", () => {
    expect(() => is()("test", { context: {} })).toThrowErrorMatchingSnapshot();
});

test("`@is` with the type specified explicitly in a parameter", async () => {
    class B {
        @is()
        public test: string;
    }
    class A {
        public method(@is() @specify(() => B) param: undefined) {
            return;
        }
    }
    const a = new A();
    const metadata = Reflect.getMetadata("validation:parameters", a, "method");
    expect(await metadata.get(0).fullValidator({ test: 9 }, {})).toMatchSnapshot();
});

test("`@is` with an array", async () => {
    class C {
        @is() public test: number;
    }
    class B {
        @is().validate(length(2, 10), required) @specify(() => C) public test: C[];
    }
    class A {
        public method(@is() param: B) {
            return;
        }
    }
    const a = new A();
    const metadata = Reflect.getMetadata("validation:parameters", a, "method");
    const validator = await metadata.get(0).fullValidator;
    expect(await validator({
        test: [],
    }, {})).toMatchSnapshot();
    expect(await validator({
        test: [{ test: 8 }, { test: 10 }, { test: 11 }],
    }, {})).toMatchSnapshot();
    expect(await validator({}, {})).toMatchSnapshot();
});

test("`@is` with an array and a failed validation inside", async () => {
    class C {
        @is().validate(oneOf(1, 2, 3)) public test: number;
    }
    class B {
        @is().validate(required) @specify(() => C) public test: C[];
    }
    class A {
        public method(@is() param: B) {
            return;
        }
    }
    const a = new A();
    const metadata = Reflect.getMetadata("validation:parameters", a, "method");
    const validator = await metadata.get(0).fullValidator;
    expect(await validator({
        test: [
            { test: 7 },
        ],
    }, {})).toMatchSnapshot();
});
