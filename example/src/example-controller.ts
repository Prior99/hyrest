import {
    controller,
    route,
    created,
    badRequest,
    query,
    param,
    body,
    is,
    integer,
    float,
    oneOf,
} from "../../src";

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
    public postExample(
            @param("id") @is(integer) id: number,
            @body() example: ExamplePostBody,
            @query("age") @is(float) age: number,
            @query("kind") @is(oneOf("a", "b", "c")) kind: string): ExampleResult {
        if (age > 10) {
            return badRequest(undefined, "Cannot create example with age > 10.");
        }
        return created({
            name: "9",
        });
    }
}
