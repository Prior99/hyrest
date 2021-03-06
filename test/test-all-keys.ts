import { allKeys } from "hyrest";

class A {
    public get testA() { return "a"; }
}

class B extends A {
    public b: number;

    public get testB() { return "b"; }

    public set setter(arg: number) {
        return;
    }
}

class C extends B {
    public c: number;

    public get testC() { return "c"; }

    public dangling() {
        return 0;
    }
}

test("`allKeys`", () => {
    const c = new C();
    c.c = 1;
    c.b = 0;
    expect(allKeys(c)).toEqual([
        "c", "b", "testC", "testB", "testA",
    ]);
});
