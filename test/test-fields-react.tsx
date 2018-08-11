import * as React from "react";
import { mount } from "enzyme";
import { observer } from "mobx-react";
import { bind } from "bind-decorator";
import { scope, createScope,specify, schemaFrom, is, length, oneOf, email, DataType, required, range } from "hyrest";
import { field, hasFields, Field, ValidationStatus } from "hyrest-mobx";

class User {
    @is().validate(length(5, 10), required)
    public name?: string;

    @is().validate(email, required)
    public email?: string;
}

@observer @hasFields()
class UserForm extends React.Component {
    @field(User) private user: Field<User>;

    public render() {
        return (
            <div>
                <input id="email" {...this.user.nested.email.reactInput} />
                <input id="name" {...this.user.nested.name.reactInput} />
            </div>
        );
    }
}

test("react input double binding", async () => {
    const form = mount(<UserForm />);
    expect(form).toMatchSnapshot();
    form.find("input#email").simulate("change", { target: { value: "someone@example.com" }});
    form.find("input#name").simulate("change", { target: { value: "someone" }});
    await new Promise(resolve => setTimeout(resolve));
    form.update();
    expect(form).toMatchSnapshot();
});
