import { ApiError } from "hyrest";

test("The `ApiError` class is constructed as expected", () => {
    const error = new ApiError(400, {
        message: "Some message.",
    });
    expect(error.statusCode).toMatchSnapshot();
    expect(error.answer).toMatchSnapshot();
});
