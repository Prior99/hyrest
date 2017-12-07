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
import { auth, noauth, AuthorizationMode } from "../authorization";
import { Request } from "express";

test("A hyrest middleware with authorization enabled on the route", async () => {
    const mock = jest.fn();
    const ctx = {};

    @controller({ mode: ControllerMode.SERVER })
    class TestController {
        @route("GET", "/test") @auth
        public method() { mock(); return ok(); }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(
        hyrest(new TestController())
            .authorization((req: Request, context: {}) => {
                expect(context).toBe(ctx);
                return req.query["ok"] === "true";
            })
            .context(ctx),
    );

    await request(http).get("/test?ok=false").expect(401);
    expect(mock).not.toHaveBeenCalled();
    await request(http).get("/test?ok=true").expect(200);
    expect(mock).toHaveBeenCalled();
});

test("A hyrest middleware with authorization enabled on the controller", async () => {
    const mock = jest.fn();

    @auth
    @controller({ mode: ControllerMode.SERVER })
    class TestController {
        @route("GET", "/test")
        public method() { mock(); return ok(); }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(hyrest(new TestController()).authorization((req: Request) => req.query["ok"] === "true"));

    await request(http).get("/test?ok=false").expect(401);
    expect(mock).not.toHaveBeenCalled();
    await request(http).get("/test?ok=true").expect(200);
    expect(mock).toHaveBeenCalled();
});

test("A hyrest middleware with authorization enabled on the middleware", async () => {
    const mock = jest.fn();

    @controller({ mode: ControllerMode.SERVER })
    class TestController {
        @route("GET", "/test")
        public method() { mock(); return ok(); }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(
        hyrest(new TestController())
            .authorization((req: Request) => req.query["ok"] === "true")
            .defaultAuthorizationMode(AuthorizationMode.AUTH),
    );

    await request(http).get("/test?ok=false").expect(401);
    expect(mock).not.toHaveBeenCalled();
    await request(http).get("/test?ok=true").expect(200);
    expect(mock).toHaveBeenCalled();
});

test("A hyrest middleware with a special authorization check", async () => {
    const mock = jest.fn();

    @auth
    @controller({ mode: ControllerMode.SERVER })
    class TestController {
        @route("GET", "/test") @auth({ check: req => req.query["extra"] === "true" })
        public method() { mock(); return ok(); }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(hyrest(new TestController()).authorization((req: Request) => req.query["ok"] === "true"));

    await request(http).get("/test?ok=true").expect(401);
    expect(mock).not.toHaveBeenCalled();
    await request(http).get("/test?ok=true&extra=true").expect(200);
    expect(mock).toHaveBeenCalled();
});

test("A hyrest middleware with authorization disabled on a specific route", async () => {
    const mock = jest.fn();

    @controller({ mode: ControllerMode.SERVER })
    class TestController {
        @route("GET", "/test") @noauth()
        public method() { mock(); return ok(); }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(
        hyrest(new TestController())
            .authorization((req: Request) => req.query["ok"] === "true")
            .defaultAuthorizationMode(AuthorizationMode.AUTH),
    );

    await request(http).get("/test?ok=false").expect(200);
    expect(mock).toHaveBeenCalled();
});

test("A hyrest middleware throws an error when invoked with an authorized route but no checker provided", async () => {
    const mock = jest.fn();
    const mockError = jest.fn();

    @controller({ mode: ControllerMode.SERVER })
    class TestController {
        @route("GET", "/test")
        public method() { mock(); return ok(); }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(
        hyrest(new TestController()).defaultAuthorizationMode(AuthorizationMode.AUTH),
    );
    http.use((err: any, _req: any, res: any, next: any) => {
        mockError(err);
        res.status(500).send();
        next();
    });
    const req = await request(http)
        .get("/test?ok=false")
        .expect(500)
        .send();
    expect(mock).not.toHaveBeenCalled();
    expect(mockError.mock.calls).toMatchSnapshot();
});
