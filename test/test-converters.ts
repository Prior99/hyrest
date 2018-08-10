import { FullValidator, DataType, is, length, required } from "hyrest";

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
    null, // tslint:disable-line
    undefined,
].forEach(input => {
    test(`int handles "${input}" correctly`, () => {
        expect(DataType.int(input)).toMatchSnapshot();
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
    null, // tslint:disable-line
    undefined,
].forEach(input => {
    test(`float handles "${input}" correctly`, () => {
        expect(DataType.float(input)).toMatchSnapshot();
    });
});

[
    "",
    10,
    {},
    [],
    "test",
    "10",
    null, // tslint:disable-line
    undefined,
].forEach(input => {
    test(`str handles "${input}", correctly`, () => {
        expect(DataType.str(input)).toMatchSnapshot();
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
    null, // tslint:disable-line
    undefined,
].forEach(input => {
    test(`obj handles "${input}", correctly`, () => {
        expect(DataType.obj(input)).toMatchSnapshot();
    });
});

[
    {
        dataType: is(DataType.str).validate(length(1, 3)),
        tests: [
            ["hi", "yo", "1"], // Snapshot 1.
            ["hi", "yo", "1", ""], // Snapshot 2.
            [1, 2, 3, 4], // Snapshot 3.
            ["1", "2", 3], // Snapshot 4.
            [], // Snapshot 5.
        ],
    },
    {
        dataType: is(DataType.obj).schema({ value: is(DataType.int).validate(required) }),
        tests: [
            [ { value: 5 }, { value: 1 }, { value: 100} ], // Snapshot 6.
            [ {}, { value: 1 }, { value: 100} ], // Snapshot 7.
            [ { value: "test" } ], // Snapshot 8.
            [], // Snapshot 9.
            {}, // Snapshot 10.
            null, // tslint:disable-line
            undefined,
        ],
    },
].forEach(({ dataType, tests }: { dataType: FullValidator<any, any>, tests: any[][] }) => {
    tests.forEach(value => {
        test("arr with a specific datatype and input detects it as expected", async () => {
            expect(await DataType.arr(dataType)(value)).toMatchSnapshot();
        });
    });
});

test("arr with a validator and an empty array", async () => {
    expect(await DataType.arr(is(DataType.obj).schema({ test: is(DataType.str) }))([])).toMatchSnapshot();
});

test("arr with a validator and a non-empty array", async () => {
    expect(await DataType.arr(is(DataType.obj).schema({ test: is(DataType.str) }))([
        { test: "a" },
        { test: "b" },
    ])).toMatchSnapshot();
});

[
    true,
    false,
    "true",
    "false",
    "",
    10,
    {},
    [],
    {
        nested: {},
    },
    "10",
    null, // tslint:disable-line
    undefined,
].forEach(input => {
    test(`bool handles "${input}", correctly`, () => {
        expect(DataType.bool(input)).toMatchSnapshot();
    });
});
