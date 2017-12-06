import { hyrest } from "../middleware";
import { controller, ControllerMode } from "../controller";
import { route } from "../route";
import { body, param, query } from "../parameters";
import { float, int, str } from "../converters";
import { required, email, length, only } from "../validators";
import { is } from "../validation";
import { transform } from "../transform";
import { ok, created } from "../answers";
import { createScope, scope, specify } from "../scope";
import * as request from "supertest";
import * as Express from "express";
import * as BodyParser from "body-parser";
import { authorized } from "../";

test("A hyrest middleware with authorization enabled", () => {
    const mock = jest.fn();
    @controller
    class TestController {
        @route("GET", "/test") @authorized
        public method() {
            mock();
        }
    }
});
