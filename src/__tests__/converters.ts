import { int, float, str, obj, arr } from "../converters";
import { required, length } from "../validators";
import { is, schema } from "../validation";

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
    test(`int handles "${input}" correctly`, () => {
        expect(int(input)).toMatchSnapshot();
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
    test(`str handles "${input}", correctly`, () => {
        expect(str(input)).toMatchSnapshot();
    });
});

[
    "",
    10,
    {},
    [],
    {
        nested: {},
    },
    "10",
    null, //tslint:disable-line
    undefined,
].forEach(input => {
    test(`obj handles "${input}", correctly`, () => {
        expect(obj(input)).toMatchSnapshot();
    });
});

[
    {
        dataType: is(str).validate(length(1, 3)),
        tests: [
            ["hi", "yo", "1"],
            ["hi", "yo", "1", ""],
            [1, 2, 3, 4],
            ["1", "2", 3],
            [],
        ],
    },
    {
        dataType: is(obj).schema({ value: is(int).validate(required) }),
        tests: [
            [ { value: 5 }, { value: 1 }, { value: 100} ],
            [ {}, { value: 1 }, { value: 100} ],
            [ { value: "test" } ],
            [],
            {},
            null, //tslint:disable-line
            undefined,
        ],
    },
].forEach(({ dataType, tests }) => {
    tests.forEach(value => {
        test("arr with a specific datatype and input detects it as expected", async () => {
            expect(await arr(dataType)(value)).toMatchSnapshot();
        });
    });
});
