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

    @is()
    public premium?: boolean;

    @is()
    public birthday?: Date;
}

@observer @hasFields()
class UserForm extends React.Component {
    @field(User) private user: Field<User>;

    public render() {
        return (
            <div>
                <input id="email" {...this.user.nested.email.reactInput} />
                <input id="name" {...this.user.nested.name.reactInput} />
                <textarea id="name-textarea" {...this.user.nested.name.reactInput} />
                <input id="premium" type="checkbox" {...this.user.nested.premium.reactCheckbox} />
                <input id="premium-broken" type="text" {...this.user.nested.premium.reactCheckbox} />
                <input id="birthday" type="date" {...this.user.nested.birthday.reactInput} />
            </div>
        );
    }
}

test("react text input double binding", async () => {
    const form = mount(<UserForm />);
    expect(form).toMatchSnapshot();
    form.find("input#email").simulate("change", {
        target: {
            value: "someone@example.com",
            type: "email",
        },
    });
    form.find("input#name").simulate("change", {
        target: {
            value: "someone",
            type: "text",
        },
    });
    await new Promise(resolve => setTimeout(resolve));
    form.update();
    expect(form).toMatchSnapshot();
});

test("react textarea double binding", async () => {
    const form = mount(<UserForm />);
    expect(form).toMatchSnapshot();
    form.find("textarea#name-textarea").simulate("change", {
        target: {
            value: "someone",
            type: "text",
        },
    });
    await new Promise(resolve => setTimeout(resolve));
    form.update();
    expect(form).toMatchSnapshot();
});

test("react date input double binding", async () => {
    const form = mount(<UserForm />);
    expect(form).toMatchSnapshot();
    form.find("input#birthday").simulate("change", {
        target: {
            value: "2018-11-15T12:00:00Z",
            type: "date",
        },
    });
    await new Promise(resolve => setTimeout(resolve));
    form.update();
    expect(form).toMatchSnapshot();
});

test("react checkbox double binding with reactInput handler", async () => {
    const form = mount(<UserForm />);
    expect(form).toMatchSnapshot();
    const warnSpy = jest.spyOn(console, "warn");
    warnSpy.mockImplementationOnce(() => undefined);
    form.find("input#name").simulate("change", {
        target: {
            checked: true,
            type: "checkbox",
        },
    });
    await new Promise(resolve => setTimeout(resolve));
    form.update();
    expect(form).toMatchSnapshot();
    expect(warnSpy).toHaveBeenCalledWith(
        `"Field.reactInput" used with an inpput of type "checkbox". Use "Field.reactCheckbox" instead.`,
    );
    warnSpy.mockRestore();
});

test("react checkbox double binding", async () => {
    const form = mount(<UserForm />);
    expect(form).toMatchSnapshot();
    form.find("input#premium").simulate("change", {
        target: {
            checked: true,
            type: "checkbox",
        },
    });
    await new Promise(resolve => setTimeout(resolve));
    form.update();
    expect(form).toMatchSnapshot();
});

test("react checkbox broken double binding", async () => {
    const form = mount(<UserForm />);
    expect(form).toMatchSnapshot();
    const warnSpy = jest.spyOn(console, "warn");
    warnSpy.mockImplementationOnce(() => undefined);
    form.find("input#premium-broken").simulate("change", {
        target: {
            checked: true,
            type: "text",
        },
    });
    await new Promise(resolve => setTimeout(resolve));
    form.update();
    expect(form).toMatchSnapshot();
    expect(warnSpy).toHaveBeenCalledWith(`"Field.reactCheckbox" received an event with a target of type "text".`);
    warnSpy.mockRestore();
});
