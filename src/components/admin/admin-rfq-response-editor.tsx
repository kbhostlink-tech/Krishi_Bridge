"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Save, X } from "lucide-react";
import { useCurrency } from "@/lib/use-currency";

const COUNTRY_LABELS: Record<string, string> = {
  IN: "India", NP: "Nepal", BT: "Bhutan", AE: "UAE", SA: "Saudi Arabia", OM: "Oman",
};

const RESPONSE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
  WITHDRAWN: "bg-gray-100 text-gray-500",
  COUNTERED: "bg-blue-50 text-blue-700",
};

const CURRENCIES = ["INR", "NPR", "BTN", "AED", "SAR", "OMR", "USD"] as const;

export type AdminRfqResponseData = {
  id: string;
  sellerId: string;
  seller: { id: string; name: string; country: string };
  offeredPriceInr: number;
  currency: string;
  deliveryDays: number;
  notes: string | null;
  status: string;
  adminForwarded: boolean;
  adminEditedPriceInr: number | null;
  createdAt: string;
  negotiations: {
    id: string;
    fromUser: { id: string; name: string; role: string };
    message: string;
    proposedPriceInr: number | null;
    proposedQuantityKg: number | null;
    createdAt: string;
  }[];
};

type AdminRfqResponseEditorProps = {
  rfqId: string;
  buyerId: string;
  response: AdminRfqResponseData;
  isSelectedResponse: boolean;
  accessToken: string | null;
  onUpdated: (response: AdminRfqResponseData) => void;
  onSetTerms?: () => void;
  showSetTerms?: boolean;
  forwardSection?: React.ReactNode;
};

