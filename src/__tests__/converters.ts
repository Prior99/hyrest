import { int, float, str, obj } from "../converters";

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
