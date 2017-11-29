import { schemaFrom } from "../schema-generator";
import { createScope, scope, arrayOf, Scope } from "../scope";
import { is, schema } from "../validation";
import { email, oneOf, required } from "../validators";
import { int, str, obj, arr } from "../converters";

let A, B: Function;
let scope1, scope2: Scope;

beforeEach(() => {
    scope1 = createScope();
    scope2 = createScope();

    class _A { //tslint:disable-line
        @scope(scope1)
        @is(str).validate(email, required)
        public email: string;

        @scope(scope2)
        @is(int).validate(oneOf(1, 2, 3))
        public anInteger: number;
    }

    class _B { //tslint:disable-line
        @scope(scope1) @is().validate(required)
        public a: _A;

        @scope(scope2) @arrayOf(A) @is()
        public as: _A[];

        @scope(scope1, scope2) @arrayOf(B) @is()
        public bs: _B[];
    }

    A = _A;
    B = _B;
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
        expect(await schema(schemaFrom(B))(input)).toEqual({});
    });
});

[
    {},
    {
        bs: [],
    },
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
].forEach((input, index) => {
    test(`the generated schema detects invalid inputs as invalid (${index})`, async () => {
        expect(await schema(schemaFrom(B))(input)).toEqual({
            error: "Schema validation failed.",
        });
    });
});
