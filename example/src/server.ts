import * as Express from "express";
import { restRpc } from "../../src";
import * as BodyParser from "body-parser";
import { ExampleController } from "./example-controller";

process.on("unhandledRejection", err => console.error(err));

const http = Express();

http.use(BodyParser.json());
http.use(BodyParser.urlencoded({ extended: true }));
http.use(restRpc(
    new ExampleController(),
));

http.listen(9000);
