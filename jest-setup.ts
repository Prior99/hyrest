import { configure } from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";

process.on("unhandledRejection", err => {
    console.error(`Unhandled Promise rejection: ${err && err.message}`);
    console.error(err);
});
process.on("uncaughtException", err => {
    console.error(`Unhandled Promise rejection: ${err && err.message}`);
    console.error(err);
});

configure({
    adapter: new Adapter(),
});
