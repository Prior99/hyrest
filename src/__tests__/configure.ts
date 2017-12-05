import { configureController, controller, ControllerMode } from "..";

[
    {
        throwOnError: true,
    },
    {
        errorHandler: (): undefined => undefined,
    },
    {
        baseUrl: "http://example.com/",
    },
    {
        mode: ControllerMode.CLIENT,
    },
    {
        mode: ControllerMode.SERVER,
    },
    {
        throwOnError: true,
        errorHandler: (): undefined => undefined,
        mode: ControllerMode.SERVER,
        baseUrl: "http://example.com/",
    },
].forEach(options => {
    test("`configureController` sets the options as expected", () => {
        @controller()
        class TestController {}

        const testController = new TestController();

        configureController(TestController, options);
        expect(Reflect.getMetadata("api:controller", TestController)).toMatchSnapshot();
    });
});

test("`configureController` throws an error when called with a non-@controller", () => {
    class NotAController {}
    expect(() => configureController(NotAController, {})).toThrowErrorMatchingSnapshot();
});
