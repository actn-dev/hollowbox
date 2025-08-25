"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Shield, CheckCircle, Edit, Plus } from "lucide-react";
import { TierEditForm } from "./tier-edit-form";
import { CreateTierForm } from "./create-tier-form";
import type { RouterOutputs } from "~/trpc/react";

type TierConfig = RouterOutputs["tiers"]["getTiers"][0];

interface TierManagementProps {
  tiers: TierConfig[];
  onUpdateTier: (updatedData: Partial<TierConfig> & { id: string }) => void;
  onCreateTier: (tierData: {
    tierLevel: number;
    tierName: string;
    tokenRequirement: number;
    tierColor: string;
    tierBgColor: string;
    tierBorderColor: string;
    tierIcon: string;
    benefits: string[];
    isActive: boolean;
  }) => void;
  editingTier: string | null;
  setEditingTier: (id: string | null) => void;
  isCreatingTier: boolean;
}

export function TierManagement({
  tiers,
  onUpdateTier,
  onCreateTier,
  editingTier,
  setEditingTier,
  isCreatingTier,
}: TierManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Tier Configuration
        </CardTitle>
        <CardDescription>
          Configure tier requirements and benefits for the rewards system
        </CardDescription>
        <div className="flex justify-end">
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Tier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Tier</DialogTitle>
                <DialogDescription>
                  Add a new tier configuration to the rewards system
                </DialogDescription>
              </DialogHeader>
              <CreateTierForm
                onSave={(tierData) => {
                  onCreateTier(tierData);
                  setShowCreateModal(false);
                }}
                onCancel={() => setShowCreateModal(false)}
                isCreating={isCreatingTier}
                existingTiers={tiers}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {tiers
            .sort((a, b) => a.tierLevel - b.tierLevel)
            .map((tier) => (
              <div key={tier.id} className="p-6 bg-muted/20 rounded-lg">
                {editingTier === tier.id ? (
                  <TierEditForm
                    tier={tier}
                    onSave={(updatedData) =>
                      onUpdateTier(
                        updatedData as Partial<TierConfig> & { id: string }
                      )
                    }
                    onCancel={() => setEditingTier(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-12 h-12 rounded-full ${tier.tierBgColor} ${tier.tierBorderColor} border-2 flex items-center justify-center`}
                        >
                          <span
                            className={`text-lg font-bold ${tier.tierColor}`}
                          >
                            {tier.tierLevel}
                          </span>
                        </div>
                        <div>
                          <h3
                            className={`font-orbitron text-xl font-bold ${tier.tierColor}`}
                          >
                            Tier {tier.tierLevel}: {tier.tierName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Requires {tier.tokenRequirement.toLocaleString()}{" "}
                            HVX tokens
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            tier.isActive
                              ? "border-green-500 text-green-400"
                              : "border-red-500 text-red-400"
                          }
                        >
                          {tier.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Benefits:</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                          {(tier.benefits as string[]).map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 mt-0.5 text-green-400 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
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
  );
}
