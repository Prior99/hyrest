import { oneOf, required, email, length, uuid, range } from "hyrest";

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
        lengthRange: { min: 5 },
        tests: ["", "1", "test", "longertext", null, undefined] as any[], // tslint:disable-line
    },
    {
        lengthRange: { min: 5, max: 10 },
        tests: ["", "1", "test", "longertext", "reallylongtextthatexceeds10", 9] as any[],
    },
    {
        lengthRange: { max: 10 },
        tests: ["", "1", "test", "reallylongtextthatexceeds10", {}, []] as any[],
    },
].forEach(({ lengthRange, tests }) => {
    tests.forEach(value => {
        test(`length detects "${value}" as expected with ${lengthRange}`, () => {
            expect(length(lengthRange as any)(value)).toMatchSnapshot();
        });
    });
});

test("length with the input as args", () => {
    expect(length(1, 5)("")).toEqual({ error: `Shorter than minimum length of 1.` });
    expect(length(1, 5)("test")).toEqual({});
    expect(length(1, 5)("toolong")).toEqual({ error: `Exceeds maximum length of 5.` });
});

[
    undefined,
    null, // tslint:disable-line
    {},
    [],
    9,
    "",
    "test",
    "550e8400-e29b-11d4-a716-446655440000",
    "550e00-e29b-11d4-a716-446655440000",
    "550e8400-e29b-11d4-a716-4466554400",
].forEach(value => {
    test(`uuid detects "${value}" as expected`, () => {
        expect(uuid(value as any)).toMatchSnapshot();
    });
});

[
    {
        rangeRange: { min: 5 },
        tests: ["", 1, 0, 5, 6, null, undefined] as any[], // tslint:disable-line
    },
    {
        rangeRange: { min: 5, max: 10 },
        tests: ["", 1, 0, 5, 6, 9, 10, 11] as any[],
    },
    {
        rangeRange: { max: 10 },
        tests: ["", 0, 9, 10, 11, 1000, {}, []] as any[],
    },
].forEach(({ rangeRange, tests }) => {
    tests.forEach(value => {
        test(`range detects "${value}" as expected with ${rangeRange}`, () => {
            expect(range(rangeRange as any)(value)).toMatchSnapshot();
        });
    });
});

test("range with the input as args", () => {
    expect(range(1, 5)(0)).toEqual({ error: `Less than minimum of 1.` });
    expect(range(1, 5)(6)).toEqual({ error: `Exceeds maximum of 5.` });
    expect(range(1, 5)(4)).toEqual({});
});
