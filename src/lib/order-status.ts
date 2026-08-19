import type { OrderStatus } from "@/lib/database.types";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: "neutral" | "warn" | "good" | "critical" | "accent"; description: string }
> = {
  pending_approval: {
    label: "Pending Approval",
    tone: "neutral",
    description: "Waiting for a manager or owner to review this order.",
  },
  for_payment: {
    label: "For Payment",
    tone: "accent",
    description: "Approved — awaiting customer payment.",
  },
  paid: {
    label: "Paid",
    tone: "accent",
    description: "Payment submitted, awaiting verification.",
  },
  for_fulfillment: {
    label: "For Fulfillment",
    tone: "accent",
    description: "Payment verified — preparing items for delivery.",
  },
  for_delivery: {
    label: "For Delivery",
    tone: "accent",
    description: "Items prepared and inventory deducted — awaiting delivery scheduling.",
  },
  in_transit: {
    label: "In Transit",
    tone: "accent",
    description: "Handed off to third-party delivery.",
  },
  for_confirmation: {
    label: "For Confirmation",
    tone: "warn",
    description: "Delivered — awaiting customer confirmation (auto-completes after 3 days).",
  },
  completed: {
    label: "Completed",
    tone: "good",
    description: "Order received and closed.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "critical",
    description: "Order was cancelled.",
  },
  rejected: {
    label: "Rejected",
    tone: "critical",
    description: "Order was rejected during review.",
  },
};

export const ORDER_WORKFLOW: OrderStatus[] = [
  "pending_approval",
  "for_payment",
  "paid",
  "for_fulfillment",
  "for_delivery",
  "in_transit",
  "for_confirmation",
  "completed",
];
