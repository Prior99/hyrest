import "isomorphic-fetch";

import { ControllerMode, Controller, getDefaultControllerMode, controller, buildUrl } from "../controller";
import { ApiError, HTTPMethod , Params } from "../types";
import { scope, createScope } from "../scope";
import { is } from "../validation";
import { email, length, required } from "../validators";
import { route } from "../route";
import { ok } from "../answers";
import { configureController } from "../configure";
import { query, body, param } from "../";

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
const queryMock = {
    search: "some-search&? -\\/",
    page: "7",
    size: "100",
    notDefined: undefined as any,
};
const bodyMock = {
    someKey: "some value",
    someArray: [1, 2, 3, 4],
};
const artificialRoute = {
    target: controller,
    property: "thisMethodDoesNotExist",
    url: "/user/:id/other/:other",
    method: "GET" as HTTPMethod,
};

[
    {
        urlParams: {},
        queryParams: {},
        baseUrl: "http://example.com",
        subUrl: "/user",
    },
    {
        urlParams: { a: "a", b: "b"},
        queryParams: {},
        baseUrl: "http://example.com",
        subUrl: "/:a/:b",
    },
    {
        urlParams: {
            userId: "some-user-id",
            gameId: "some-game-id",
            round: "45",
        },
        queryParams: {
            search: "name",
        },
        baseUrl: "http://example.com",
        subUrl: "/user/:userId/game/:gameId/:round",
    },
].forEach(({ urlParams, queryParams, baseUrl, subUrl}) => {
    test("`buildUrl`", () => {
        expect(buildUrl(urlParams, queryParams, baseUrl, subUrl)).toMatchSnapshot();
    });
});

test("@controller and @controller()", () => {
    @controller
    class A {
    }

    @controller()
    class B {
    }

    @controller({ mode: ControllerMode.SERVER})
    class C {
    }

    expect(Reflect.getMetadata("api:controller", A)).toMatchSnapshot();
    expect(Reflect.getMetadata("api:controller", B)).toMatchSnapshot();
    expect(Reflect.getMetadata("api:controller", C)).toMatchSnapshot();
});

test("`wrappedFetch` with a successfull response", async () => {
    const mock = jest.fn();
    (global as any).fetch = mock;
    mock.mockReturnValue({
        json: () => ({
            message: "Everything went well.",
            data: {
                someThing: "Something else.",
            },
        }),
        ok: true,
    });

    const result = await exampleController.wrappedFetch(artificialRoute, urlParameters, bodyMock, queryMock);

    const headers = new Headers();
    headers.append("content-type", "application/json");
    const url = "http://example.com/user/some-id/other/7?search=some-search%26%3F%20-%5C%2F&page=7&size=100";
    expect(mock).toHaveBeenCalledWith(url, {
        body: JSON.stringify(bodyMock),
        headers,
        method: "GET",
    });
    expect(result).toEqual({
        someThing: "Something else.",
    });
});

test("`wrappedFetch` with broken json", async () => {
    const mockCall = jest.fn();
    (global as any).fetch = mockCall;
    const error = new Error();
    mockCall.mockReturnValue({
        json: () => { throw error; },
        ok: true,
    });
    const mockErrorHandler = jest.fn();

    exampleController.configure({
        errorHandler: mockErrorHandler,
    });

    await expect(
        exampleController.wrappedFetch(artificialRoute, urlParameters, bodyMock, queryMock),
    ).rejects.toEqual(error);
    expect(mockErrorHandler).toHaveBeenCalledWith(error);
});

describe("`wrappedFetch` with a non-2xx status code", () => {
    const error = new ApiError(400, { message: "Something went wrong." });

    beforeEach(() => {
        const mockCall = jest.fn();
        (global as any).fetch = mockCall;
        mockCall.mockReturnValue({
            json: () => ({
                message: "Something went wrong.",
            }),
            ok: false,
            status: 400,
        });
    });

    test("with no error handler", async () => {
        await expect( // tslint:disable-line
            exampleController.wrappedFetch(artificialRoute, urlParameters, bodyMock, queryMock),
        ).rejects.toEqual(error);
    });

    test("with throwing disabled", async () => {
        exampleController.configure({ throwOnError: false });
        await expect( // tslint:disable-line
            exampleController.wrappedFetch(artificialRoute, urlParameters, bodyMock, queryMock),
        ).resolves;
    });

    test("with an error handler attached", async () => {
        const mockErrorHandler = jest.fn();

        exampleController.configure({
            errorHandler: mockErrorHandler,
        });

        await expect( // tslint:disable-line
            exampleController.wrappedFetch(artificialRoute, urlParameters, bodyMock, queryMock),
        ).rejects.toEqual(error);
        expect(mockErrorHandler).toHaveBeenCalledWith(error);
    });
});

test("`wrappedFetch` with a `.dump()` route", async () => {
    const login = createScope();

    class User {
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

    (global as any).fetch = jest.fn();
    (global as any).fetch.mockReturnValue({
        json: () => ({
            message: "Everything went well.",
            data: {
                email: "test@example.com",
                password: "asdfsadf",
            },
        }),
        ok: true,
    });

    const result = await exampleController.wrappedFetch(routeWithScope, urlParameters, bodyMock, queryMock);
    expect(result).toMatchSnapshot();
    expect(result.constructor).toBe(User);
});

test("`getDefaultControllerMode()`", () => {
    expect(getDefaultControllerMode()).toBe(ControllerMode.CLIENT);
    const originalWindow = (global as any).window;
    const originalDocument = (global as any).document;
    delete (global as any).document;
    delete (global as any).window;
    expect(getDefaultControllerMode()).toBe(ControllerMode.SERVER);
    (global as any).document = originalDocument;
    (global as any).window = originalWindow;
});

test("`wrappedFetch` with a `.dump()` route and an array", async () => {
    const login = createScope();

    class User {
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

    (global as any).fetch = jest.fn();
    (global as any).fetch.mockReturnValue({
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

    const result = await exampleController.wrappedFetch(routeWithScope, urlParameters, bodyMock, queryMock);
    expect(result).toMatchSnapshot();
});

test("A controller with an authorization provider calls the provider", async () => {
    const mock = jest.fn();
    (global as any).fetch = mock;
    mock.mockReturnValue({
        json: () => ({}),
        ok: true,
    });

    @controller
    class AuthorizedController {
        @route("GET", "/test/:id")
        public method(@param("id") id: string, @body() bdy: any, @query("search") search: string): Promise<undefined> {
            return ok();
        }
    }

    configureController(AuthorizedController, {
        authorizationProvider: (headers: Headers, currentBody: any, currentQuery: Params) => {
            currentQuery["auth"] = "true";
            currentBody.auth = true;
            headers.append("authorization", "indeed");
        },
    });
    await (new AuthorizedController()).method("some-id", { a: "a" }, "some-name");
    expect(mock.mock.calls).toMatchSnapshot();
});
