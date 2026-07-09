import { api } from './client';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface UserPublic {
  userId: string;
  displayName: string;
  email?: string;
  phoneE164?: string;
  listingsActiveCount: number;
  ratingAvgAsSeller?: number;
  ratingCountAsSeller: number;
  status: UserStatus;
  createdAt: string;
}

export interface ReportWithComment {
  reportId:   string;
  listingId:  string;
  commentId:  string;
  reporterId: string;
  reason:     string;
  createdAt:  string;
  comment: {
    authorId:    string;
    authorName:  string;
    body:        string;
    reportCount: number;
    createdAt:   string;
  } | null;
}

function headers(secret: string) {
  return { 'x-admin-secret': secret };
}

export const AdminApi = {
  listReports: (secret: string) =>
    api.get<ReportWithComment[]>('/admin/reports', { headers: headers(secret) }).then((r: { data: ReportWithComment[] }) => r.data),

  resolve: (secret: string, reportId: string) =>
    api.patch(`/admin/reports/${reportId}/resolve`, {}, { headers: headers(secret) }),

  dismiss: (secret: string, reportId: string) =>
    api.patch(`/admin/reports/${reportId}/dismiss`, {}, { headers: headers(secret) }),

  listUsers: (secret: string) =>
    api.get<UserPublic[]>('/admin/users', { headers: headers(secret) }).then((r: { data: UserPublic[] }) => r.data),

  suspendUser: (secret: string, userId: string) =>
    api.patch(`/admin/users/${userId}/suspend`, {}, { headers: headers(secret) }),

  restoreUser: (secret: string, userId: string) =>
    api.patch(`/admin/users/${userId}/restore`, {}, { headers: headers(secret) }),
};
