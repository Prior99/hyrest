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

test("`configureController` with an array of controllers", () => {
    @controller class TestController1 {}
    @controller class TestController2 {}
    @controller class TestController3 {}

    configureController([TestController1, TestController2, TestController3], {
        baseUrl: "http://example.com",
    });
    expect(Reflect.getMetadata("api:controller", TestController1)).toMatchSnapshot();
    expect(Reflect.getMetadata("api:controller", TestController2)).toMatchSnapshot();
    expect(Reflect.getMetadata("api:controller", TestController3)).toMatchSnapshot();
});
