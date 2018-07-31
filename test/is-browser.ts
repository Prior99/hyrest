import { isBrowser } from "hyrest";

test("`isBrowser()` in a browser returns `true`", () => {
    const oldProcess = process;
    expect(isBrowser()).toBe(true);
});

test("`isBrowser()` on a server returns `false`", () => {
    delete (global as any).document;
    delete (global as any).window;
    expect(isBrowser()).toBe(false);
});
