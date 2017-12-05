import { route, getRoutes } from "../route";
import { controller, ControllerMode } from "../controller";
import { body, param, query } from "../parameters";
import { ok } from "../answers";

test("`route()` throws when decorating a method on a non-@controller class", () => {
    expect(() => {
        class NotAController {
            @route("GET", "/get")
            public method() {
                return;
            }
        }

        const noController = new NotAController();
        noController.method();
    }).toThrow();
});

test("`route()` registers on a class", () => {
    @controller()
    class TestController {
        @route("GET", "/get")
        public method() {
            return;
        }
    }

    const test = new TestController();
    expect(getRoutes(test)).toMatchSnapshot();
});

test("when calling the route with the controller in `CLIENT` mode", () => {
    @controller({ mode: ControllerMode.CLIENT })
    class TestController {
        @route("GET", "/get/:id")
        public method(@param("id") id: string, @body() thing: any, @query("search") search: string) {
            return;
        }
    }

    const mock = jest.fn();

    const test = new TestController();
    Reflect.getMetadata("api:controller", TestController).wrappedFetch = mock;
    const routes = Reflect.getMetadata("api:routes", test);
    test.method("some-id", { some: "Thing." }, "a query");
    expect(mock).toHaveBeenCalledWith({
        method: "GET",
        url: "/get/:id",
        property: "method",
        target: routes[0].target,
        options: undefined,
    }, {
        id: "some-id",
    }, {
        some: "Thing.",
    }, {
        search: "a query",
    });
});

test("when calling the route with the controller in `CLIENT` mode with no injects", () => {
    @controller({ mode: ControllerMode.CLIENT })
    class TestController {
        @route("GET", "/get/:id")
        public method() {
            return;
        }
    }

    const mock = jest.fn();

    const test = new TestController();
    Reflect.getMetadata("api:controller", TestController).wrappedFetch = mock;
    const routes = Reflect.getMetadata("api:routes", test);
    test.method();
    expect(mock).toHaveBeenCalledWith({
        method: "GET",
        url: "/get/:id",
        property: "method",
        target: routes[0].target,
        options: undefined,
    }, {}, undefined, {});
});

test("when calling the route with the controller in `SERVER` mode", () => {
    @controller({ mode: ControllerMode.SERVER })
    class TestController {
        @route("GET", "/get/:id")
        public method(@param("id") id: string, @body() thing: any, @query("search") search: string) {
            return ok({ id, thing, search });
        }
    }

    const test = new TestController();
    expect(test.method("some-id", { property: "test" }, "query")).toEqual({
        id: "some-id",
        thing: { property: "test" },
        search: "query",
    });
});

test("@route preserves `this`", () => {
    const mock = jest.fn();

    @controller({ mode: ControllerMode.SERVER })
    class TestController {
        @route("GET", "/get")
        public method() {
            mock(this);
            return ok();
        }
    }

    const test = new TestController();
    test.method();
    expect(mock.mock.calls[0][0]).toBe(test);
});
