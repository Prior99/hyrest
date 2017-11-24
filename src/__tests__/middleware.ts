import { restRpc } from "../middleware";
import { controller, ControllerMode } from "../controller";
import { route } from "../route";
import { body, param, query } from "../parameters";
import { ok, created } from "../answers";
import * as request from "supertest";
import * as Express from "express";
import * as BodyParser from "body-parser";

test("The `restRpc` middleware handles requests correctly", async () => {
    const mockA = jest.fn();
    const mockB = jest.fn();

    @controller({ mode: ControllerMode.SERVER })
    class TestController {
        @route("GET", "/user/:id/test-a")
        public getTestA(@param("id") id: string, @query("search") search: string) {
            mockA(id, search);
            return ok({
                id,
                something: "different",
            }, "Everything is okay.");
        }

        @route("POST", "/user/:id/test-b")
        public postTestB(@param("id") id: string, @body() thing: any, @query("search") search: string) {
            mockB(id, thing, search);
            return created("Created.");
        }

        @route("POST", "/internal-error")
        public postInternalError() {
            throw new Error("Oops.");
        }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(restRpc(new TestController()));

    const responseA = await request(http)
        .get("/user/some-id/test-a?search=test%20test")
        .expect(200)
        .set("content-type", "application/json");
    expect(responseA.text).toBe(JSON.stringify({
        data: {
            id: "some-id",
            something: "different",
        },
        message: "Everything is okay.",
    }));
    expect(mockA).toHaveBeenCalledWith("some-id", "test test");

    const responseB = await request(http)
        .post("/user/some-id/test-b?search=test%20test")
        .expect(201)
        .set("content-type", "application/json")
        .send({
            some: "thing.",
        });
    expect(responseB.text).toBe(JSON.stringify({
        message: "Created.",
    }));
    expect(mockA).toHaveBeenCalledWith("some-id", "test test");

    const responseC = await request(http)
        .post("/internal-error")
        .expect(500)
        .set("content-type", "application/json")
        .send();
});

test("The `restRpc` middleware throws when adding a non-@controller object", () => {
    class NotAController {} //tslint:disable-line

    expect(() => restRpc(new NotAController())).toThrow();
});

test("The `restRpc` middleware reacts to all http methods", () => {
    @controller()
    class TestController { //tslint:disable-line
        @route("GET", "/get")
        public getGet() { return ok(); }

        @route("POST", "/post")
        public postPost() { return ok(); }

        @route("PATCH", "/patch")
        public patchPatch() { return ok(); }

        @route("PUT", "/put")
        public putPut() { return ok(); }

        @route("DELETE", "/delete")
        public deleteDelete() { return ok(); }

        @route("HEAD", "/head")
        public headHead() { return ok(); }

        @route("OPTIONS", "/options")
        public optionsOptions() { return ok(); }

        @route("CONNECT", "/connect")
        public connectConnect() { return ok(); }

        @route("TRACE", "/trace")
        public traceTrace() { return ok(); }
    }

    const http = Express();
    http.use(restRpc(new TestController()));

    request(http).get("/get").expect(200);
    request(http).post("/post").expect(200);
    request(http).patch("/patch").expect(200);
    request(http).put("/put").expect(200);
    request(http).delete("/delete").expect(200);
    request(http).head("/head").expect(200);
    request(http).options("/options").expect(200);
    request(http).connect("/connect").expect(200);
    request(http).trace("/trace").expect(200);
});

test("The `restRpc` middleware throws with an invalid HTTP method", () => {
    @controller()
    class TestController { //tslint:disable-line
        @route("INVALID" as any, "/invalid")
        public invalid() { return ok(); }
    }

    expect(() => restRpc(new TestController())).toThrow();
});
