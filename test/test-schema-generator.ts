import {
    schemaFrom,
    createScope,
    scope,
    specify,
    Scope,
    is,
    validateSchema,
    email,
    oneOf,
    required,
    DataType,
} from "hyrest";

let A: Function, B: Function;
let scope1: Scope, scope2: Scope;

beforeEach(() => {
    scope1 = createScope();
    scope2 = createScope();

    class AInternal {
        @scope(scope1)
        @is(DataType.str).validate(email, required)
        public email: string;

        @scope(scope2)
        @is(DataType.int).validate(oneOf(1, 2, 3))
        public anInteger: number;
    }

    class BInternal {
        @scope(scope1) @is().validate(required)
        public a: AInternal;

        @scope(scope2) @is() @specify(() => AInternal)
        public as: AInternal[];

        @scope(scope1, scope2) @is() @specify(() => BInternal)
        public bs: BInternal[];
    }

    A = AInternal;
    B = BInternal;
});

[
    {
        a: { email: "test@example.com", anInteger: 1 },
        bs: [
            {
                a: { email: "some@example.com" },
                bs: [],
                as: [ { email: "some@example.com", anInteger: 3 }, { email: "an@example.com" } ],
            },
        ],
    },
    {
        a: { email: "foo@example.com" },
        bs: [],
    },
].forEach((input, index) => {
    test(`the generated schema detects valid inputs as valid (${index})`, async () => {
        expect(await validateSchema(schemaFrom(B), input)).toEqual({});
    });
});

[
    {
        a: { email: "test@example.com" },
        bs: [
            {
                a: { email: "some@example.com" },
                bs: [],
            },
        ],
    },
    {
        a: { email: "foo@example.com" },
        bs: [],
    },
].forEach((input, index) => {
    test(`the generated schema detects valid inputs as valid with a scope supplied (${index})`, async () => {
        expect(await is(DataType.obj).schema(schemaFrom(B)).scope(scope1)(input)).toMatchSnapshot();
    });
});

[
    {
        a: { email: "test@example.com" },
        bs: [],
        as: [],
    },
    {
        a: { email: "foo@example.com", anInteger: 1 },
    },
    {
        a: { email: "invalid-email" },
    },
].forEach((input, index) => {
    test(`the generated schema detects invalid inputs as invalid with a scope supplied (${index})`, async () => {
        expect(await is(DataType.obj).schema(schemaFrom(B)).scope(scope1)(input)).toMatchSnapshot();
    });
});

[
    {
        a: { email: "invalid-email" },
    },
    {
        a: { email: "some@exmaple.com", anInteger: 3.141 },
    },
    {
        a: { email: "some@exmaple.com", anInteger: 2 },
        bs: {
            a: { email: "some@exmaple.com", anInteger: 3 },
            bs: [],
        },
    },
    {
        a: { email: "some@exmaple.com", anInteger: 3 },
        bs: [
            {
                a: { email: "some@exmaple.com", anInteger: 3 },
                bs: [],
            },
        ],
        as: [
            {},
        ],
    },
    {
        a: { email: "some@exmaple.com", anInteger: 2 },
        bs: [ { dangling: "invalid" } ],
    },
    [],
].forEach((input, index) => {
    test(`the generated schema detects invalid inputs as invalid (${index})`, async () => {
        const result = await validateSchema(schemaFrom(B), input);
        expect(result).toMatchSnapshot();
        expect(result.hasErrors).toBe(true);
    });
});

test("throws an error if decorated incorrectly", () => {
    expect(() => {
        class C {
            @specify(() => String) @is()
            public test: string[];
        }
    }).toThrowErrorMatchingSnapshot();
});

[
    {},
    {
        parent: {
            parent: {
                parent: {
                    id: "some-id",
                },
            },
        },
    },
    {
        id: 10,
    },
    {
        parent: {
            parent: {
                parent: {
                    id: false,
                },
            },
        },
    },
].forEach((input, index) => {
    test(`with the class referencing itself ${index}`, async () => {
        class Class1 {
            @is()
            public id?: string;

            @is()
            public parent?: Class1;
        }
        expect(await validateSchema(schemaFrom(Class1), input)).toMatchSnapshot();
    });
});
