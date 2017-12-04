import { is, getPropertyValidation, validateSchema, processValue, inferConverter } from "../validation";
import { int, float, str, obj, bool, arr } from "../converters";
import { oneOf, required, length } from "../validators";
import { specify } from "../scope";

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
    const is1 = is(int);
    const is2 = is(float);
    const is3 = is(str).validate(oneOf("a", "b"));

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
    const is1 = is(str).validate(oneOf("a", "b"), required);
    const is2 = is(int).validate(oneOf(1, 2, 3), required);

    class TestController { // tslint:disable-line
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
            a: is(int),
            b: is(float),
            c: is(str),
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
        ],
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
        ],
    },
    {
        testSchema: {
            arraOfArrays: is(arr(
                is(arr(
                    is(int).validate(oneOf(5, 6, 7)),
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
        ],
        invalid: [
            {
                arraOfArrays: [5],
            },
            {
                arraOfArrays: [
                    [8],
                ],
            },
        ],
    },
    {
        testSchema: {
            a: is(int).validate(oneOf(1, 2, 3, 4)),
            b: {
                c: is(int),
            },
            d: is(int).validate(required),
            e: is(arr(is(int).validate(oneOf(1, 2, 3)))),
            f: is(arr(is(obj).schema({
                g: is(str).validate(length(1, 5)),
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
        ],
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
        ],
    },

].forEach(({ testSchema, valid, invalid }) => {
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
        converter: str,
        validators: [oneOf("a", "b")],
        inputs: ["a", "b", "c", "", 1, null, undefined, {}, []], // tslint:disable-line
    },
    {
        converter: int,
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
        validator: arr(),
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
        validator: arr(is(str)),
        tests: [
            [1, 2, 3, 4],
            ["a", "b", "c"],
            [],
            {},
            12,
        ],
    },
    {
        validator: arr(is(int).validate(oneOf(1, 2, 3))),
        tests: [
            [1, 2, 3],
            [1, 2],
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
    expect(inferConverter(Number)).toBe(float);
    expect(inferConverter(String)).toBe(str);
    expect(inferConverter(Boolean)).toBe(bool);
    expect(inferConverter(Object)).toBe(obj);
    expect(inferConverter(Function)).toBe(obj);

    const stringArrayConverter = inferConverter(Array, String);
    const workingStringArrayConverter = arr(is(str));
    const correctArray = ["a", "b"];
    const incorrectArray = [1, 2];
    expect(stringArrayConverter(correctArray)).toEqual(workingStringArrayConverter(correctArray));
    expect(stringArrayConverter(incorrectArray)).toEqual(workingStringArrayConverter(incorrectArray));

    const workingUnknownArrayConverter = arr();
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
    class B { // tslint:disable-line
        @is()
        public test: string;
    }
    class A { // tslint:disable-line
        public method(@is() @specify(() => B) param: undefined) {
        }
    }
    const a = new A();
    const metadata = Reflect.getMetadata("validation:parameters", a, "method");
    expect(await metadata.get(0).fullValidator({ test: 9 }, {})).toMatchSnapshot();
});
