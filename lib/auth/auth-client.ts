import { getBaseUrl } from "@/trpc/react";
import { createAuthClient } from "auth-client";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});
