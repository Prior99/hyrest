import { isBrowser } from "../is-browser";

test("`isBrowser()` in a browser returns `true`", () => {
    const oldProcess = process;
    expect(isBrowser()).toBe(true);
});

test("`isBrowser()` on a server returns `false`", () => {
    delete global.document;
    delete global.window;
    expect(isBrowser()).toBe(false);
});
