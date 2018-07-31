/**
 * Checks if the application is running in a browser or in Node.
 *
 * @return `true` if running in a browser and `false` otherwise.
 */
export function isBrowser() {
    return typeof window === "object" && typeof document === "object";
}
