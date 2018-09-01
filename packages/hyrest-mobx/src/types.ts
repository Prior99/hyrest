export interface Indexable<KeyType> {
    id?: KeyType;
}

export interface Target {
    value: any;
    checked?: boolean;
    type: string;
}

export interface ReactEvent {
    target: Target;
}

/**
 * A context factory, being provided to `@hasFields` to retrieve the context inside
 * the `Field` instances.
 */
export type ContextFactory<TContext> = () => TContext;
