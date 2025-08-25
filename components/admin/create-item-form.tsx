"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

interface CreateItemFormProps {
  onCreateItem: (itemData: {
    title: string;
    description: string;
    imageUrl: string;
    tokensRequired: number;
    category: "digital" | "physical" | "experience";
    claimsRemaining: number | null;
    expirationDate: Date | null;
  }) => void;
  isCreating: boolean;
}

export function CreateItemForm({
  onCreateItem,
  isCreating,
}: CreateItemFormProps) {
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    imageUrl: "",
    tokensRequired: "",
    category: "digital" as "digital" | "physical" | "experience",
    claimsRemaining: "",
    expirationDate: "",
  });

  const handleCreateItem = () => {
    if (!newItem.title || !newItem.description || !newItem.tokensRequired) {
      return;
    }

    onCreateItem({
      ...newItem,
      tokensRequired: Number(newItem.tokensRequired),
      claimsRemaining: newItem.claimsRemaining
        ? Number(newItem.claimsRemaining)
        : null,
      expirationDate: newItem.expirationDate
        ? new Date(newItem.expirationDate)
        : null,
    });

    // Reset form after successful creation
    setNewItem({
      title: "",
      description: "",
      imageUrl: "",
      tokensRequired: "",
      category: "digital",
      claimsRemaining: "",
      expirationDate: "",
    });
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
          <Plus className="h-6 w-6 text-primary" />
          Create New Drawing Item
        </CardTitle>
        <CardDescription>
          Add a new item for users to enter drawings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={newItem.title}
              onChange={(e) =>
                setNewItem({ ...newItem, title: e.target.value })
              }
              placeholder="1-on-1 Call with Jose"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={newItem.category}
              onValueChange={(value: any) =>
                setNewItem({ ...newItem, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={newItem.description}
            onChange={(e) =>
              setNewItem({ ...newItem, description: e.target.value })
            }
            placeholder="Exclusive 30-minute 1-on-1 call with Jose to discuss your project"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tokensRequired">Tokens Required *</Label>
            <Input
              id="tokensRequired"
              type="number"
              value={newItem.tokensRequired}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  tokensRequired: e.target.value,
                })
              }
              placeholder="25000000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="claimsRemaining">Winners to Select</Label>
            <Input
              id="claimsRemaining"
              type="number"
              value={newItem.claimsRemaining}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  claimsRemaining: e.target.value,
                })
              }
              placeholder="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              type="datetime-local"
              value={newItem.expirationDate}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  expirationDate: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL (Optional)</Label>
          <Input
            id="imageUrl"
            value={newItem.imageUrl}
            onChange={(e) =>
              setNewItem({ ...newItem, imageUrl: e.target.value })
            }
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <Button
          onClick={handleCreateItem}
          disabled={
            isCreating ||
            !newItem.title ||
            !newItem.description ||
            !newItem.tokensRequired
          }
          className="w-full"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Create Drawing Item
        </Button>
      </CardContent>
    </Card>
  );
}
