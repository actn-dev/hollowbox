import { createAuthClient } from "auth-client";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});
