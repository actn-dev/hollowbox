"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { AdminStatsCards } from "@/components/admin/admin-stats-cards";
import { CreateItemForm } from "@/components/admin/create-item-form";
import { ItemsManagement } from "@/components/admin/items-management";
import { TierManagement } from "@/components/admin/tier-management";
import { ClaimsManagement } from "@/components/admin/claims-management";

type ClaimableItem = RouterOutputs["claim"]["getItems"][0];
type TierConfig = RouterOutputs["tiers"]["getTiers"][0];

export default function AdminPage() {
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [isAnnouncingWinner, setIsAnnouncingWinner] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // tRPC Hooks
  const {
    data: adminData,
    isLoading: isLoadingAdmin,
    refetch: refetchAdminData,
  } = api.claim.getAdminDashboard.useQuery();
  const { data: items, refetch: refetchItems } = api.claim.getItems.useQuery();
  const { data: tiers, refetch: refetchTiers } = api.tiers.getTiers.useQuery();

  const createItemMutation = api.claim.createItem.useMutation({
    onSuccess: () => {
      setMessage({ type: "success", text: "Item created successfully" });
      refetchItems();
      refetchAdminData();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error.message || "Failed to create item",
      });
    },
  });

  const updateClaimStatusMutation = api.claim.updateClaimStatus.useMutation({
    onSuccess: () => {
      setMessage({
        type: "success",
        text: "Claim status updated successfully",
      });
      refetchAdminData();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error.message || "Failed to update claim status",
      });
    },
  });

  const announceWinnerMutation = api.claim.announceWinner.useMutation({
    onSuccess: (data) => {
      setMessage({
        type: "success",
        text: `Winner announced! ${data.winner?.userName} (${data.winner?.walletAddress}) won.`,
      });
      setIsAnnouncingWinner(null);
      refetchAdminData();
      refetchItems();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error.message || "Failed to announce winner",
      });
      setIsAnnouncingWinner(null);
    },
  });

  const updateTierMutation = api.tiers.updateTier.useMutation({
    onSuccess: () => {
      setMessage({ type: "success", text: "Tier updated successfully" });
      setEditingTier(null);
      refetchTiers();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error.message || "Failed to update tier",
      });
    },
  });

  const createTierMutation = api.tiers.createTier.useMutation({
    onSuccess: () => {
      setMessage({ type: "success", text: "Tier created successfully" });
      refetchTiers();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error.message || "Failed to create tier",
      });
    },
  });

  const handleCreateItem = (
    itemData: Parameters<typeof createItemMutation.mutate>[0]
  ) => {
    createItemMutation.mutate(itemData);
  };

  const handleAnnounceWinner = (itemId: string) => {
    setIsAnnouncingWinner(itemId);
    announceWinnerMutation.mutate({ itemId });
  };

  const handleUpdateClaimStatus = (claimId: string, status: string) => {
    updateClaimStatusMutation.mutate({ claimId, status });
  };

  const handleUpdateTier = (
    updatedData: Partial<TierConfig> & { id: string }
  ) => {
    updateTierMutation.mutate(updatedData);
  };

  const handleCreateTier = (
    tierData: Parameters<typeof createTierMutation.mutate>[0]
  ) => {
    createTierMutation.mutate(tierData);
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (isLoadingAdmin) {
    return (
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl font-bold md:text-5xl mb-4">
            Admin Dashboard
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Manage reward drawings, track claims, configure tiers, and announce
            winners
          </p>
        </div>

        {message && (
          <Alert
            className={`${
              message.type === "error"
                ? "border-red-500/50 bg-red-500/10"
                : "border-green-500/50 bg-green-500/10"
            }`}
          >
            <AlertDescription
              className={
                message.type === "error" ? "text-red-200" : "text-green-200"
              }
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {adminData?.stats && <AdminStatsCards stats={adminData.stats} />}

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">Drawing Items</TabsTrigger>
            <TabsTrigger value="tiers">Tier Management</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-8">
            <CreateItemForm
              onCreateItem={handleCreateItem}
              isCreating={createItemMutation.isPending}
            />
            {items && (
              <ItemsManagement
                items={items}
                onAnnounceWinner={handleAnnounceWinner}
                isAnnouncingWinner={isAnnouncingWinner}
              />
            )}
          </TabsContent>

          <TabsContent value="tiers" className="space-y-8">
            {tiers && (
              <TierManagement
                tiers={tiers}
                onUpdateTier={handleUpdateTier}
                onCreateTier={handleCreateTier}
                editingTier={editingTier}
                setEditingTier={setEditingTier}
                isCreatingTier={createTierMutation.isPending}
              />
            )}
          </TabsContent>

          <TabsContent value="claims" className="space-y-8">
            {adminData?.claims && (
              <ClaimsManagement
                claims={adminData.claims}
                onUpdateClaimStatus={handleUpdateClaimStatus}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
