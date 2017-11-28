import { scope, createScope, dump } from "../scope";

const permissive = createScope();
const restricted = createScope().include(permissive);

class A { // tslint:disable-line
    @scope(permissive)
    public a: string;

    @scope(restricted)
    public b: number;
}

class B { // tslint:disable-line
    @scope(permissive)
    public permissiveA: A;

    @scope(restricted)
    public restrictedA: A;
}

class C { // tslint:disable-line
    @scope(permissive)
    public c: string;

    @scope(restricted)
    public d: number;

    @scope(permissive)
    public bs: B[];
}

const a1 = new A();
a1.a = "test1";
a1.b = 2;

const a2 = new A();
a2.a = "test3";
a2.b = 4;

const a3 = new A();
a3.a = "test5";
a3.b = 6;

const b1 = new B();
b1.permissiveA = a1;
b1.restrictedA = a2;

const b2 = new B();
b2.permissiveA = a3;
b2.restrictedA = a1;

const c = new C();
c.c = "test7";
c.d = 42;
c.bs = [b1, b2];

test("marking properties on a nested structure", () => {
    expect(restricted.properties).toMatchSnapshot();
    expect(permissive.properties).toMatchSnapshot();
});

test("marking properties on a nested structure with scopes and dumping them", () => {
    const dumpRestricted = dump(restricted, c);
    const dumpPermissive = dump(permissive, c);
    expect(dumpRestricted).toMatchSnapshot();
    expect(dumpPermissive).toMatchSnapshot();
    expect(dump(restricted)(c)).toEqual(dumpRestricted);
    expect(dump(permissive)(c)).toEqual(dumpPermissive);
});
