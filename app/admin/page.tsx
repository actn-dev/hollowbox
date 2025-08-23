"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Users,
  Package,
  TrendingUp,
  CheckCircle,
  Clock,
  Truck,
  X,
  Plus,
  Trophy,
  Loader2,
  Edit,
  Save,
  DeleteIcon as Cancel,
  Shield,
} from "lucide-react"

interface AdminClaim {
  id: string
  itemId: string
  walletAddress: string
  userInfo: {
    name: string
    email: string
    address?: string
    phone?: string
    notes?: string
  }
  entries: number
  status: "pending" | "approved" | "shipped" | "completed" | "cancelled"
  claimedAt: string
  itemTitle: string
  itemCategory: string
  tokensRequired: number
  expirationDate?: string | null
  winnerAnnounced?: boolean
}

interface AdminStats {
  totalClaims: number
  pendingClaims: number
  approvedClaims: number
  shippedClaims: number
  completedClaims: number
  cancelledClaims: number
  uniqueUsers: number
  totalItems: number
  activeItems: number
  expiredItems: number
  itemsWithWinners: number
}

interface ClaimableItem {
  id: string
  title: string
  description: string
  imageUrl: string
  tokensRequired: number
  category: "digital" | "physical" | "experience"
  isActive: boolean
  claimsRemaining: number | null
  expirationDate: string | null
  winnerAnnounced: boolean
  winnerAnnouncedAt: string | null
  createdAt: string
}

interface TierConfig {
  id: string
  tierLevel: number
  tierName: string
  tokenRequirement: number
  tierColor: string
  tierBgColor: string
  tierBorderColor: string
  tierIcon: string
  benefits: string[]
  isActive: boolean
}

