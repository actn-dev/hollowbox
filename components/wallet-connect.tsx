"use client";

import { AuthModal } from "auth-client";
import { useState } from "react";
import "auth-client/styles";
import { authClient } from "@/lib/auth/auth-client";

export function ConnectWallet() {
  const [open, setOpen] = useState(false);
  const session = authClient.useSession();
  console.log(session);

  return (
    <>
      <button onClick={() => setOpen(true)}>Connect</button>
      {session.data?.user && (
        <div>
          {session.data.user.name}
          <button onClick={() => authClient.signOut()}>SignOut</button>
        </div>
      )}
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        client={authClient}
      />
    </>
  );
}
