import { createAuth } from "auth-client/server";
import { db } from "~/server/db";

export const auth = createAuth(db);
