import "isomorphic-fetch";

import { ExampleController } from "./example-controller";
import { configureRPC, ControllerMode } from "../../src";

// This is only necessary in Node to enforce Client mode.
// The controller will be in client mode in browser automatically.
configureRPC(ExampleController, { mode: ControllerMode.CLIENT });

const exampleController = new ExampleController();

async function call() {
    console.log(await exampleController.postExample({
        id: "27",
    }, {
        name: "hunter",
    }, {
        age: "9",
    }));
}

call();
