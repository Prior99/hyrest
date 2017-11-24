import "isomorphic-fetch";

import { Controller } from "../controller";
import { ApiError, HTTPMethod  } from "../types";

let controller: Controller;

beforeEach(() => {
    controller = new Controller({
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

    const result = await controller.wrappedFetch(route, urlParameters, body, query);

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

    controller.configure({
        errorHandler: mockErrorHandler,
    });

    await expect(controller.wrappedFetch(route, urlParameters, body, query)).rejects.toEqual(error);
    expect(mockErrorHandler).toHaveBeenCalledWith(error);
});

test("`wrappedFetch` with a non-2xx status code", async () => {
    const mockCall = jest.fn();
    global.fetch = mockCall;
    const error = new ApiError(400, { message: "Something went wrong." });
    mockCall.mockReturnValue({
        json: () => ({
            message: "Something went wrong.",
        }),
        ok: false,
        status: 400,
    });
    const mockErrorHandler = jest.fn();

    controller.configure({
        errorHandler: mockErrorHandler,
    });

    await expect(controller.wrappedFetch(route, urlParameters, body, query)).rejects.toEqual(error);
    expect(mockErrorHandler).toHaveBeenCalledWith(error);
});
