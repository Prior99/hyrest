import * as Answers from "../answers";
import { consumeLastCall } from "../last-call";

[
    {
        testName: "a wrapper",
        args: [
            {
                body: {
                    someKey: "some value",
                },
                message: "Some message.",
            },
        ],
    },
    {
        testName: "only a body",
        args: [
            {
                someKey: "some value",
            },
        ],
    },
    {
        testName: "only a message",
        args: [
            "Some message.",
        ],
    },
    {
        testName: "a body and a message",
        args: [
            {
                someKey: "some value",
            },
            "Some message.",
        ],
    },
    {
        testName: "no parameters",
        args: [],
    },
    {
        testName: "an empty body",
        args: [{}],
    },
].forEach(({ args, testName }) => {
    Object.keys(Answers)
        .map(key => Answers[key])
        .forEach(answerFunction => {
            test(`${answerFunction.name} returns the expected result with ${testName}`, () => {
                const body = answerFunction(...args);
                expect(body).toMatchSnapshot();
                const { message, statusCode } = consumeLastCall();
                expect(statusCode).toMatchSnapshot();
                expect(message).toMatchSnapshot();
            });
        });
});
