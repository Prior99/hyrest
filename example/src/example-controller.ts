import {
    controller,
    route,
    created,
    badRequest,
    query,
    param,
    body,
    is,
    DataType,
    oneOf,
    schema,
    required,
} from "../../src";

export interface ExamplePostBody {
    name: string;
    other: {
        num1: number;
        num2: number;
    };
}

export interface ExampleResult {
    name: string;
}

const ExampleSchema = {
    name: is(DataType.str).validate(oneOf("hunter", "jonas")),
    other: is(DataType.obj).validate(schema({
        num1: is(DataType.int),
        num2: is(DataType.float),
    })),
};

@controller({ baseUrl: "http://localhost:9000" })
export class ExampleController {
    @route("POST", "/example/:id")
    public postExample(
            @param("id") @is(DataType.int) id: number,
            @body() @is(DataType.obj).validate(schema(ExampleSchema), required) example: ExamplePostBody,
            @query("age") @is(DataType.float) age: number,
            @query("kind") @is(DataType.str).validate(oneOf("a", "b", "c"), required) kind: string): ExampleResult {
        if (age > 10) {
            return badRequest(undefined, "Cannot create example with age > 10.");
        }
        return created({
            name: `${id}-${example.name}-${age} (${kind}): ${example.other.num1}/${example.other.num2}`,
        });
    }
}
