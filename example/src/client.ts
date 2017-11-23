import "isomorphic-fetch";

import { ExampleController } from "./example-controller";
import { configureRPC, ControllerMode } from "../../src";
process.on("unhandledRejection", r => console.log(r));

// This is only necessary in Node to enforce Client mode.
// The controller will be in client mode in browser automatically.
configureRPC(ExampleController, { mode: ControllerMode.CLIENT });

const exampleController = new ExampleController();

async function call() {
    const result = await exampleController.postExample(8, { name: "hunter" }, 9, "c");
    console.log(result);
}

call();
