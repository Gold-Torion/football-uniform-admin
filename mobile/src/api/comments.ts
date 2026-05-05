import { api } from './client';

export interface CommentPublic {
  commentId:   string;
  listingId:   string;
  authorId:    string;
  authorName:  string;
  body:        string;
  status:      'ACTIVE' | 'REMOVED';
  reportCount: number;
  createdAt:   string;
}

export const CommentsApi = {
  list: (listingId: string) =>
    api.get<CommentPublic[]>(`/listings/${listingId}/comments`).then((r) => r.data),
  create: (listingId: string, body: string) =>
    api.post<CommentPublic>(`/listings/${listingId}/comments`, { body }).then((r) => r.data),
  report: (listingId: string, commentId: string, reason: string) =>
    api.post(`/listings/${listingId}/comments/${commentId}/report`, { reason }),
};
