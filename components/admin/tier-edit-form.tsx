"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, DeleteIcon as Cancel } from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";

type TierConfig = RouterOutputs["tiers"]["getTiers"][0];

interface TierEditFormProps {
  tier: TierConfig;
  onSave: (data: Partial<TierConfig>) => void;
  onCancel: () => void;
}

export function TierEditForm({ tier, onSave, onCancel }: TierEditFormProps) {
  const [formData, setFormData] = useState({
    tierName: tier.tierName,
    tokenRequirement: tier.tokenRequirement.toString(),
    benefits: (tier.benefits as string[]).join("\n"),
    isActive: tier.isActive,
  });

  const handleSave = () => {
    onSave({
      id: tier.id,
      tierName: formData.tierName,
      tokenRequirement: Number(formData.tokenRequirement),
      benefits: formData.benefits.split("\n").filter((b) => b.trim()),
      isActive: formData.isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tierName">Tier Name</Label>
          <Input
            id="tierName"
            value={formData.tierName}
            onChange={(e) =>
              setFormData({ ...formData, tierName: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tokenRequirement">Token Requirement</Label>
          <Input
            id="tokenRequirement"
            type="number"
            value={formData.tokenRequirement}
            onChange={(e) =>
              setFormData({ ...formData, tokenRequirement: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="benefits">Benefits (one per line)</Label>
        <Textarea
          id="benefits"
          value={formData.benefits}
          onChange={(e) =>
            setFormData({ ...formData, benefits: e.target.value })
          }
          rows={6}
          placeholder="Enter each benefit on a new line"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.target.checked })
          }
          className="rounded"
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex items-center gap-2 bg-transparent"
        >
          <Cancel className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
