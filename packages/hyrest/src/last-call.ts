export interface LastCall {
    readonly statusCode: number;
    readonly message: string;
}

let lastCall: LastCall;

export function setLastCall(last: LastCall) {
    lastCall = last;
}

export function consumeLastCall() {
    const last = lastCall;
    lastCall = undefined;
    return last;
}
