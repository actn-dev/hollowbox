import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, jwt } from "better-auth/plugins";
import { session as Session } from "./auth-schema";
import { eq } from "drizzle-orm";

// import { stellar } from "auth-client/server";
import { stellar } from "./stellar";
import { db } from "@/server/db";
// import { expo } from "@better-auth/expo";

// Custodial server service

class CustodialService {
  private static baseUrl = "https://accounts.action-tokens.com";

  static async getOrCreatePublicKey(email: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/pub?email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        throw new Error(`Custodial server error: ${response.status}`);
      }

      const data = await response.json();
      return data.publicKey; // Expected: "G..." format
    } catch (error) {
      console.error("Failed to get custodial public key:", error);
      throw error;
    }
  }
}

export const auth = betterAuth({
  // Register Stellar plugin (minimal SEP-10)
  plugins: [
    // expo(),
    jwt(),
    stellar({
      network: (process.env.STELLAR_NETWORK as any) || "TESTNET",
      serverSecret: process.env.STELLAR_SERVER_SECRET as string,
      webAuthDomain: process.env.WEB_AUTH_DOMAIN ?? "https://auth.local",
      homeDomain: process.env.HOME_DOMAIN ?? "https://home.local",
      emailDomainName: process.env.EMAIL_DOMAIN_NAME || "stellar.local",
      challengeTTL: 300,
      db: db,
    }),
  ],
  database: drizzleAdapter(db, {
    provider: "sqlite", // or "mysql", "sqlite"
  }),

  // Extend user table with Stellar-specific fields
  user: {
    additionalFields: {
      stellarPublicKey: {
        type: "string",
        required: false,
        input: false, // Don't allow user to set this directly
      },
      isCustodial: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },

  // Extend session table with login-specific data
  session: {
    additionalFields: {
      loginType: {
        type: "string",
        required: false,
        input: true, // Allow direct input
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Only run for specific auth endpoints
      console.log("Auth hook triggered for path:", ctx.path);
      if (
        ctx.path === "/sign-in/social" ||
        ctx.path === "/sign-up/email" ||
        ctx.path === "/sign-in/email" ||
        ctx.path.startsWith("/callback/") // Google/social login callback
      ) {
        try {
          const session = ctx.context.newSession;
          if (session?.user?.id) {
            const userId = session.user.id;
            const email = session.user.email;

            let loginType: string;
            let publicKey: string;
            let isCustodial = false;

            if (ctx.path.startsWith("/callback/")) {
              console.log("Social login callback detected");
              // Social login callback (Google, etc.)
              // Extract provider from path: /callback/google -> google
              const provider = ctx.params.id || "unknown";
              loginType = provider;
              isCustodial = true;

              // Get custodial public key
              if (email) {
                publicKey = await CustodialService.getOrCreatePublicKey(email);
              } else {
                throw new Error("No email found for social login");
              }
            } else {
              // Email/password login
              loginType = "emailPass";
              isCustodial = true;

              // Get custodial public key
              if (email) {
                publicKey = await CustodialService.getOrCreatePublicKey(email);
              } else {
                throw new Error("No email found for email/password login");
              }
            }

            console.log("loginType", loginType, publicKey);
            if (ctx.context.newSession?.session?.id)
              await db
                .update(Session)
                .set({
                  loginType,
                })
                .where(eq(Session.id, ctx.context.newSession.session.id));

            await ctx.context.internalAdapter.updateUser(userId, {
              stellarPublicKey: publicKey,
              isCustodial,
            });

            // Update session with loginType
            if (ctx.context.newSession?.session?.id) {
              try {
              } catch (error) {
                console.error("Failed to update session:", error);
              }
            }

            // Link custodial accounts to Better-auth for consistency
            if (isCustodial) {
              const existingLink =
                await ctx.context.internalAdapter.findAccountByProviderId(
                  publicKey,
                  "stellar-custodial"
                );

              if (!existingLink) {
                await ctx.context.internalAdapter.linkAccount({
                  userId,
                  providerId: "stellar-custodial",
                  accountId: publicKey,
                  scope: "custodial",
                });
              }
            }

            console.log(
              `User ${userId} logged in via ${loginType} with Stellar key: ${publicKey}`
            );
          }
        } catch (error) {
          console.error("Hook failed to process login:", error);
          // Don't throw - allow auth to continue even if this fails
        }
      }
    }),
  },
  trustedOrigins: [
    "myapp://",
    "http://localhost:8081",
    "http://localhost:5173",
    "http://localhost:3000",
    "https://hollowbox.vercel.app",
  ],
  advanced: {
    defaultCookieAttributes: {
      sameSite: "None", // Use "None" for cross-origin
      secure: true,
      // httpOnly: true,
      // path: "/",
      // partitioned: true, // New browser standards will mandate this for foreign cookies
    },
  },
});
