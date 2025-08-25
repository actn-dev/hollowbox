"use client";

import { authClient } from "@/lib/auth/auth-client";

export function useAuth() {
  const session = authClient.useSession();

  const user = session.data?.user;
  const isConnected = !!user;
  const publicKey = (session.data?.user as any)?.stellarPublicKey as
    | string
    | undefined;
  const walletType = (session.data?.session as any)?.loginType as
    | string
    | undefined;

  return {
    session,
    user,
    isConnected,
    publicKey,
    walletType,
    isLoading: session.isPending,
  };
}
