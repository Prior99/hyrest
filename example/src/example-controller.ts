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
    specify,
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

export class Example {
    @scope(world, create) @is().validate(oneOf("hunter", "jonas"))
    public name: string;

    @scope(world, create) @is() @specify(() => Other)
    public others: Other[];
    @scope(world) @is()
    public example?: Example;
}

@controller({ baseUrl: "http://localhost:9000" })
export class ExampleController {
    @route("POST", "/example/:id").dump(Example, world)
    public postExample(
            @param("id") @is(DataType.int) id: number,
            @body(create) example: Example,
            @query("age") @is(DataType.float) age: number,
            @query("kind") @is(DataType.str).validate(oneOf("a", "b", "c"), required) kind: string): Example {
        if (age > 10) {
            return badRequest(undefined, "Cannot create example with age > 10.");
        }
        return created(example);
    }
}
