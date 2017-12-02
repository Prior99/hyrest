import "isomorphic-fetch";

import { ExampleController } from "./example-controller";
import { configureController, ControllerMode, ApiError } from "../../src";

process.on("unhandledRejection", err => console.error(err));

// This is only necessary in Node to enforce Client mode.
// The controller will be in client mode in browser automatically.
configureController(ExampleController, { mode: ControllerMode.CLIENT });

const exampleController = new ExampleController();

function prettyPrint(err: ApiError) {
    console.log(err.statusCode); // tslint:disable-line
    console.log(JSON.stringify(err.answer, null, 2)); // tslint:disable-line
}

async function call() {
    const validBody = {
        name: "hunter",
        others: [
            {
                num1: 12,
                num2: 0.5,
            },
        ],
    };
    console.log(await exampleController.postExample(8, validBody, 9, "c")); // tslint:disable-line
    try {
        await exampleController.postExample("invalid" as any, validBody, 9, "c");
    } catch (err) {
        prettyPrint(err);
    }
    try {
        await exampleController.postExample(10, validBody, 9, "d");
    } catch (err) {
        prettyPrint(err);
    }
    try {
        await exampleController.postExample(10, validBody, 9, undefined);
    } catch (err) {
        prettyPrint(err);
    }
    const invalidBody = {
        name: "hunter",
        others: [
            {
                num1: 12,
                num2: 0.5,
                otherParameter: "dangling",
            },
        ],
    };
    try {
        await exampleController.postExample(10, invalidBody, 9, "c");
    } catch (err) {
        prettyPrint(err);
    }
}

call();
