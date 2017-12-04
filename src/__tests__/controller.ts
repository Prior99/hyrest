import "isomorphic-fetch";

import { Controller, getDefaultControllerMode, controller } from "../controller";
import { ApiError, HTTPMethod  } from "../types";
import { scope, createScope } from "../scope";
import { is } from "../validation";
import { email, length, required } from "../validators";
import { ControllerMode } from "../";

let exampleController: Controller;

beforeEach(() => {
    exampleController = new Controller({
        baseUrl: "http://example.com",
    });
});

const urlParameters = {
    id: "some-id",
    other: "7",
};
const query = {
    search: "some-search&? -\\/",
    page: "7",
    size: "100",
    notDefined: undefined,
};
const body = {
    someKey: "some value",
    someArray: [1, 2, 3, 4],
};
const route = {
    target: controller,
    property: "thisMethodDoesNotExist",
    url: "/user/:id/other/:other",
    method: "GET" as HTTPMethod,
};

test("@controller and @controller()", () => {
    @controller
    class A { // tslint:disable-line
    }

    @controller()
    class B { // tslint:disable-line
    }

    @controller({ mode: ControllerMode.SERVER})
    class C { // tslint:disable-line
    }

    expect(Reflect.getMetadata("api:controller", A)).toMatchSnapshot();
    expect(Reflect.getMetadata("api:controller", B)).toMatchSnapshot();
    expect(Reflect.getMetadata("api:controller", C)).toMatchSnapshot();
});

test("`wrappedFetch` with a successfull response", async () => {
    const mock = jest.fn();
    global.fetch = mock;
    mock.mockReturnValue({
        json: () => ({
            message: "Everything went well.",
            data: {
                someThing: "Something else.",
            },
        }),
        ok: true,
    });

    const result = await exampleController.wrappedFetch(route, urlParameters, body, query);

    const headers = new Headers();
    headers.append("content-type", "application/json");
    const url = "http://example.com/user/some-id/other/7?search=some-search%26%3F%20-%5C%2F&page=7&size=100";
    expect(mock).toHaveBeenCalledWith(url, {
        body: JSON.stringify(body),
        headers,
        method: "GET",
    });
    expect(result).toEqual({
        someThing: "Something else.",
    });
});

test("`wrappedFetch` with broken json", async () => {
    const mockCall = jest.fn();
    global.fetch = mockCall;
    const error = new Error();
    mockCall.mockReturnValue({
        json: () => { throw error; },
        ok: true,
    });
    const mockErrorHandler = jest.fn();

    exampleController.configure({
        errorHandler: mockErrorHandler,
    });

    await expect(exampleController.wrappedFetch(route, urlParameters, body, query)).rejects.toEqual(error);
    expect(mockErrorHandler).toHaveBeenCalledWith(error);
});

describe("`wrappedFetch` with a non-2xx status code", () => {
    const error = new ApiError(400, { message: "Something went wrong." });

    beforeEach(() => {
        const mockCall = jest.fn();
        global.fetch = mockCall;
        mockCall.mockReturnValue({
            json: () => ({
                message: "Something went wrong.",
            }),
            ok: false,
            status: 400,
        });
    });

    test("with no error handler", async () => {
        await expect(exampleController.wrappedFetch(route, urlParameters, body, query)).rejects.toEqual(error);
    });

    test("with throwing disabled", async () => {
        exampleController.configure({ throwOnError: false });
        await expect(exampleController.wrappedFetch(route, urlParameters, body, query)).resolves;
    });

    test("with an error handler attached", async () => {
        const mockErrorHandler = jest.fn();

        exampleController.configure({
            errorHandler: mockErrorHandler,
        });

        await expect(exampleController.wrappedFetch(route, urlParameters, body, query)).rejects.toEqual(error);
        expect(mockErrorHandler).toHaveBeenCalledWith(error);
    });
});


test("`wrappedFetch` with a `.dump()` route", async () => {
    const login = createScope();

    class User { // tslint:disable-line
        @scope(login) @is().validate(email, required)
        public email: string;

        @scope(login) @is().validate(length(8, 100), required)
        public password: string;
    }

    const routeWithScope = {
        target: controller,
        property: "thisMethodDoesNotExist",
        url: "/user/:id/other/:other",
        method: "GET" as HTTPMethod,
        scope: login,
        returnType: User,
    };

    global.fetch = jest.fn();
    global.fetch.mockReturnValue({
        json: () => ({
            message: "Everything went well.",
            data: {
                email: "test@example.com",
                password: "asdfsadf",
            },
        }),
        ok: true,
    });

    const result = await exampleController.wrappedFetch(routeWithScope, urlParameters, body, query);
    expect(result).toMatchSnapshot();
    expect(result.constructor).toBe(User);
});

test("`getDefaultControllerMode()`", () => {
    expect(getDefaultControllerMode()).toBe(ControllerMode.CLIENT);
    delete global.document;
    delete global.window;
    expect(getDefaultControllerMode()).toBe(ControllerMode.SERVER);
});

test("`wrappedFetch` with a `.dump()` route and an array", async () => {
    const login = createScope();

    class User { // tslint:disable-line
        @scope(login) @is().validate(email, required)
        public email: string;
    }

    const routeWithScope = {
        target: exampleController,
        property: "thisMethodDoesNotExist",
        url: "/user/:id/other/:other",
        method: "GET" as HTTPMethod,
        scope: login,
        returnType: User,
    };

    global.fetch = jest.fn();
    global.fetch.mockReturnValue({
        json: () => ({
            message: "Everything went well.",
            data: [
                {
                    email: "test1@example.com",
                },
                {
                    email: "test2@example.com",
                },
                {
                    email: "test3@example.com",
                },
            ],
        }),
        ok: true,
    });

    const result = await exampleController.wrappedFetch(routeWithScope, urlParameters, body, query);
    expect(result).toMatchSnapshot();
});
