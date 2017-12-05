import { oneOf, required, email, length } from "../validators";

[
    {
        options: [1, 2, 3, 5] as any[],
        values: [
            0,
            27,
            -1,
            "1",
            "test",
            {},
            [],
            null, // tslint:disable-line
            undefined,
        ],
    },
    {
        options: ["a", "b", "c"] as any,
        values: [
            0,
            27,
            -1,
            "1",
            "test",
            {},
            [],
            null, // tslint:disable-line
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
        options.forEach((option: any) => {
            expect(oneOf(...options)(option)).toEqual({});
        });
    });
});

[
    undefined,
    null, // tslint:disable-line
    {},
    [],
    9,
    "",
].forEach(value => {
    test(`required detects "${value}" as expected`, () => {
        expect(required(value)).toMatchSnapshot();
    });
});

[
    undefined,
    null, // tslint:disable-line
    {},
    [],
    9,
    "",
    "test@",
    "test@example.com",
    "test@example",
].forEach(value => {
    test(`email detects "${value}" as expected`, () => {
        expect(email(value as any)).toMatchSnapshot();
    });
});

[
    {
        range: { min: 5 },
        tests: ["", "1", "test", "longertext", null, undefined] as any[], // tslint:disable-line
    },
    {
        range: { min: 5, max: 10 },
        tests: ["", "1", "test", "longertext", "reallylongtextthatexceeds10", 9] as any[],
    },
    {
        range: { max: 10 },
        tests: ["", "1", "test", "reallylongtextthatexceeds10", {}, []] as any[],
    },
].forEach(({ range, tests }) => {
    tests.forEach(value => {
        test(`length detects "${value}" as expected with ${range}`, () => {
            expect(length(range as any)(value)).toMatchSnapshot();
        });
    });
});

test("length with the input as args", () => {
    expect(length(1, 5)("")).toEqual({ error: `Shorter than minimum length of 1.` });
    expect(length(1, 5)("test")).toEqual({});
    expect(length(1, 5)("toolong")).toEqual({ error: `Exceeds maximum length of 5.` });
});
