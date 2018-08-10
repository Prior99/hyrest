import * as React from "react";
import { mount } from "enzyme";
import { observer } from "mobx-react";
import { bind } from "bind-decorator";
import { scope, createScope,specify, schemaFrom, is, length, oneOf, email, DataType, required, range } from "hyrest";
import { field, hasFields, Field, ValidationStatus } from "hyrest-mobx";

class Pet {
    @is().validate(length(5, 10), required)
    public name?: string;

    @is(DataType.int).validate(required, range(0, 10))
    public age?: number;

    @is().validate(oneOf("cat", "dog"), required)
    public type?: "cat" | "dog";
}

class User {
    @is().validate(length(5, 10), required)
    public name?: string;

    @is().validate(email, required)
    public email?: string;

    @is()
    public pet?: Pet;
}

class UserList {
    @is() @specify(() => User)
    public users?: User[];
}

const ctx = {
    ownUser: User,
};

@observer @hasFields(() => ctx)
class UserForm extends React.Component {
    @field(User) private user: Field<User>;

    @bind private handleChange(event: React.SyntheticEvent<HTMLInputElement>) {
        this.user.nested.email.update((event.target as HTMLInputElement).value);
    }

    public render() {
        return (
            <div>
                <input value={this.user.nested.email.value || ""} onChange={this.handleChange} />
                { this.user.nested.email.valid && <p>Valid!</p> }
                { this.user.nested.email.invalid && <p>Invalid!</p> }
                { this.user.nested.email.unknown && <p>Please type something!</p> }
                { this.user.nested.email.inProgress && <p>Loading...</p> }
            </div>
        );
    }
}

test("works as expected throughout a journey", async () => {
    const form = mount(<UserForm />);
    expect(form).toMatchSnapshot();

    form.find("input").simulate("change", { target: { value: "someone" }});
    expect(form).toMatchSnapshot();
    await new Promise(resolve => setTimeout(resolve));
    form.update();
    expect(form).toMatchSnapshot();

    form.find("input").simulate("change", { target: { value: "someone@example.com" }});
    expect(form).toMatchSnapshot();
    await new Promise(resolve => setTimeout(resolve));
    form.update();
    expect(form).toMatchSnapshot();
});

test("updating with a nested field structure", async () => {
    @hasFields(() => ctx)
    class A {
        @field(User) public user: Field<User>;
    }

    const a = new A();
    await a.user.update({
        email: "someone@example.com",
        name: "someone",
        pet: {
            type: "dog",
            name: "Bonkers",
            age: 7,
        },
    });
    expect(a.user.value).toMatchSnapshot();
});

test("validating a nested field structure", async () => {
    @hasFields(() => ctx)
    class A {
        @field(UserList) public users: Field<UserList>;
    }

    const a = new A();
    expect(a.users.status).toBe(ValidationStatus.UNKNOWN);
    await a.users.update({
        users: [
            {
                email: "someone@example.com",
                name: "someone",
                pet: {
                    type: "dog",
                    name: "Bonkers",
                    age: 7,
                },
            }, {
                email: "anotherone@example.com",
                name: "anotherone",
                pet: {
                    type: "cat",
                    name: "Kitty",
                    age: 3,
                },
            }, {
                email: "third@example.com",
                name: "thirdy",
                pet: {
                    type: "cat",
                    name: "Bello",
                    age: 1,
                },
            },
        ],
    });
    expect(a.users.value).toMatchSnapshot();
    expect(a.users.status).toBe(ValidationStatus.VALID);

    a.users.nested.users
        .find(subField => subField.nested.name.value === "anotherone")
        .update({ email: "invalid-email" });
    expect(a.users.value).toMatchSnapshot();
    expect(a.users.status).toBe(ValidationStatus.IN_PROGRESS);

    await new Promise(resolve => setTimeout(resolve));
    expect(a.users.status).toBe(ValidationStatus.INVALID);
});

test("retrieving the constructed model from a nested field structure", async () => {
    @hasFields(() => ctx)
    class A {
        @field(User) public user: Field<User>;
    }

    const a = new A();
    a.user.nested.pet.nested.age.update(7);
    a.user.nested.email.update("someone@example.com");

    expect(a.user.value).toMatchSnapshot();
});