export function AdminRfqResponseEditor({
  rfqId,
  buyerId,
  response,
  isSelectedResponse,
  accessToken,
  onUpdated,
  onSetTerms,
  showSetTerms,
  forwardSection,
}: AdminRfqResponseEditorProps) {
  const { display } = useCurrency();
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [isSavingResponse, setIsSavingResponse] = useState(false);
  const [editOfferedPrice, setEditOfferedPrice] = useState(String(response.offeredPriceInr));
  const [editBuyerPrice, setEditBuyerPrice] = useState(
    response.adminEditedPriceInr != null ? String(response.adminEditedPriceInr) : ""
  );
  const [editCurrency, setEditCurrency] = useState(response.currency);
  const [editDeliveryDays, setEditDeliveryDays] = useState(String(response.deliveryDays));
  const [editNotes, setEditNotes] = useState(response.notes || "");

  const [editingNegotiationId, setEditingNegotiationId] = useState<string | null>(null);
  const [isSavingNegotiation, setIsSavingNegotiation] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editProposedPrice, setEditProposedPrice] = useState("");
  const [editProposedQty, setEditProposedQty] = useState("");

  const resetResponseForm = () => {
    setEditOfferedPrice(String(response.offeredPriceInr));
    setEditBuyerPrice(response.adminEditedPriceInr != null ? String(response.adminEditedPriceInr) : "");
    setEditCurrency(response.currency);
    setEditDeliveryDays(String(response.deliveryDays));
    setEditNotes(response.notes || "");
  };

  const startEditResponse = () => {
    resetResponseForm();
    setIsEditingResponse(true);
  };

  const startEditNegotiation = (negotiation: AdminRfqResponseData["negotiations"][number]) => {
    setEditingNegotiationId(negotiation.id);
    setEditMessage(negotiation.message);
    setEditProposedPrice(
      negotiation.proposedPriceInr != null ? String(negotiation.proposedPriceInr) : ""
    );
    setEditProposedQty(
      negotiation.proposedQuantityKg != null ? String(negotiation.proposedQuantityKg) : ""
    );
  };

  const saveResponse = async () => {
    if (!accessToken) return;
    setIsSavingResponse(true);
    try {
      const payload: Record<string, unknown> = {
        offeredPriceInr: Number(editOfferedPrice),
        currency: editCurrency,
        deliveryDays: Number(editDeliveryDays),
        notes: editNotes.trim() || null,
      };
      if (editBuyerPrice.trim()) {
        payload.adminEditedPriceInr = Number(editBuyerPrice);
      } else {
        payload.adminEditedPriceInr = null;
      }

      const res = await fetch(`/api/admin/rfq/${rfqId}/responses/${response.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update response");

      onUpdated(data.response);
      setIsEditingResponse(false);
      toast.success("Response updated — both parties will see the changes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update response");
    } finally {
      setIsSavingResponse(false);
    }
  };

  const saveNegotiation = async (negotiationId: string) => {
    if (!accessToken) return;
    setIsSavingNegotiation(true);
    try {
      const res = await fetch(
        `/api/admin/rfq/${rfqId}/responses/${response.id}/negotiations/${negotiationId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: editMessage.trim(),
            proposedPriceInr: editProposedPrice.trim() ? Number(editProposedPrice) : null,
            proposedQuantityKg: editProposedQty.trim() ? Number(editProposedQty) : null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update message");

      onUpdated({
        ...response,
        negotiations: response.negotiations.map((n) =>
          n.id === negotiationId ? { ...n, ...data.negotiation } : n
        ),
      });
      setEditingNegotiationId(null);
      toast.success("Message updated — the other party will see the changes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update message");
    } finally {
      setIsSavingNegotiation(false);
    }
  };

  const sideLabel = (userId: string, role: string) => {
    if (userId === buyerId) return "Buyer";
    if (role === "FARMER" || role === "AGGREGATOR") return "Seller";
    return role;
  };

  return (
    <Card className={`rounded-xl ${isSelectedResponse ? "ring-2 ring-purple-300" : ""}`}>
      <CardContent className="py-3 px-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm font-medium text-sage-900">
              {response.seller.name}
              {isSelectedResponse && (
                <span className="ml-2 text-purple-600 text-xs">⭐ Buyer Selected</span>
              )}
            </p>
            <p className="text-xs text-sage-500">{COUNTRY_LABELS[response.seller.country]}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={RESPONSE_STATUS_COLORS[response.status]}>{response.status}</Badge>
            {!isEditingResponse && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 rounded-lg text-xs"
                onClick={startEditResponse}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {isEditingResponse ? (
          <div className="mt-3 space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
            <p className="text-xs font-medium text-indigo-800">Edit seller response (visible to both parties)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Offered price (₹/kg)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editOfferedPrice}
                  onChange={(e) => setEditOfferedPrice(e.target.value)}
                  className="mt-1 h-8 text-xs rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs">Buyer-facing price override (optional)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editBuyerPrice}
                  onChange={(e) => setEditBuyerPrice(e.target.value)}
                  placeholder="Uses offered price if empty"
                  className="mt-1 h-8 text-xs rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs">Delivery days</Label>
                <Input
                  type="number"
                  min="1"
                  value={editDeliveryDays}
                  onChange={(e) => setEditDeliveryDays(e.target.value)}
                  className="mt-1 h-8 text-xs rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <Select value={editCurrency} onValueChange={(value) => value && setEditCurrency(value)}>
                  <SelectTrigger className="mt-1 h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Message / notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="mt-1 min-h-[80px] text-xs rounded-lg"
                maxLength={2000}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-8 rounded-lg text-xs bg-indigo-700 hover:bg-indigo-800"
                disabled={isSavingResponse}
                onClick={saveResponse}
              >
                <Save className="h-3 w-3 mr-1" />
                {isSavingResponse ? "Saving..." : "Save response"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs"
                onClick={() => {
                  setIsEditingResponse(false);
                  resetResponseForm();
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-sage-500">Offered Price</p>
                <p className="text-sage-900 font-bold">{display(Number(response.offeredPriceInr))}</p>
              </div>
              <div>
                <p className="text-sage-500">Buyer sees</p>
                <p className="text-sage-900 font-bold">
                  {display(Number(response.adminEditedPriceInr ?? response.offeredPriceInr))}
                </p>
              </div>
              <div>
                <p className="text-sage-500">Delivery</p>
                <p className="text-sage-900 font-bold">{response.deliveryDays} days</p>
              </div>
            </div>
            <p className="text-[10px] text-sage-500 mt-1">Currency: {response.currency}</p>
            {response.notes && (
              <p className="text-xs text-sage-600 mt-2 bg-sage-50 rounded p-2">{response.notes}</p>
            )}
          </>
        )}

        {showSetTerms && onSetTerms && (
          <div className="mt-2">
            <Button
              size="sm"
              className="text-xs bg-purple-700 hover:bg-purple-800 rounded-lg"
              onClick={onSetTerms}
            >
              Set Final Terms for This Response
            </Button>
          </div>
        )}

        {forwardSection}

        {(response.negotiations?.length ?? 0) > 0 && (
          <div className="mt-4 border-t border-sage-100 pt-3">
            <p className="text-xs font-medium text-sage-700 mb-2">
              Negotiation thread ({response.negotiations.length})
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {response.negotiations.map((n) => {
                const isEditing = editingNegotiationId === n.id;
                const authorSide = sideLabel(n.fromUser.id, n.fromUser.role);

                return (
                  <div key={n.id} className="rounded-lg border border-sage-100 bg-white p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] font-medium text-sage-600">
                        {authorSide} · {n.fromUser.name} ·{" "}
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                      {!isEditing && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => startEditNegotiation(n)}
                        >
                          <Pencil className="h-3 w-3 mr-0.5" />
                          Edit
                        </Button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          className="min-h-[70px] text-xs rounded-lg"
                          maxLength={2000}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Proposed price (₹/kg)"
                            value={editProposedPrice}
                            onChange={(e) => setEditProposedPrice(e.target.value)}
                            className="h-8 text-xs rounded-lg"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Proposed quantity (kg)"
                            value={editProposedQty}
                            onChange={(e) => setEditProposedQty(e.target.value)}
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs rounded-lg"
                            disabled={isSavingNegotiation}
                            onClick={() => saveNegotiation(n.id)}
                          >
                            {isSavingNegotiation ? "Saving..." : "Save message"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs rounded-lg"
                            onClick={() => setEditingNegotiationId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-sage-800 whitespace-pre-wrap">{n.message}</p>
                        <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-sage-500">
                          {n.proposedPriceInr != null && (
                            <span>Price: {display(Number(n.proposedPriceInr))}/kg</span>
                          )}
                          {n.proposedQuantityKg != null && (
                            <span>Qty: {Number(n.proposedQuantityKg)} kg</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
