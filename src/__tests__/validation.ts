import { is, schema, getPropertyValidation, hasErrors } from "../validation";
import { int, float, str, obj } from "../converters";
import { oneOf, required } from "../validators";

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
            a: is(int).validate(oneOf(1, 2, 3, 4)),
            b: {
                c: is(int),
            },
            d: is(int).validate(required),
        },
        valid: [
            {
                a: 3,
                b: {
                    c: 19,
                },
                d: 8,
            },
            undefined,
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
        ],
    },

].forEach(({ testSchema, valid, invalid }) => {
    valid.forEach(input => {
        test("The test schema detects a valid input as valid", async () => {
            expect(await schema(testSchema)(input)).toEqual({});
        });
    });
    invalid.forEach(input => {
        test("The test schema detects a invalid input as invalid", async () => {
            expect(await schema(testSchema)(input)).toMatchSnapshot();
            expect(hasErrors(await schema(testSchema)(input))).toBe(true);
        });
    });
});
