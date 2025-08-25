"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";

type TierConfig = RouterOutputs["tiers"]["getTiers"][0];

interface CreateTierFormProps {
  onSave: (tierData: {
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
  onCancel: () => void;
  isCreating: boolean;
  existingTiers: TierConfig[];
}

export function CreateTierForm({
  onSave,
  onCancel,
  isCreating,
  existingTiers,
}: CreateTierFormProps) {
  // Get the next available tier level
  const getNextTierLevel = () => {
    const maxLevel = Math.max(0, ...existingTiers.map((t) => t.tierLevel));
    return maxLevel + 1;
  };

  const [formData, setFormData] = useState({
    tierLevel: getNextTierLevel().toString(),
    tierName: "",
    tokenRequirement: "",
    tierColor: "text-gray-300",
    tierBgColor: "bg-gray-900",
    tierBorderColor: "border-gray-600",
    tierIcon: "⭐",
    benefits: "",
    isActive: true,
  });

  const colorOptions = [
    {
      name: "Bronze",
      color: "text-orange-400",
      bg: "bg-orange-900",
      border: "border-orange-600",
    },
    {
      name: "Silver",
      color: "text-gray-300",
      bg: "bg-gray-900",
      border: "border-gray-600",
    },
    {
      name: "Gold",
      color: "text-yellow-400",
      bg: "bg-yellow-900",
      border: "border-yellow-600",
    },
    {
      name: "Platinum",
      color: "text-blue-300",
      bg: "bg-blue-900",
      border: "border-blue-600",
    },
    {
      name: "Diamond",
      color: "text-purple-300",
      bg: "bg-purple-900",
      border: "border-purple-600",
    },
    {
      name: "Elite",
      color: "text-red-300",
      bg: "bg-red-900",
      border: "border-red-600",
    },
  ];

  const handleSave = () => {
    if (!formData.tierName || !formData.tokenRequirement) {
      return;
    }

    onSave({
      tierLevel: Number(formData.tierLevel),
      tierName: formData.tierName,
      tokenRequirement: Number(formData.tokenRequirement),
      tierColor: formData.tierColor,
      tierBgColor: formData.tierBgColor,
      tierBorderColor: formData.tierBorderColor,
      tierIcon: formData.tierIcon,
      benefits: formData.benefits.split("\n").filter((b) => b.trim()),
      isActive: formData.isActive,
    });
  };

  const setColorScheme = (colorOption: (typeof colorOptions)[0]) => {
    setFormData({
      ...formData,
      tierColor: colorOption.color,
      tierBgColor: colorOption.bg,
      tierBorderColor: colorOption.border,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tierLevel">Tier Level</Label>
          <Input
            id="tierLevel"
            type="number"
            value={formData.tierLevel}
            onChange={(e) =>
              setFormData({ ...formData, tierLevel: e.target.value })
            }
            min="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tierName">Tier Name *</Label>
          <Input
            id="tierName"
            value={formData.tierName}
            onChange={(e) =>
              setFormData({ ...formData, tierName: e.target.value })
            }
            placeholder="Bronze"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tokenRequirement">Token Requirement *</Label>
          <Input
            id="tokenRequirement"
            type="number"
            value={formData.tokenRequirement}
            onChange={(e) =>
              setFormData({ ...formData, tokenRequirement: e.target.value })
            }
            placeholder="1000000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tierIcon">Tier Icon</Label>
          <Input
            id="tierIcon"
            value={formData.tierIcon}
            onChange={(e) =>
              setFormData({ ...formData, tierIcon: e.target.value })
            }
            placeholder="⭐"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color Scheme</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {colorOptions.map((option) => (
            <Button
              key={option.name}
              variant="outline"
              size="sm"
              className={`${option.bg} ${option.border} ${option.color} hover:opacity-80`}
              onClick={() => setColorScheme(option)}
            >
              {option.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full ${formData.tierBgColor} ${formData.tierBorderColor} border-2 flex items-center justify-center`}
            >
              <span className={`text-lg font-bold ${formData.tierColor}`}>
                {formData.tierLevel}
              </span>
            </div>
            <div>
              <h3
                className={`font-orbitron text-xl font-bold ${formData.tierColor}`}
              >
                Tier {formData.tierLevel}: {formData.tierName || "Tier Name"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Requires{" "}
                {formData.tokenRequirement
                  ? Number(formData.tokenRequirement).toLocaleString()
                  : "0"}{" "}
                HVX tokens
              </p>
            </div>
          </div>
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
          placeholder="Access to exclusive Discord channels&#10;Priority support&#10;Early access to features"
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

      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleSave}
          disabled={
            isCreating || !formData.tierName || !formData.tokenRequirement
          }
          className="flex items-center gap-2"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create Tier
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex items-center gap-2 bg-transparent"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
