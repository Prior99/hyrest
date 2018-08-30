export interface Target {
    value: any;
    checked?: boolean;
    type: string;
}

export interface ReactEvent {
    target: Target;
}
