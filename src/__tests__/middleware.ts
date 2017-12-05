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
import bind from "bind-decorator";

test("The `hyrest` middleware handles requests correctly", async () => {
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
    http.use(hyrest(new TestController1()));

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

test("The `hyrest` middleware throws when adding a non-@controller object", () => {
    class NotAController {}

    expect(() => hyrest(new NotAController())).toThrow();
});

test("The `hyrest` middleware reacts to all http methods", async () => {
    @controller({ mode: ControllerMode.SERVER })
    class TestController2 {
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
    http.use(hyrest(new TestController2()));

    await request(http).get("/get").expect(200);
    await request(http).post("/post").expect(200);
    await request(http).patch("/patch").expect(200);
    await request(http).put("/put").expect(200);
    await request(http).delete("/delete").expect(200);
    await request(http).head("/head").expect(200);
    await request(http).options("/options").expect(200);
    await request(http).trace("/trace").expect(200);
});

test("The `hyrest` middleware throws with an invalid HTTP method", () => {
    @controller()
    class TestController3 {
        @route("INVALID" as any, "/invalid")
        public invalid() { return ok(); }
    }

    expect(() => hyrest(new TestController3())).toThrow();
});

test("The `hyrest` middleware handles invalid requests correctly", async () => {
    @controller({ mode: ControllerMode.SERVER })
    class TestController4 {
        @route("GET", "/user/:id")
        public getTest(
                @is(int) @param("id") id: number,
                @is(float).validate(required) @query("search") search: number) {
            return ok("Everything is okay.");
        }

        @route("POST", "/user/:id")
        public postTest(@is().schema({}) @body() user: User) {
            return ok("Everything is okay.");
        }

        @route("POST", "/echo")
        public postEcho(@is().schema({ email: is(str).validate(email) }) @body() user: User) {
            return ok(user, "Everything is okay.");
        }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(hyrest(new TestController4()));

    const responseA = await request(http)
        .get("/user/some-id?search=test")
        .expect(422)
        .set("content-type", "application/json");
    expect(responseA.text).toBe(JSON.stringify({
        data: {
            url: { id: { errors: ["Not a valid integer."] } },
            query: { search: { errors: ["Not a valid float."] } },
        },
        message: "Validation failed.",
    }));

    const responseB = await request(http)
        .get("/user/27")
        .expect(422)
        .set("content-type", "application/json");
    expect(responseB.text).toBe(JSON.stringify({
        data: {
            query: { search: { errors: ["Missing required field."] } },
        },
        message: "Validation failed.",
    }));

    const responseC = await request(http)
        .post("/user/27")
        .expect(200)
        .set("content-type", "application/json")
        .send({});
    expect(responseC.text).toBe(JSON.stringify({
        message: "Everything is okay.",
    }));

    const responseD = await request(http)
        .post("/user/27")
        .expect(422)
        .set("content-type", "application/json")
        .send({ foo: "bar" });
    expect(responseD.text).toBe(JSON.stringify({
        data: {
            body: {
                nested: {
                    foo: { errors: ["Unexpected key."] },
                },
            },
        },
        message: "Validation failed.",
    }));

    const responseE = await request(http)
        .post("/echo")
        .expect(200)
        .set("content-type", "application/json")
        .send({ email: "some@example.com" });
    expect(responseE.text).toBe(JSON.stringify({
        data: {
            email: "some@example.com",
        },
        message: "Everything is okay.",
    }));
});

test("The `hyrest` middleware preserves `this`", async () => {
    const mock = jest.fn();
    @controller({ mode: ControllerMode.SERVER })
    class TestController5 {
        @route("GET", "/get")
        public getGet() {
            mock(this);
            return ok();
        }
    }

    const instance = new TestController5();

    const http = Express();
    http.use(BodyParser.json());
    http.use(hyrest(instance));

    const responseA = await request(http)
        .get("/get")
        .expect(200)
        .set("content-type", "application/json");
    expect(mock.mock.calls[0][0]).toBe(instance);
});

test("The `hyrest` middleware performs a context validation", async () => {
    const mock = jest.fn();
    mock.mockReturnValue({});
    const context = {
        validate1: mock,
        validate2: mock,
        validate3: async (id: string) => {
            mock(id);
            return { error: "Something went wrong." };
        },
    };
    @controller({ mode: ControllerMode.SERVER })
    class TestController6 {
        @route("GET", "/get/:id")
        public getGet(@param("id") @is(str).validateCtx(ctx => ctx.validate1)) {
            return ok();
        }

        @route("GET", "/get/array/:id")
        public getArray(@param("id") @is(str).validateCtx(ctx => [ctx.validate2, ctx.validate3])) {
            return ok();
        }
    }

    const instance = new TestController6();

    const http = Express();
    http.use(BodyParser.json());
    http.use(hyrest(instance).context(context));

    const responseA = await request(http)
        .get("/get/some-id")
        .expect(200)
        .set("content-type", "application/json");
    expect(mock.mock.calls[0][0]).toBe("some-id");

    const responseB = await request(http)
        .get("/get/array/some-id")
        .expect(422)
        .set("content-type", "application/json");
    expect(mock.mock.calls[1][0]).toBe("some-id");
    expect(mock.mock.calls[2][0]).toBe("some-id");
});

test("@body with a scope and a route with `.dump()`", async () => {
    const login = createScope();
    const signup = createScope().include(login);

    class User {
        @scope(login) @is().validate(email, required)
        public email: string;

        @scope(signup) @is().validate(length(5, 100), required)
        public username: string;

        @scope(login) @is().validate(length(8, 100), required)
        public password: string;
    }

    const mockSignup = jest.fn();
    const mockLogin = jest.fn();
    @controller({ mode: ControllerMode.SERVER })
    class TestController7 {
        @bind @route("POST", "/signup").dump(User, signup)
        public postSignup(@body(signup) user: User) {
            mockSignup(user);
            return ok({
                ...user,
                dangling: "Not present in snapshot.",
            });
        }

        @bind @route("POST", "/login").dump(User, login)
        public postLogin(@body(login) user: User) {
            mockLogin(user);
            return ok(user);
        }
    }

    const instance = new TestController7();

    const http = Express();
    http.use(BodyParser.json());
    http.use(hyrest(instance));

    const responseA = await request(http)
        .post("/signup")
        .expect(200)
        .set("content-type", "application/json")
        .send({ email: "test@example.com", username: "testtest", password: "asdfsadf" });
    expect(mockSignup.mock.calls[0][0]).toMatchSnapshot();

    const responseB = await request(http)
        .post("/login")
        .expect(200)
        .set("content-type", "application/json")
        .send({ email: "test@example.com", password: "asdfsadf" });
    expect(mockLogin.mock.calls[0][0]).toMatchSnapshot();

    const responseC = await request(http)
        .post("/login")
        .expect(422)
        .set("content-type", "application/json")
        .send({ email: "test@example.com", password: "asdfsadf", username: "testtest" });
    expect(mockLogin.mock.calls[1]).toBeUndefined();

    const responseD = await request(http)
        .post("/login")
        .expect(422)
        .set("content-type", "application/json");
    expect(mockLogin.mock.calls[2]).toBeUndefined();
});

test("The `hyrest` middleware handles invalid requests correctly with a schema context validation", async () => {
    const signup = createScope();
    const alwaysValid = createScope();
    const ctx = {};
    const mock = jest.fn();
    const mockName = jest.fn();

    class Name {
        @is().validateCtx(c => {
            mockName(c);
            return length(10, 100);
        })
        @scope(signup)
        public name: string;
    }

    class User {
        @is().validateCtx(c => {
            mock(c);
            return email;
        })
        @scope(signup)
        public email: string;

        @is().validateCtx(c => {
            mock(c);
            return email;
        })
        @scope(signup) @specify(() => Name)
        public names: Name[];
    }

    @controller({ mode: ControllerMode.SERVER })
    class TestController8 {
        @route("POST", "/user")
        public postTest(@body(signup) user: User) {
            return ok("Everything is okay.");
        }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(hyrest(new TestController8()).context(ctx));

    const responseA = await request(http)
        .post("/user")
        .expect(422)
        .set("content-type", "application/json")
        .send({ email: "invalid", names: [ { name: "Test 1" }, { name: "Test 2" } ] });
    expect(responseA.text).toBe(JSON.stringify({
        data: {
            body: {
                nested: {
                    email: {
                        errors: ["String is not a valid email."],
                    },
                    names: {
                        nested: {
                            0: {
                                nested: {
                                    name: {
                                        errors: ["Shorter than minimum length of 10."],
                                    },
                                },
                            },
                            1: {
                                nested: {
                                    name: {
                                        errors: ["Shorter than minimum length of 10."],
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        message: "Validation failed.",
    }));
    expect(mock).toHaveBeenCalledWith(ctx);
    expect(mockName).toHaveBeenCalledWith(ctx);
});

test("The `hyrest` middleware handles `only()` correctly", async () => {
    const signup = createScope();
    const login = createScope();
    const ctx = {};

    class Pet {
        @is().validateCtx(c => { return only(signup, length(10, 100)); })
        @scope(signup, login)
        public name: string;
    }

    class User {
        @is().validate(only(signup, email))
        @scope(signup, login)
        public email: string;

        @is()
        @scope(signup, login) @specify(() => Pet)
        public pets: Pet[];
    }

    @controller({ mode: ControllerMode.SERVER })
    class TestController9 {
        @route("POST", "/signup")
        public postSignup(@body(signup) user: User) {
            return ok("Everything is okay.");
        }

        @route("POST", "/login")
        public postLogin(@body(login) user: User) {
            return ok("Everything is okay.");
        }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(hyrest(new TestController9()).context(ctx));

    const responseA = await request(http)
        .post("/signup")
        .expect(422)
        .set("content-type", "application/json")
        .send({ email: "invalid", pets: [ { name: "short" } ] });

    const responseB = await request(http)
        .post("/login")
        .expect(200)
        .set("content-type", "application/json")
        .send({ email: "invalid", pets: [ { name: "short" } ] });
});

test("transforming properties", async () => {
    const signup = createScope();
    const mock = jest.fn();

    class User {
        @is()
        @transform(password => `***${password.substr(3, password.length)}`)
        @scope(signup)
        public password: string;
    }

    @controller({ mode: ControllerMode.SERVER })
    class TestController10 {
        @route("POST", "/signup/:sth")
        public postSignup(
            @body(signup) user: User,
            @is() @transform(s => s.toLowerCase()) @param("sth") sth: string,
        ) {
            mock(user.password, sth);
            return ok("Everything is okay.");
        }
    }

    const http = Express();
    http.use(BodyParser.json());
    http.use(hyrest(new TestController10()));

    const responseA = await request(http)
        .post("/signup/UPPERCASE")
        .expect(200)
        .set("content-type", "application/json")
        .send({ password: "secret" });
    expect(mock).toHaveBeenCalledWith("***ret", "uppercase");
});
