import { controller, route, created, badRequest, query, param, body } from "../../src";

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
    public postExample(@param("id") id: number, @body() example: ExamplePostBody, @query("age") age: number) {
        console.log(example, id, age);
        if (age > 10) {
            return badRequest(undefined, "Cannot create example with age > 10.");
        }
        return created({
            name: `${id}-${example.name}`,
        });
    }
}
