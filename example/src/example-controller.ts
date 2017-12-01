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
    required,
    schemaFrom,
    arrayOf,
    scope,
    createScope,
} from "../../src";

const world = createScope();
const owner = createScope().include(world);
const create = createScope();

export class Other {
    @scope(world, create) @is(DataType.int)
    public num1: number;
    @scope(owner, create) @is()
    public num2: number;
}

export class Example { // tslint:disable-line
    @scope(world, create) @is().validate(oneOf("hunter", "jonas"))
    public name: string;

    @scope(world, create) @is() @arrayOf(Other)
    public others: Other[];
    @scope(world) @is()
    public example?: Example;
}

@controller({ baseUrl: "http://localhost:9000" })
export class ExampleController { // tslint:disable-line
    @route("POST", "/example/:id")
    public postExample(
            @param("id") @is(DataType.int) id: number,
            @body() @is(DataType.obj).validate(required).schema(schemaFrom(Example)) example: Example,
            @query("age") @is(DataType.float) age: number,
            @query("kind") @is(DataType.str).validate(oneOf("a", "b", "c"), required) kind: string): Example {
        if (age > 10) {
            return badRequest(undefined, "Cannot create example with age > 10.");
        }
        return created(example);
    }
}
