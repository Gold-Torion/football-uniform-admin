import { api } from './client';
import type { ListingPublic } from './listings';

export interface SearchResult {
  hits: ListingPublic[];
  nbHits: number;
  page: number;
  nbPages: number;
}

export interface AlgoliaCredentials {
  appId: string;
  searchApiKey: string;
  indexName: string;
}

export const SearchApi = {
  search: (
    q: string,
    filters?: string,
    page = 0,
    hitsPerPage = 40,
  ): Promise<SearchResult> => {
    const params = new URLSearchParams({
      q,
      page: String(page),
      hitsPerPage: String(hitsPerPage),
    });
    if (filters) params.set('filters', filters);
    return api
      .get<SearchResult>(`/search/listings?${params.toString()}`)
      .then((r) => r.data);
  },

  getCredentials: (): Promise<AlgoliaCredentials> =>
    api.get<AlgoliaCredentials>('/search/credentials').then((r) => r.data),
};
