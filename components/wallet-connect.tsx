"use client";

import { AuthModal } from "auth-client";
import { useState } from "react";
import "auth-client/styles";
import { authClient } from "@/lib/auth/auth-client";

export function ConnectWallet() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Connect</button>
      <button onClick={() => authClient.signOut()}>SignOut</button>
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        client={authClient}
      />
    </>
  );
}
