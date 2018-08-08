import * as React from "react";
import { mount } from "enzyme";
import { observer } from "mobx-react";
import { bind } from "bind-decorator";
import { schemaFrom, is, length, oneOf, email, DataType, required, range } from "hyrest";
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
                <input value={this.user.nested.email.value} onChange={this.handleChange} />
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
