import "isomorphic-fetch";

import { ExampleController } from "./example-controller";
import { configureRPC, ControllerMode } from "../../src";

process.on("unhandledRejection", err => console.error(err));

// This is only necessary in Node to enforce Client mode.
// The controller will be in client mode in browser automatically.
configureRPC(ExampleController, { mode: ControllerMode.CLIENT });

const exampleController = new ExampleController();

async function call() {
    console.log(await exampleController.postExample(8, { name: "hunter" }, 9, "c")); //tslint:disable-line
    try {
        await exampleController.postExample("invalid" as any, { name: "hunter" }, 9, "c");
    } catch (err) {
        console.log(err.answer); //tslint:disable-line
    }
    try {
        await exampleController.postExample(10, { name: "hunter" }, 9, "d");
    } catch (err) {
        console.log(err.answer); //tslint:disable-line
    }
}

call();