export default function AdminPage() {
  const [claims, setClaims] = useState<AdminClaim[]>([])
  const [items, setItems] = useState<ClaimableItem[]>([])
  const [tiers, setTiers] = useState<TierConfig[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isAnnouncingWinner, setIsAnnouncingWinner] = useState<string | null>(null)
  const [editingTier, setEditingTier] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    imageUrl: "",
    tokensRequired: "",
    category: "digital" as "digital" | "physical" | "experience",
    claimsRemaining: "",
    expirationDate: "",
  })

  useEffect(() => {
    fetchAdminData()
    fetchItems()
    fetchTiers()
  }, [])

  const fetchAdminData = async () => {
    try {
      const response = await fetch("/api/claim/admin")
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/claim/items")
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }

  const fetchTiers = async () => {
    try {
      const response = await fetch("/api/admin/tiers")
      if (response.ok) {
        const data = await response.json()
        setTiers(data)
      }
    } catch (error) {
      console.error("Error fetching tiers:", error)
    }
  }

  const updateClaimStatus = async (claimId: string, status: string) => {
    try {
      const response = await fetch(`/api/claim/admin/claims/${claimId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setClaims(claims.map((claim) => (claim.id === claimId ? { ...claim, status: status as any } : claim)))
        setMessage({ type: "success", text: "Claim status updated successfully" })
      } else {
        setMessage({ type: "error", text: "Failed to update claim status" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update claim status" })
    }
  }

  const createItem = async () => {
    if (!newItem.title || !newItem.description || !newItem.tokensRequired) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch("/api/claim/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItem,
          tokensRequired: Number(newItem.tokensRequired),
          claimsRemaining: newItem.claimsRemaining ? Number(newItem.claimsRemaining) : null,
          expirationDate: newItem.expirationDate || null,
        }),
      })

      if (response.ok) {
        const createdItem = await response.json()
        setItems([createdItem, ...items])
        setNewItem({
          title: "",
          description: "",
          imageUrl: "",
          tokensRequired: "",
          category: "digital",
          claimsRemaining: "",
          expirationDate: "",
        })
        setMessage({ type: "success", text: "Item created successfully" })
        fetchAdminData() // Refresh stats
      } else {
        setMessage({ type: "error", text: "Failed to create item" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create item" })
    } finally {
      setIsCreating(false)
    }
  }

  const announceWinner = async (itemId: string) => {
    try {
      setIsAnnouncingWinner(itemId)
      const response = await fetch("/api/claim/admin/announce-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({
          type: "success",
          text: `Winner announced! ${result.winner.userName} (${result.winner.walletAddress}) won with ${result.winner.entries} entries out of ${result.totalEntries} total entries.`,
        })
        fetchAdminData()
        fetchItems()
      } else {
        const errorData = await response.json()
        setMessage({ type: "error", text: errorData.error || "Failed to announce winner" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to announce winner" })
    } finally {
      setIsAnnouncingWinner(null)
    }
  }

  const updateTier = async (tierId: string, updatedData: Partial<TierConfig>) => {
    try {
      const response = await fetch(`/api/admin/tiers/${tierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      if (response.ok) {
        const updatedTier = await response.json()
        setTiers(tiers.map((tier) => (tier.id === tierId ? updatedTier : tier)))
        setEditingTier(null)
        setMessage({ type: "success", text: "Tier updated successfully" })
      } else {
        setMessage({ type: "error", text: "Failed to update tier" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update tier" })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "border-yellow-500 text-yellow-400", icon: Clock },
      approved: { color: "border-green-500 text-green-400", icon: CheckCircle },
      shipped: { color: "border-blue-500 text-blue-400", icon: Truck },
      completed: { color: "border-green-500 text-green-400", icon: CheckCircle },
      cancelled: { color: "border-red-500 text-red-400", icon: X },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config?.icon || Clock

    return (
      <Badge variant="outline" className={config?.color || "border-gray-500 text-gray-400"}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const canAnnounceWinner = (item: ClaimableItem) => {
    if (item.winnerAnnounced) return false
    if (item.expirationDate && new Date(item.expirationDate) > new Date()) return false
    return true
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
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
    )
  }

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl font-bold md:text-5xl mb-4">Admin Dashboard</h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Manage reward drawings, track claims, configure tiers, and announce winners
          </p>
        </div>

        {message && (
          <Alert
            className={`${message.type === "error" ? "border-red-500/50 bg-red-500/10" : "border-green-500/50 bg-green-500/10"}`}
          >
            <AlertDescription className={message.type === "error" ? "text-red-200" : "text-green-200"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Claims</p>
                    <p className="text-2xl font-bold">{stats.totalClaims}</p>
                  </div>
                  <Package className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Users</p>
                    <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Items</p>
                    <p className="text-2xl font-bold">{stats.activeItems}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Winners Announced</p>
                    <p className="text-2xl font-bold">{stats.itemsWithWinners}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">Drawing Items</TabsTrigger>
            <TabsTrigger value="tiers">Tier Management</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-8">
            {/* Create New Item */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                  <Plus className="h-6 w-6 text-primary" />
                  Create New Drawing Item
                </CardTitle>
                <CardDescription>Add a new item for users to enter drawings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      placeholder="1-on-1 Call with Jose"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value: any) => setNewItem({ ...newItem, category: value })}
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
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
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
                      onChange={(e) => setNewItem({ ...newItem, tokensRequired: e.target.value })}
                      placeholder="25000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="claimsRemaining">Winners to Select</Label>
                    <Input
                      id="claimsRemaining"
                      type="number"
                      value={newItem.claimsRemaining}
                      onChange={(e) => setNewItem({ ...newItem, claimsRemaining: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      type="datetime-local"
                      value={newItem.expirationDate}
                      onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    value={newItem.imageUrl}
                    onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <Button onClick={createItem} disabled={isCreating} className="w-full">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Drawing Item
                </Button>
              </CardContent>
            </Card>

            {/* Items Management */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary" />
                  Drawing Items Management
                </CardTitle>
                <CardDescription>Manage existing drawing items and announce winners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{item.title}</h3>
                            <Badge
                              variant="outline"
                              className={
                                item.isActive ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                              }
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {item.winnerAnnounced && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                                <Trophy className="h-3 w-3 mr-1" />
                                Winner Announced
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Category:</span>
                              <div className="font-medium capitalize">{item.category}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tokens Required:</span>
                              <div className="font-medium">{item.tokensRequired.toLocaleString()} HVX</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Winners:</span>
                              <div className="font-medium">{item.claimsRemaining || "Unlimited"}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expires:</span>
                              <div className="font-medium">
                                {item.expirationDate ? formatDateTime(item.expirationDate) : "No expiration"}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {canAnnounceWinner(item) && (
                            <Button
                              onClick={() => announceWinner(item.id)}
                              disabled={isAnnouncingWinner === item.id}
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              {isAnnouncingWinner === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Trophy className="h-4 w-4 mr-2" />
                              )}
                              Announce Winner
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiers" className="space-y-8">
            {/* Tier Management */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Tier Configuration
                </CardTitle>
                <CardDescription>Configure tier requirements and benefits for the rewards system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="p-6 bg-muted/20 rounded-lg">
                      {editingTier === tier.id ? (
                        <TierEditForm
                          tier={tier}
                          onSave={(updatedData) => updateTier(tier.id, updatedData)}
                          onCancel={() => setEditingTier(null)}
                        />
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <div
                                className={`w-12 h-12 rounded-full ${tier.tierBgColor} ${tier.tierBorderColor} border-2 flex items-center justify-center`}
                              >
                                <span className={`text-lg font-bold ${tier.tierColor}`}>{tier.tierLevel}</span>
                              </div>
                              <div>
                                <h3 className={`font-orbitron text-xl font-bold ${tier.tierColor}`}>
                                  Tier {tier.tierLevel}: {tier.tierName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Requires {tier.tokenRequirement.toLocaleString()} HVX tokens
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  tier.isActive ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                                }
                              >
                                {tier.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Benefits:</h4>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                                {tier.benefits.map((benefit, index) => (
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
          </TabsContent>

          <TabsContent value="claims" className="space-y-8">
            {/* Claims Management */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  Claims Management
                </CardTitle>
                <CardDescription>Review and manage user claims</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <div key={claim.id} className="p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{claim.itemTitle}</h3>
                            {getStatusBadge(claim.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">User:</span>
                              <div className="font-medium">{claim.userInfo.name}</div>
                              <div className="text-xs text-muted-foreground">{claim.userInfo.email}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Wallet:</span>
                              <div className="font-mono text-xs">{claim.walletAddress}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Entries:</span>
                              <div className="font-medium">{claim.entries}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Claimed:</span>
                              <div className="font-medium">{formatDateTime(claim.claimedAt)}</div>
                            </div>
                          </div>
                          {claim.userInfo.address && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Address:</span>
                              <div className="font-medium">{claim.userInfo.address}</div>
                            </div>
                          )}
                          {claim.userInfo.notes && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Notes:</span>
                              <div className="font-medium">{claim.userInfo.notes}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Select value={claim.status} onValueChange={(value) => updateClaimStatus(claim.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Tier Edit Form Component
function TierEditForm({
  tier,
  onSave,
  onCancel,
}: {
  tier: TierConfig
  onSave: (data: Partial<TierConfig>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    tierName: tier.tierName,
    tokenRequirement: tier.tokenRequirement.toString(),
    benefits: tier.benefits.join("\n"),
    isActive: tier.isActive,
  })

  const handleSave = () => {
    onSave({
      tierName: formData.tierName,
      tokenRequirement: Number(formData.tokenRequirement),
      benefits: formData.benefits.split("\n").filter((b) => b.trim()),
      isActive: formData.isActive,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tierName">Tier Name</Label>
          <Input
            id="tierName"
            value={formData.tierName}
            onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tokenRequirement">Token Requirement</Label>
          <Input
            id="tokenRequirement"
            type="number"
            value={formData.tokenRequirement}
            onChange={(e) => setFormData({ ...formData, tokenRequirement: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="benefits">Benefits (one per line)</Label>
        <Textarea
          id="benefits"
          value={formData.benefits}
          onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
          rows={6}
          placeholder="Enter each benefit on a new line"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex items-center gap-2 bg-transparent">
          <Cancel className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
