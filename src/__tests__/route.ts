import { route, getRoutes } from "../route";
import { controller, ControllerMode } from "../controller";
import { body, param, query } from "../parameter-decorators";

test("`route()` throws when decorating a method on a non-@controller class", () => {
    expect(() => {
        class NotAController { //tslint:disable-line
            @route("GET", "/get")
            public method() {}
        }

        const noController = new NotAController();
        noController.method();
    }).toThrow();
});

test("`route()` registers on a class", () => {
    @controller()
    class TestController { //tslint:disable-line
        @route("GET", "/get")
        public method() {}
    }

    const test = new TestController();
    expect(getRoutes(test)).toMatchSnapshot();
});

test("when calling the route with the controller in `CLIENT` mode", () => {
    @controller({ mode: ControllerMode.CLIENT })
    class TestController { //tslint:disable-line
        @route("GET", "/get/:id")
        public method(@param("id") id: string, @body() thing: any, @query("search") search: string) {}
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
    class TestController { //tslint:disable-line
        @route("GET", "/get/:id")
        public method() {}
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
