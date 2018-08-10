/**
 * A context factory, being provided to `@hasFields` to retrieve the context inside
 * the `Field` instances.
 */
export type ContextFactory<TContext> = () => TContext;
