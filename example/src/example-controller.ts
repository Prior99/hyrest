import { controller, route, Params, created, badRequest } from "../../src";

export interface ExamplePostBody {
    name: string;
}

export interface ExampleResult {
    name: string;
}

export interface PostExampleUrlParams {
    id: string;
}

export interface PostExampleQueryParams {
    age: string;
}

@controller({ baseUrl: "http://localhost:9000" })
export class ExampleController {
    @route("POST", "/example/:id")
    public postExample(params: PostExampleUrlParams, body: ExamplePostBody, query: PostExampleQueryParams) {
        const { name } = body;
        const { id } = params;
        const { age } = query;
        if (parseInt(age) > 10) {
            return badRequest(undefined, "Cannot create example with age > 10.");
        }
        return created({
            name: `${id}-${name}`,
        });
    }
}
