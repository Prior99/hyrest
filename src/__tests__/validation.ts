import { is, schema } from "../validation";
import { int, float, str, obj } from "../converters";
import { oneOf } from "../validators";

test("@is", () => {
    class TestController {
        public method(
                @is(int) parameter1,
                @is(float) parameter2,
                @is(str).validate(oneOf("a", "b")) parameter3) {
            return;
        }
    }

    const controller = new TestController();

    const converters = Reflect.getMetadata("api:route:validation", controller, "method");
    expect(converters).toMatchSnapshot();
    expect(converters.get(0).converter("20")).toEqual({ value: 20 });
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
        },
        valid: [
            {
                a: 3,
                b: {
                    c: 19,
                },
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
            expect(await schema(testSchema)(input)).toEqual({ error: "Schema validation failed." });
        });
    });
});