test("with an array directly in the decorator", async () => {
    @hasFields(() => ctx)
    class A {
        @specify(() => User) @field(Array) public users: Field<User[]>;
    }

    const a = new A();
    expect(a.users.status).toBe(ValidationStatus.UNKNOWN);
    await a.users.add({ email: "someone@example.com", name: "someone" });
    await a.users.add({ email: "anotherone@example.com", name: "anotherone" });
    expect(a.users.value).toMatchSnapshot();
    expect(a.users.status).toBe(ValidationStatus.VALID);
    await a.users.add({ email: "invalid"});
    expect(a.users.value).toMatchSnapshot();
    expect(a.users.status).toBe(ValidationStatus.INVALID);
});

test("updating with an unvalidated property", () => {
    const someScope = createScope();

    class Something {
        @scope(someScope)
        public prop: string;
    }

    @hasFields(() => ctx)
    class A {
        @field(Something) public something: Field<Something>;
    }

    const a = new A();
    a.something.update({
        prop: "some value",
    } as any);
    expect(a.something.value).toMatchSnapshot();
    expect(a.something.status).toBe(ValidationStatus.UNKNOWN);
});

test("updating with an unkown key", () => {
    @hasFields(() => ctx)
    class A {
        @field(User) public user: Field<User>;
    }

    const a = new A();
    a.user.update({
        name: "someone",
        email: "someone@example.com",
        anotherKey: "some weird value",
    } as any);
    expect(a.user.value).toMatchSnapshot();
});

test("updating with a nested array", () => {
    @hasFields(() => ctx)
    class A {
        @field(UserList) public users: Field<UserList>;
    }

    const a = new A();
    a.users.update({
        users: [],
    });
});

test("with an array directly in the decorator missing the @specify decorator", () => {
    @hasFields(() => ctx)
    class A {
        @field(Array) public users: Field<User[]>;
    }

    expect(() => new A()).toThrowErrorMatchingSnapshot();
});

test("with a nested array missing the @specify decorator", () => {
    const someScope = createScope();

    class BrokenUserList {
        @scope(someScope)
        public users?: User[];
    }

    @hasFields(() => ctx)
    class A {
        @field(BrokenUserList) public users: Field<BrokenUserList>;
    }

    const a = new A();
    expect(() => a.users.nested.users.status).toThrowErrorMatchingSnapshot();
});

test("with an array in the structure", async () => {
    @observer @hasFields(() => ctx)
    class UserListForm extends React.Component {
        @field(UserList) public userList: Field<UserList>;
        @field(User) public user: Field<User>;

        @bind private handleEmailChange(event: React.SyntheticEvent<HTMLInputElement>) {
            this.user.nested.email.update((event.target as HTMLInputElement).value);
        }

        @bind private handleNameChange(event: React.SyntheticEvent<HTMLInputElement>) {
            this.user.nested.name.update((event.target as HTMLInputElement).value);
        }

        @bind private async handleUserAddClick() {
            await this.userList.nested.users.add(this.user.value);
            this.user.reset();
        }

        public render() {
            return (
                <div>
                    <ul>
                        {
                            this.userList.nested.users.map(subField => {
                                return (
                                    <li key={subField.nested.email.value}>
                                        {subField.nested.name.value} ({subField.nested.email.value})
                                    </li>
                                );
                            })
                        }
                    </ul>
                    <input id="email" value={this.user.nested.email.value || ""} onChange={this.handleEmailChange} />
                    <input id="name" value={this.user.nested.name.value || ""} onChange={this.handleNameChange} />
                    <button onClick={this.handleUserAddClick}>Add user to list</button>
                </div>
            );
        }
    }

    const form = mount(<UserListForm />);
    expect(form).toMatchSnapshot();

    form.find("input#email").simulate("change", { target: { value: "someone@example.com" }});
    form.find("input#name").simulate("change", { target: { value: "someone" }});
    form.find("button").simulate("click");

    await new Promise(resolve => setTimeout(resolve));
    form.update();
    expect(form).toMatchSnapshot();
});
