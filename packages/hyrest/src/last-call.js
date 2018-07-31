"use strict";
exports.__esModule = true;
var lastCall;
function setLastCall(last) {
    lastCall = last;
}
exports.setLastCall = setLastCall;
function consumeLastCall() {
    var last = lastCall;
    lastCall = undefined;
    return last;
}
exports.consumeLastCall = consumeLastCall;
