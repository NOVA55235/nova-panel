export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter, customFetch as apiFetch } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
