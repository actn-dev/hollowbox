import type {
  BetterAuthPlugin,
  HookEndpointContext,
  MiddlewareInputContext,
} from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { createAuthMiddleware } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import {
  Account,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Transaction,
  TransactionBuilder,
} from "stellar-sdk";
import { z } from "zod";
import { session as Session } from "./auth-schema";

export type StellarPluginOptions = {
  network: "PUBLIC" | "TESTNET" | { passphrase: string };
  horizonURL?: string; // optional (not used in minimal flow)
  serverSecret: string; // SB.... secret of the server auth account
  webAuthDomain: string; // e.g. auth.example.com
  homeDomain: string; // e.g. app.example.com
  emailDomainName: string; // for creating synthetic emails for users
  challengeTTL?: number; // seconds, default 300
  db: any;
};

function base64Url(bytes: Uint8Array) {
  const b64 = Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomNonce(size = 24) {
  return base64Url(randomBytes(size));
}

export const stellar = (opts: StellarPluginOptions) => {
  // Validate required options early to avoid opaque errors from stellar-sdk
  if (!opts || typeof opts !== "object") {
    throw new Error("stellar plugin: options are required");
  }
  if (!opts.serverSecret || typeof opts.serverSecret !== "string") {
    throw new Error(
      "stellar plugin: STELLAR_SERVER_SECRET (serverSecret) is missing or not a string"
    );
  }
  if (!opts.webAuthDomain || !opts.homeDomain) {
    throw new Error(
      "stellar plugin: WEB_AUTH_DOMAIN and HOME_DOMAIN are required"
    );
  }
  if (!opts.emailDomainName) {
    throw new Error(
      "stellar plugin: EMAIL_DOMAIN_NAME is required to generate fallback emails"
    );
  }
  const serverKeypair = Keypair.fromSecret(opts.serverSecret);
  const serverPublicKey = serverKeypair.publicKey();
  const networkPassphrase =
    typeof opts.network === "string"
      ? opts.network === "PUBLIC"
        ? Networks.PUBLIC
        : Networks.TESTNET
      : opts.network.passphrase;
  const ttl = Math.max(30, opts.challengeTTL ?? 300);

  return {
    id: "stellar",
    endpoints: {
      // GET /stellar/challenge?account=G...&client_domain=optional
      challenge: createAuthEndpoint(
        "/stellar/challenge",
        {
          method: "GET",
          query: z.object({
            account: z.string().min(1),
            client_domain: z.string().optional(),
          }),
        },
        async (ctx) => {
          try {
            const { account, client_domain } = ctx.query;

            // Build SEP-10 challenge transaction
            const now = Math.floor(Date.now() / 1000);
            const nonce = randomNonce();
            const serverAccount = new Account(serverPublicKey, "0");
            const builder = new TransactionBuilder(serverAccount, {
              fee: (Number(BASE_FEE) * 1).toString(),
              networkPassphrase,
              timebounds: { minTime: now, maxTime: now + ttl },
            })
              // web_auth_domain (server domain) — operation source = server
              .addOperation(
                Operation.manageData({
                  name: "web_auth_domain",
                  value: opts.webAuthDomain,
                  source: serverPublicKey,
                })
              )
              // home_domain — operation source = client account
              .addOperation(
                Operation.manageData({
                  name: "home_domain",
                  value: opts.homeDomain,
                  source: account,
                })
              )
              // nonce — operation source = client account
              .addOperation(
                Operation.manageData({
                  name: "nonce",
                  value: nonce,
                  source: account,
                })
              );

            if (client_domain) {
              builder.addOperation(
                Operation.manageData({
                  name: "client_domain",
                  value: client_domain,
                  source: account,
                })
              );
            }

            const tx = builder.build();
            tx.sign(serverKeypair);

            // store nonce in verification table to prevent replay
            const expiresAt = new Date((now + ttl) * 1000);
            const identifier = `stellar:nonce:${nonce}`;
            await ctx.context.adapter.create({
              model: "verification",
              data: {
                identifier,
                value: JSON.stringify({ account }),
                expiresAt,
              },
            });

            return ctx.json({
              xdr: tx.toXDR(),
              networkPassphrase,
              nonce,
              expiresAt: expiresAt.toISOString(),
            });
          } catch (e: any) {
            ctx.context.logger.error("stellar_challenge_failed", e);
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "stellar_challenge_failed",
            });
          }
        }
      ),

      // POST /stellar/verify
      verify: createAuthEndpoint(
        "/stellar/verify",
        {
          method: "POST",
          body: z.object({
            xdr: z.string().min(1),
            account: z.string().min(1),
            wallet_type: z.string().optional(),
          }),
        },
        async (ctx) => {
          try {
            const { xdr, account, wallet_type } = ctx.body;
            let tx: Transaction;
            try {
              tx = new Transaction(xdr, networkPassphrase);
            } catch {
              throw new APIError("BAD_REQUEST", { message: "invalid_xdr" });
            }

            // Basic SEP-10 checks
            if (tx.source !== serverPublicKey) {
              throw new APIError("BAD_REQUEST", { message: "invalid_source" });
            }
            const seq: any = (tx as any).sequence;
            const isZeroSeq = String(seq) === "0";
            if (!isZeroSeq) {
              // throw new APIError("BAD_REQUEST", {
              //   message: "invalid_sequence",
              // });
            }
            if (
              !tx.timeBounds ||
              Date.now() / 1000 > Number(tx.timeBounds.maxTime ?? "0")
            ) {
              throw new APIError("BAD_REQUEST", { message: "expired" });
            }

            const ops = tx.operations;
            const findOp = (name: string) =>
              ops.find((o: any) => "name" in o && o.name === name) as any;
            const nonceOp = findOp("nonce");
            const homeDomainOp = findOp("home_domain");
            const webAuthDomainOp = findOp("web_auth_domain");

            if (!nonceOp || !homeDomainOp || !webAuthDomainOp) {
              throw new APIError("BAD_REQUEST", { message: "missing_ops" });
            }
            if (homeDomainOp.source !== account) {
              throw new APIError("BAD_REQUEST", {
                message: "invalid_home_domain_source",
              });
            }
            if (
              (webAuthDomainOp.value?.toString?.() ?? webAuthDomainOp.value) !==
              opts.webAuthDomain
            ) {
              throw new APIError("BAD_REQUEST", {
                message: "invalid_web_auth_domain",
              });
            }
            const nonce = (nonceOp.value?.toString?.() ??
              nonceOp.value) as string;
            if (!nonce) {
              throw new APIError("BAD_REQUEST", { message: "invalid_nonce" });
            }

            // Ensure nonce exists and is fresh, then consume it
            const verification: any = await ctx.context.adapter.findOne({
              model: "verification",
              where: [{ field: "identifier", value: `stellar:nonce:${nonce}` }],
            });
            if (
              !verification ||
              (verification.expiresAt &&
                new Date(verification.expiresAt).valueOf() < Date.now())
            ) {
              throw new APIError("BAD_REQUEST", {
                message: "nonce_not_found_or_expired",
              });
            }
            await ctx.context.adapter.delete({
              model: "verification",
              where: [{ field: "id", value: verification.id }],
            });

            // Verify signatures: server and client
            const hash = tx.hash();
            const serverVerified = tx.signatures.some((sig: any) =>
              Keypair.fromPublicKey(serverPublicKey).verify(
                hash,
                sig.signature()
              )
            );
            if (!serverVerified) {
              throw new APIError("BAD_REQUEST", {
                message: "server_sig_missing",
              });
            }
            const clientVerified = tx.signatures.some((sig: any) =>
              Keypair.fromPublicKey(account).verify(hash, sig.signature())
            );
            if (!clientVerified) {
              throw new APIError("BAD_REQUEST", {
                message: "client_sig_missing",
              });
            }

            // Find or create user linked to this Stellar account
            const providerId = "stellar";
            let linked =
              await ctx.context.internalAdapter.findAccountByProviderId(
                account,
                providerId
              );
            let userId: string;
            if (linked) {
              userId = linked.userId;
            } else {
              const email = `${account.toLowerCase()}@${opts.emailDomainName}`;
              const createdUser = await ctx.context.internalAdapter.createUser(
                {
                  email,
                  name: account,
                  image: null,
                  emailVerified: true,
                  stellarPublicKey: account,
                },
                ctx
              );
              if (!createdUser) {
                throw new APIError("UNPROCESSABLE_ENTITY", {
                  message: "failed_to_create_user",
                });
              }
              userId = createdUser.id;
              await ctx.context.internalAdapter.linkAccount(
                {
                  userId,
                  providerId,
                  accountId: account,
                  scope: networkPassphrase, // store network for reference
                },
                ctx
              );
            }

            const session = await ctx.context.internalAdapter.createSession(
              userId,
              ctx
            );

            await opts.db
              .update(Session)
              .set({ loginType: wallet_type || "stellar" })
              .where(eq(Session.id, session.id));

            console.log("verify session", session);

            if (!session) {
              throw new APIError("INTERNAL_SERVER_ERROR", {
                message: "failed_to_create_session",
              });
            }

            // Set session cookie
            await ctx.setSignedCookie(
              ctx.context.authCookies.sessionToken.name,
              session.token,
              ctx.context.secret,
              ctx.context.authCookies.sessionToken.options
            );

            return ctx.json({ status: true });
          } catch (e: any) {
            ctx.context.logger.error("stellar_verify_failed", e);
            if (e instanceof APIError) throw e;
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "stellar_verify_failed",
            });
          }
        }
      ),
    },
    hooks: {
      after: [
        {
          matcher: (ctx: HookEndpointContext) => ctx.path === "/stellar/verify",
          handler: createAuthMiddleware(async (ctx) => {
            console.log("ctx xxx", ctx);
            try {
              const session = ctx.context.newSession;
              console.log("session", session);
              if (session?.user?.id) {
                const userId = session.user.id;
                const body = ctx.body as any;
                const publicKey = body.account;
                const loginType = body.wallet_type || "stellar";
                const isCustodial = false;

                if (ctx.context.newSession?.session?.id) {
                  await opts.db
                    .update(Session)
                    .set({ loginType })
                    .where(eq(Session.id, ctx.context.newSession.session.id));
                }

                await ctx.context.internalAdapter.updateUser(userId, {
                  stellarPublicKey: publicKey,
                  isCustodial,
                });

                console.log(
                  `User ${userId} logged in via ${loginType} with Stellar key: ${publicKey}`
                );
              }
            } catch (error) {
              ctx.context.logger.error("stellar_after_hook_failed", error);
            }
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
};

export default stellar;
