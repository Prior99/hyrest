import { configureRPC, controller, ControllerMode } from "..";

[
    {
        throwOnError: true,
    },
    {
        errorHandler: () => undefined,
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
        errorHandler: () => undefined,
        mode: ControllerMode.SERVER,
        baseUrl: "http://example.com/",
    },
].forEach(options => {
    test("`configureRPC` sets the options as expected", () => {
        @controller()
        class TestController {}

        const testController = new TestController();

        configureRPC(TestController, options);
        expect(Reflect.getMetadata("api:controller", TestController)).toMatchSnapshot();
    });
});

test("`configureRPC` throws an error when called with a non-@controller", () => {
    class NotAController {} //tslint:disable-line
    expect(() => configureRPC(NotAController, {})).toThrowErrorMatchingSnapshot();
});
