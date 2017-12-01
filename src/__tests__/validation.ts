import { is, getPropertyValidation, validateSchema, arr, processValue, inferConverter } from "../validation";
import { int, float, str, obj, bool } from "../converters";
import { oneOf, required, length } from "../validators";

test("@is as parameter decorator", () => {
    class TestController {
        public method(
                @is(int) parameter1,
                @is(float) parameter2,
                @is(str).validate(oneOf("a", "b")) parameter3) {
            return;
        }
    }

    const controller = new TestController();

    const converters = Reflect.getMetadata("validation:parameters", controller, "method");
    expect(converters).toMatchSnapshot();
    expect(converters.get(0).converter("20")).toEqual({ value: 20 });
});

test("@is as property decorator", () => {
    class TestController {
        @is(str).validate(oneOf("a", "b"), required)
        public test1: string;

        @is(int).validate(oneOf(1, 2, 3), required)
        public test2: number;
    }

    const controller = new TestController();

    const converter1 = Reflect.getMetadata("validation:property", controller, "test1");
    expect(converter1).toMatchSnapshot();
    expect(converter1.converter("a")).toEqual({ value: "a" });
    const converter2 = Reflect.getMetadata("validation:property", controller, "test2");
    expect(converter2).toMatchSnapshot();
    expect(converter2.converter("2")).toEqual({ value: 2 });
    expect(getPropertyValidation(controller, "test2")).toEqual(converter2);
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
    // Array can not be tested this way but is implicitly tested by other tests.
    expect(inferConverter(Object)).toBe(obj);
    expect(inferConverter(Function)).toBe(obj);
});
