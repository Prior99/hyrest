import { is, getPropertyValidation, validateSchema, arr } from "../validation";
import { int, float, str, obj } from "../converters";
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
            f: is(arr(is(obj))).schema({
                g: is(str).validate(length(1, 5)),
            }).arr(),
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
