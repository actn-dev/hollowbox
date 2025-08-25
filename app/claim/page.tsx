"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Gift,
  Search,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Package,
  Star,
  Loader2,
  Ticket,
  Clock,
  Trophy,
} from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";

type ClaimableItem = RouterOutputs["claim"]["getItems"][0];
type UserClaim = RouterOutputs["claim"]["getUserClaims"][0];

interface WalletInfo {
  address: string;
  totalBalance: number;
}

export default function ClaimPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [submittedWalletAddress, setSubmittedWalletAddress] = useState("");
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClaimableItem | null>(null);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    notes: "",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // tRPC Hooks
  const {
    data: items,
    isLoading: isLoadingItems,
    refetch: refetchItems,
  } = api.claim.getItems.useQuery();

  const {
    data: balanceData,
    error: balanceError,
    isFetching: isCheckingWallet,
    refetch: refetchBalance,
  } = api.claim.checkBalance.useQuery(
    { address: submittedWalletAddress },
    { enabled: false }
  );

  useEffect(() => {
    if (balanceData) {
      setWalletInfo({
        address: submittedWalletAddress,
        totalBalance: balanceData.totalBalance,
      });
    }
    if (balanceError) {
      setMessage({
        type: "error",
        text: balanceError.message || "Failed to check wallet balance",
      });
    }
  }, [balanceData, balanceError, submittedWalletAddress]);

  const { data: userClaims, refetch: refetchUserClaims } =
    api.claim.getUserClaims.useQuery(
      { address: submittedWalletAddress },
      { enabled: !!submittedWalletAddress }
    );

  const { mutate: submitClaim, isPending: isSubmitting } =
    api.claim.submitClaim.useMutation({
      onSuccess: (newClaim) => {
        refetchItems();
        refetchUserClaims();
        setIsClaimDialogOpen(false);
        setMessage({
          type: "success",
          text: `Drawing entry submitted successfully! You have ${
            newClaim.entries
          } ${newClaim.entries === 1 ? "entry" : "entries"}.`,
        });
      },
      onError: (error) => {
        setMessage({
          type: "error",
          text: error.message || "Failed to submit entry",
        });
      },
    });

  const handleCheckWallet = () => {
    if (!walletAddress.trim()) {
      setMessage({ type: "error", text: "Please enter a wallet address" });
      return;
    }
    if (!/^G[A-Z2-7]{55}$/.test(walletAddress.trim())) {
      setMessage({
        type: "error",
        text: "Invalid Stellar wallet address format",
      });
      return;
    }
    setMessage(null);
    setSubmittedWalletAddress(walletAddress.trim());
  };

  useEffect(() => {
    if (submittedWalletAddress) {
      refetchBalance();
    }
  }, [submittedWalletAddress, refetchBalance]);

  const handleSubmitClaim = () => {
    if (!selectedItem || !walletInfo) return;

    if (!claimForm.name.trim() || !claimForm.email.trim()) {
      setMessage({ type: "error", text: "Name and email are required" });
      return;
    }
    if (selectedItem.category === "physical" && !claimForm.address.trim()) {
      setMessage({
        type: "error",
        text: "Address is required for physical items",
      });
      return;
    }

    submitClaim({
      itemId: selectedItem.id,
      walletAddress: walletInfo.address,
      userInfo: claimForm,
    });
  };

  const calculateEntries = (item: ClaimableItem): number => {
    if (!walletInfo || walletInfo.totalBalance < item.tokensRequired) return 0;
    return Math.floor(walletInfo.totalBalance / item.tokensRequired);
  };

  const canEnterDrawing = (item: ClaimableItem): boolean => {
    if (!walletInfo) return false;
    if (!item.isActive) return false;
    if (item.winnerAnnounced) return false;
    if (item.expirationDate && new Date(item.expirationDate) < new Date())
      return false;
    if (item.claimsRemaining !== null && item.claimsRemaining <= 0)
      return false;
    if (walletInfo.totalBalance < item.tokensRequired) return false;

    const alreadyEntered = userClaims?.some(
      (claim) => claim.itemId === item.id
    );
    return !alreadyEntered;
  };

  const openClaimDialog = (item: ClaimableItem) => {
    setSelectedItem(item);
    setClaimForm({ name: "", email: "", address: "", phone: "", notes: "" });
    setIsClaimDialogOpen(true);
  };

  const getItemStatusBadge = (item: ClaimableItem) => {
    const now = new Date();
    const expiration = item.expirationDate
      ? new Date(item.expirationDate)
      : null;
    const isExpired = expiration && expiration < now;

    if (item.winnerAnnounced) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-400">
          <Trophy className="h-3 w-3 mr-1" />
          Winner Announced
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge variant="outline" className="border-red-500 text-red-400">
          <Clock className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    if (!item.isActive) {
      return (
        <Badge variant="outline" className="border-red-500 text-red-400">
          Inactive
        </Badge>
      );
    }
    if (item.claimsRemaining !== null && item.claimsRemaining <= 0) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-400">
          Drawing Closed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-green-500 text-green-400">
        Drawing Open
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "digital":
        return <Star className="h-4 w-4" />;
      case "physical":
        return <Package className="h-4 w-4" />;
      case "experience":
        return <Gift className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getTimeRemaining = (expirationDate: Date | null) => {
    if (!expirationDate) return null;
    const now = new Date();
    const diff = new Date(expirationDate).getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m remaining`;
  };

  return (
    <div className="py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="font-orbitron text-4xl font-bold md:text-5xl mb-4">
          Reward Drawings
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Enter drawings for exclusive digital items, physical merchandise, and
          unique experiences. More tokens = more entries!
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              How Drawing Entries Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              • Each reward has a minimum token requirement to enter the drawing
            </p>
            <p>• You get 1 entry for every minimum token amount you hold</p>
            <p>
              • Example: If a reward requires 1,000,000 HOLLOWVOX and you have
              4,500,000 HOLLOWVOX, you get 4 entries
            </p>
            <p>
              • Winners are selected randomly from all entries when the drawing
              ends
            </p>
            <p>• More tokens = more chances to win!</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              Check Your Entry Eligibility
            </CardTitle>
            <CardDescription>
              Enter your Stellar wallet address to see how many entries you can
              get
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="font-mono text-sm"
                disabled={isCheckingWallet}
              />
              <Button
                onClick={handleCheckWallet}
                disabled={isCheckingWallet || !walletAddress.trim()}
              >
                {isCheckingWallet ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {message && (
              <Alert
                className={`${
                  message.type === "error"
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-green-500/50 bg-green-500/10"
                }`}
              >
                {message.type === "error" ? (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                <AlertDescription
                  className={
                    message.type === "error" ? "text-red-200" : "text-green-200"
                  }
                >
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {walletInfo && (
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Balance</div>
                    <div className="font-bold text-lg">
                      {walletInfo.totalBalance.toLocaleString()} HOLLOWVOX
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">
                      Drawings Entered
                    </div>
                    <div className="font-bold text-lg">
                      {userClaims?.length ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Available Reward Drawings
            </CardTitle>
            <CardDescription>
              Enter drawings for exclusive rewards - more tokens = more entries!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingItems ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : items && items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => {
                  const canEnter = canEnterDrawing(item);
                  const alreadyEntered = userClaims?.some(
                    (claim) => claim.itemId === item.id
                  );
                  const entries = calculateEntries(item);
                  const userClaim = userClaims?.find(
                    (claim) => claim.itemId === item.id
                  );
                  const timeRemaining = getTimeRemaining(item.expirationDate);

                  return (
                    <Card key={item.id} className="bg-muted/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(item.category)}
                            <h3 className="font-semibold text-lg">
                              {item.title}
                            </h3>
                          </div>
                          {getItemStatusBadge(item)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.description}
                        </p>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(item.category)}
                              <span className="text-sm capitalize text-muted-foreground">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">
                                {item.tokensRequired.toLocaleString()} HOLLOWVOX
                              </div>
                              <div className="text-xs text-muted-foreground">
                                per entry
                              </div>
                            </div>
                          </div>

                          {item.expirationDate && (
                            <div className="p-2 bg-muted/20 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Drawing ends:
                                </span>
                                <span className="font-medium">
                                  {timeRemaining}
                                </span>
                              </div>
                            </div>
                          )}

                          {walletInfo && (
                            <div className="p-2 bg-muted/20 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Your entries:
                                </span>
                                <span className="font-bold text-primary flex items-center gap-1">
                                  <Ticket className="h-3 w-3" />
                                  {entries}{" "}
                                  {entries === 1 ? "entry" : "entries"}
                                </span>
                              </div>
                              {entries > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {walletInfo.totalBalance.toLocaleString()}{" "}
                                  HOLLOWVOX ÷{" "}
                                  {item.tokensRequired.toLocaleString()} ={" "}
                                  {entries} entries
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {alreadyEntered ? (
                          <div className="space-y-2">
                            <Button disabled className="w-full">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Already Entered
                            </Button>
                            {userClaim && (
                              <div className="text-center text-xs text-muted-foreground">
                                You have {userClaim.entries}{" "}
                                {userClaim.entries === 1 ? "entry" : "entries"}{" "}
                                in this drawing
                                {userClaim.status === "approved" && (
                                  <div className="text-yellow-400 font-medium mt-1">
                                    🎉 You won this drawing!
                                  </div>
                                )}
                                {userClaim.status === "cancelled" && (
                                  <div className="text-red-400 mt-1">
                                    Not selected in this drawing
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : canEnter && entries > 0 ? (
                          <Button
                            onClick={() => openClaimDialog(item)}
                            className="w-full"
                          >
                            <Ticket className="h-4 w-4 mr-2" />
                            Enter Drawing ({entries}{" "}
                            {entries === 1 ? "entry" : "entries"})
                          </Button>
                        ) : (
                          <Button disabled className="w-full">
                            {!walletInfo
                              ? "Check Wallet First"
                              : !item.isActive
                              ? "Drawing Closed"
                              : item.winnerAnnounced
                              ? "Winner Announced"
                              : item.expirationDate &&
                                new Date(item.expirationDate) < new Date()
                              ? "Drawing Expired"
                              : "Insufficient Tokens"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-orbitron text-xl font-bold mb-2">
                  No Drawings Available
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Reward drawings are being prepared. Check back soon!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {userClaims && userClaims.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl">
                Your Drawing Entries
              </CardTitle>
              <CardDescription>
                Track your entries and drawing results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userClaims.map((claim) => {
                  const item = items?.find((i) => i.id === claim.itemId);
                  if (!item) return null;

                  return (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between p-4 bg-muted/20 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted/20 rounded-lg flex items-center justify-center">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Entered on{" "}
                            {new Date(claim.claimedAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-primary flex items-center gap-1">
                            <Ticket className="h-3 w-3" />
                            {claim.entries}{" "}
                            {claim.entries === 1 ? "entry" : "entries"} in
                            drawing
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          claim.status === "approved"
                            ? "border-yellow-500 text-yellow-400"
                            : claim.status === "cancelled"
                            ? "border-red-500 text-red-400"
                            : "border-gray-500 text-gray-400"
                        }
                      >
                        {claim.status === "pending"
                          ? "Drawing Pending"
                          : claim.status === "approved"
                          ? "Winner!"
                          : "Not Selected"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-orbitron">
              Enter Drawing: {selectedItem?.title}
            </DialogTitle>
            <DialogDescription>
              Fill in your information to enter the drawing. You will get{" "}
              {selectedItem ? calculateEntries(selectedItem) : 0}{" "}
              {selectedItem && calculateEntries(selectedItem) === 1
                ? "entry"
                : "entries"}{" "}
              based on your {walletInfo?.totalBalance.toLocaleString()}{" "}
              HOLLOWVOX balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={claimForm.name}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, name: e.target.value })
                  }
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={claimForm.email}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
              </div>
            </div>
            {selectedItem?.category === "physical" && (
              <div className="space-y-2">
                <Label htmlFor="address">Shipping Address *</Label>
                <Textarea
                  id="address"
                  value={claimForm.address}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, address: e.target.value })
                  }
                  placeholder="Full shipping address"
                  rows={3}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={claimForm.phone}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={claimForm.notes}
                onChange={(e) =>
                  setClaimForm({ ...claimForm, notes: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsClaimDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitClaim}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Ticket className="h-4 w-4 mr-2" />
                )}
                Enter Drawing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
