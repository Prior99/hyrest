import * as React from "react";
import { mount } from "enzyme";
import { observer } from "mobx-react";
import { bind } from "bind-decorator";
import { specify, schemaFrom, is, length, oneOf, email, DataType, required, range } from "hyrest";
import { field, hasFields, Field } from "hyrest-mobx";

class Pet {
    @is().validate(length(5, 10), required)
    public name: string;

    @is(DataType.int).validate(required, range(0, 10))
    public age: number;

    @is().validate(oneOf("cat", "dog"), required)
    public type: "cat" | "dog";
}

class User {
    @is().validate(length(5, 10), required)
    public name: string;

    @is().validate(email, required)
    public email: string;

    @is()
    public pet: Pet;
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
                { this.user.nested.email.untouched && <p>Please type something!</p> }
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

test("with an array in the structure", async () => {
    class UserList {
        @is() @specify(() => User)
        public users: User[];
    }

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
