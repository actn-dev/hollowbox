"use client";

import { AuthModal } from "auth-client";
import "auth-client/styles";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { authClient } from "@/lib/auth/auth-client";

export function AuthModalController() {
  const { isModalOpen, closeModal } = useAuthModal();

  return (
    <AuthModal open={isModalOpen} onClose={closeModal} client={authClient} />
  );
}
