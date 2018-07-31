import { body, getBodyParameters, param, getUrlParameters, query, getQueryParameters } from "hyrest";

test("@body, @param and @query", () => {
    class TestController {
        public method(@param("param1") p: string, @query("query1") q: string, @body() b: any) {
            return;
        }
    }

    const controller = new TestController();

    expect(getBodyParameters(controller, "method")).toMatchSnapshot();
    expect(getUrlParameters(controller, "method")).toMatchSnapshot();
    expect(getQueryParameters(controller, "method")).toMatchSnapshot();
});
