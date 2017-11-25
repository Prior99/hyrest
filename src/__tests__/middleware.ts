import { restRpc } from "../middleware";
import { controller, ControllerMode } from "../controller";
import { route } from "../route";
import { body, param, query } from "../parameters";
import { float, int } from "../converters";
import { required } from "../validators";
import { is, schema } from "../validation";
import { ok, created } from "../answers";
import * as request from "supertest";
import * as Express from "express";
import * as BodyParser from "body-parser";

test("The `restRpc` middleware handles requests correctly", async () => {
    const mockA = jest.fn();
    const mockB = jest.fn();

    @controller({ mode: ControllerMode.SERVER })
    class TestController1 {
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
    http.use(restRpc(new TestController1()));

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

test("The `restRpc` middleware reacts to all http methods", async () => {
    @controller({ mode: ControllerMode.SERVER })
    class TestController2 { //tslint:disable-line
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

        @route("TRACE", "/trace")
        public traceTrace() { return ok(); }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(restRpc(new TestController2()));

    await request(http).get("/get").expect(200);
    await request(http).post("/post").expect(200);
    await request(http).patch("/patch").expect(200);
    await request(http).put("/put").expect(200);
    await request(http).delete("/delete").expect(200);
    await request(http).head("/head").expect(200);
    await request(http).options("/options").expect(200);
    await request(http).trace("/trace").expect(200);
});

test("The `restRpc` middleware throws with an invalid HTTP method", () => {
    @controller()
    class TestController3 { //tslint:disable-line
        @route("INVALID" as any, "/invalid")
        public invalid() { return ok(); }
    }

    expect(() => restRpc(new TestController3())).toThrow();
});

test("The `restRpc` middleware handles invalid requests correctly", async () => {
    @controller({ mode: ControllerMode.SERVER })
    class TestController4 { //tslint:disable-line
        @route("GET", "/user/:id")
        public getTest(
                @is(int) @param("id") id: number,
                @is(float).validate(required) @query("search") search: number) {
            return ok("Everything is okay.");
        }

        @route("POST", "/user/:id")
        public postTest(@is(schema({})) @body() search: user) {
            return ok("Everything is okay.");
        }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(restRpc(new TestController4()));

    const responseA = await request(http)
        .get("/user/some-id?search=test")
        .expect(422)
        .set("content-type", "application/json");
    expect(responseA.text).toBe(JSON.stringify({
        message: "Not a valid integer.",
    }));

    const responseB = await request(http)
        .get("/user/27")
        .expect(422)
        .set("content-type", "application/json");
    expect(responseB.text).toBe(JSON.stringify({
        message: "Missing required field.",
    }));

    const responseC = await request(http)
        .post("/user/27")
        .expect(200)
        .set("content-type", "application/json")
        .send({});
    expect(responseC.text).toBe(JSON.stringify({
        message: "Everything is okay.",
    }));
});
