import * as Answers from "../answers";

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
].forEach(({ args, testName }) => {
    Object.keys(Answers).map(key => Answers[key]).forEach(answerFunction => {
        test(`${answerFunction.name} returns the expected result with ${testName}`, () => {
            expect(answerFunction(...args)).toMatchSnapshot();
        });
    });
});
