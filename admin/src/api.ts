const BASE = (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3000';

function headers(secret: string): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-admin-secret': secret };
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface Stats {
  totalUsers: number;
  activeListings: number;
  totalOrders: number;
  pendingReports: number;
}

export interface UserPublic {
  userId: string;
  displayName: string;
  email?: string;
  phoneE164?: string;
  cpf?: string;
  listingsActiveCount: number;
  ratingCountAsSeller: number;
  ratingAvgAsSeller?: number;
  mpcPurchasesCount: number;
  totpEnabled: boolean;
  status: string;
  createdAt: string;
}

export interface ListingPublic {
  listingId: string;
  sellerId: string;
  sellerName: string;
  teamName: string;
  supplier: string;
  season: string;
  size: string;
  condition: string;
  priceCents: number;
  isMpc: boolean;
  status: string;
  createdAt: string;
}

export interface ReportWithComment {
  reportId: string;
  listingId: string;
  commentId: string;
  reporterId: string;
  reason: string;
  createdAt: string;
  comment: {
    authorId: string;
    authorName: string;
    body: string;
    reportCount: number;
    createdAt: string;
  } | null;
}

export interface OrderPublic {
  orderId: string;
  buyerName: string;
  sellerName: string;
  teamName: string;
  totalCents: number;
  deliveryMethod: string;
  status: string;
  createdAt: string;
}

// ── API client ─────────────────────────────────────────────────────────────

export const api = {
  getStats:      (s: string) =>
    fetch(`${BASE}/admin/stats`, { headers: headers(s) }).then(r => r.json()) as Promise<Stats>,

  getUsers:      (s: string) =>
    fetch(`${BASE}/admin/users`, { headers: headers(s) }).then(r => r.json()) as Promise<UserPublic[]>,

  suspendUser:   (s: string, id: string) =>
    fetch(`${BASE}/admin/users/${id}/suspend`, { method: 'PATCH', headers: headers(s) }),

  restoreUser:   (s: string, id: string) =>
    fetch(`${BASE}/admin/users/${id}/restore`, { method: 'PATCH', headers: headers(s) }),

  getListings:   (s: string) =>
    fetch(`${BASE}/admin/listings`, { headers: headers(s) }).then(r => r.json()) as Promise<ListingPublic[]>,

  removeListing: (s: string, id: string) =>
    fetch(`${BASE}/admin/listings/${id}/remove`, { method: 'PATCH', headers: headers(s) }),

  getReports:    (s: string) =>
    fetch(`${BASE}/admin/reports`, { headers: headers(s) }).then(r => r.json()) as Promise<ReportWithComment[]>,

  resolveReport: (s: string, id: string) =>
    fetch(`${BASE}/admin/reports/${id}/resolve`, { method: 'PATCH', headers: headers(s) }),

  dismissReport: (s: string, id: string) =>
    fetch(`${BASE}/admin/reports/${id}/dismiss`, { method: 'PATCH', headers: headers(s) }),

  getOrders:     (s: string) =>
    fetch(`${BASE}/admin/orders`, { headers: headers(s) }).then(r => r.json()) as Promise<OrderPublic[]>,
};
