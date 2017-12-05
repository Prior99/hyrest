import { body, getBodyParameters, param, getUrlParameters, query, getQueryParameters } from "../parameters";

test("@body, @param and @query", () => {
    class TestController {
        public method(@param("param1") param: string, @query("query1") query: string, @body() body: any) {}
    }

    const controller = new TestController();

    expect(getBodyParameters(controller, "method")).toMatchSnapshot();
    expect(getUrlParameters(controller, "method")).toMatchSnapshot();
    expect(getQueryParameters(controller, "method")).toMatchSnapshot();
});
