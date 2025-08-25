"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

import { TierEditForm } from "@/components/admin/tier-edit-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Edit, Shield, Truck, X } from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";

type AdminClaim = RouterOutputs["claim"]["getAdminDashboard"]["claims"][0];
type ClaimableItem = RouterOutputs["claim"]["getItems"][0];
type TierConfig = RouterOutputs["tiers"]["getTiers"][0];

export default function AdminPage() {
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    imageUrl: "",
    tokensRequired: "",
    category: "digital" as "digital" | "physical" | "experience",
    claimsRemaining: "",
    expirationDate: "",
  });

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
      setNewItem({
        title: "",
        description: "",
        imageUrl: "",
        tokensRequired: "",
        category: "digital",
        claimsRemaining: "",
        expirationDate: "",
      });
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
      refetchAdminData();
      refetchItems();
    },
    onError: (error) => {
      setMessage({
        type: "error",
        text: error.message || "Failed to announce winner",
      });
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

  const handleCreateItem = () => {
    if (!newItem.title || !newItem.description || !newItem.tokensRequired) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }
    createItemMutation.mutate({
      ...newItem,
      tokensRequired: Number(newItem.tokensRequired),
      claimsRemaining: newItem.claimsRemaining
        ? Number(newItem.claimsRemaining)
        : null,
      expirationDate: newItem.expirationDate
        ? new Date(newItem.expirationDate)
        : null,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "border-yellow-500 text-yellow-400", icon: Clock },
      approved: { color: "border-green-500 text-green-400", icon: CheckCircle },
      shipped: { color: "border-blue-500 text-blue-400", icon: Truck },
      completed: {
        color: "border-green-500 text-green-400",
        icon: CheckCircle,
      },
      cancelled: { color: "border-red-500 text-red-400", icon: X },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge
        variant="outline"
        className={config?.color || "border-gray-500 text-gray-400"}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const canAnnounceWinner = (item: ClaimableItem) => {
    if (item.winnerAnnounced) return false;
    if (item.expirationDate && new Date(item.expirationDate) > new Date())
      return false;
    return true;
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

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

        {adminData?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
          </div>
        )}

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">Drawing Items</TabsTrigger>
            <TabsTrigger value="tiers">Tier Management</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-8">
            {/* Create and Manage Items */}
          </TabsContent>

          <TabsContent value="tiers" className="space-y-8">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Tier Configuration
                </CardTitle>
                <CardDescription>
                  Configure tier requirements and benefits for the rewards
                  system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {tiers?.map((tier) => (
                    <div key={tier.id} className="p-6 bg-muted/20 rounded-lg">
                      {editingTier === tier.id ? (
                        <TierEditForm
                          tier={tier}
                          onSave={(updatedData) =>
                            updateTierMutation.mutate(updatedData as any)
                          }
                          onCancel={() => setEditingTier(null)}
                        />
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          {/* Tier Display */}
                          <Button
                            onClick={() => setEditingTier(tier.id)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-8">
            {/* Claims Management */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
