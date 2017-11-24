import "reflect-metadata";

import { is, getConverters, integer, float, string, oneOf } from "../converters";

[
    "10",
    "1000",
    "0",
    "1237832",
    "1",
    "-1213",
    8,
    "10.0",
    "",
    {},
    [],
    "hello",
    "0.5",
    0.3,
    "-1234.2",
    "10.4",
    10.4,
    12397891239817987123123332232,
    "10foo",
    null, //tslint:disable-line
    undefined,
].forEach(input => {
    test(`integer handles "${input}" correctly`, () => {
        expect(integer(input)).toMatchSnapshot();
    });
});

[
    "1.0",
    "1.1",
    "10.0",
    "10",
    "-10",
    "-9.2",
    "foobar",
    8,
    {},
    [],
    10.9,
    217319823987123987192873123,
    "10foo",
    null, //tslint:disable-line
    undefined,
].forEach(input => {
    test(`float handles "${input}" correctly`, () => {
        expect(float(input)).toMatchSnapshot();
    });
});

[
    "",
    10,
    {},
    [],
    "test",
    "10",
    null, //tslint:disable-line
    undefined,
].forEach(input => {
    test(`string handles "${input}", correctly`, () => {
        expect(string(input)).toMatchSnapshot();
    });
});

[
    {
        options: [1, 2, 3, 5],
        values: [
            0,
            27,
            -1,
            "1",
            "test",
            {},
            [],
            null, //tslint:disable-line
            undefined,
        ],
    },
    {
        options: ["a", "b", "c"],
        values: [
            0,
            27,
            -1,
            "1",
            "test",
            {},
            [],
            null, //tslint:disable-line
            undefined,
        ],
    },
    {
        options: [],
        values: ["a"],
    },
].forEach(({ options, values }) => {
    values.forEach(value => {
        test(`oneOf detects "${value}" as invalid`, () => {
            expect(oneOf(...options)(value)).toMatchSnapshot();
        });
    });
    test("oneOf detects each option as valid", () => {
        options.forEach(option => {
            expect(oneOf(...options)(option)).toEqual({ value: option });
        });
    });
});

test("@is", () => {
    class TestController {
        public method(@is(integer) parameter1, @is(float) parameter2, @is(string) @is(oneOf("a", "b")) parameter3) {
            return;
        }
    }

    const controller = new TestController();

    const converters = Reflect.getMetadata("api:route:converters", controller, "method");
    expect(converters).toMatchSnapshot();
    expect(converters.get(0)[0].converter("20")).toEqual({ value: 20 });
});
