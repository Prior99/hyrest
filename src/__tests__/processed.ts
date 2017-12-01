import { Processed } from "../processed";

test("Adding errors to `Processed`", () => {
    const processed = new Processed();
    processed.addErrors("test 1", "test 2", "test 3");
    expect(processed).toMatchSnapshot();
    processed.addErrors("test 4", "test 5");
    expect(processed).toMatchSnapshot();
});

test("Adding no errors to `Processed`", () => {
    const processed = new Processed();
    processed.addErrors();
    expect(processed).toMatchSnapshot();
});

test("Adding nested results to processed", () => {
    const processed = new Processed();
    processed.addNested("a", new Processed({ errors: ["test"] }));
    expect(processed).toMatchSnapshot();
    processed.addNested("b", new Processed({ errors: ["test"] }));
    expect(processed).toMatchSnapshot();
});

test("`Processed.hasErrors`", () => {
    const processed = new Processed();
    expect(processed.hasErrors).toBe(false);
    processed.addErrors("test");
    expect(processed.hasErrors).toBe(true);
});

test("`Processed.hasErrors` with nested results", () => {
    const processed = new Processed();
    const otherProcessed = new Processed();
    otherProcessed.addNested("b", new Processed({ errors: ["error"] }));
    processed.addNested("a", otherProcessed);
    expect(processed.hasErrors).toBe(true);
});

test("`Processed.merge`", () => {
    const processed = new Processed();
    processed.merge(new Processed({ value: "test" }));
    expect(processed).toMatchSnapshot();
    processed.merge(new Processed({ errors: ["test"] }));
    expect(processed).toMatchSnapshot();
    processed.merge(new Processed({
        nested: {
            a: new Processed({ errors: ["test"] }),
        },
    }));
    expect(processed).toMatchSnapshot();
    processed.merge(new Processed({ value: "invalid" }));
    expect(processed).toMatchSnapshot();
    processed.merge(new Processed({ errors: ["another test"] }));
    expect(processed).toMatchSnapshot();
    processed.merge(new Processed({
        nested: {
            a: new Processed({ errors: ["a second test"] }),
            b: new Processed({
                nested: {
                    c: new Processed({ errors: ["deeply nested"] }),
                },
            }),
        },
    }));
    expect(processed).toMatchSnapshot();
    processed.merge(new Processed({
        nested: {
            b: new Processed({
                nested: {
                    c: new Processed({ errors: ["another deeply nested one"] }),
                },
            }),
        },
    }));
    expect(processed).toMatchSnapshot();
    processed.merge(undefined);
    expect(processed).toMatchSnapshot();
});
