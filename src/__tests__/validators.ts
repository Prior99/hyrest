import { oneOf, required } from "../validators";

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
            expect(oneOf(...options)(option)).toEqual({});
        });
    });
});

[
    undefined,
    null, //tslint:disable-line
    {},
    [],
    9,
    "",
].forEach(value => {
    test(`required detects "${value}" as exepcted`, () => {
        expect(required(value)).toMatchSnapshot();
    });
});
