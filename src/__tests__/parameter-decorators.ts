import { body, getBodyParameters, param, getUrlParameters, query, getQueryParameters } from "../parameter-decorators";

test("@body()", () => {
    class TestController { //tslint:disable-line
        public method(@param("param1") param: string, @query("query1") query: string, @body() body: any) {}
    }

    const controller = new TestController();

    expect(getBodyParameters(controller, "method")).toMatchSnapshot();
    expect(getUrlParameters(controller, "method")).toMatchSnapshot();
    expect(getQueryParameters(controller, "method")).toMatchSnapshot();
});
