import { schemaFrom } from "../schema-generator";
import { createScope, scope, arrayOf, Scope } from "../scope";
import { is, schema } from "../validation";
import { email, oneOf } from "../validators";
import { int, str, obj, arr } from "../converters";

let A, B: Function;
let scope1, scope2: Scope;

beforeEach(() => {
    scope1 = createScope();
    scope2 = createScope();

    class _A { //tslint:disable-line
        @scope(scope1)
        @is(str).validate(email)
        public email: string;

        @scope(scope2)
        @is(int).validate(oneOf(1, 2, 3))
        public anInteger: number;
    }

    class _B { //tslint:disable-line
        @scope(scope1) @is()
        public a: _A;

        @scope(scope2) @arrayOf(A) @is()
        public as: _A[];

        @scope(scope1, scope2) @arrayOf(B) @is()
        public bs: _B[];

    }

    A = _A;
    B = _B;
});

test("the generated schema is the same as a manually defined schema", () => {
    const schemaA = {
        email: is(str).validate(email),
        anInteger: is(int).validate(oneOf(1, 2, 3)),
    };
    let schemaB: any;
    schemaB = {
        a: is(obj).validate(schema(schemaA)),
        as: is(arr(is(obj).validate(schema(schemaA)))),
        bs: is(arr(is(obj).validate(schema(schemaB)))),
    };
    expect(schemaFrom(A)).toEqual(schemaA);
    expect(schemaFrom(B)).toEqual(schemaB);
});
