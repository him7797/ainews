const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export type ArticleSource = {
  id: string;
  name: string;
};

export type Article = {
  id: string;
  title: string;
  url: string;
  publishedAt: string | null;
  summary: string;
  source: ArticleSource;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

export type FeedMeta = {
  degraded: boolean;
  failedSources: string[];
  cachedAt: string | null;
  lastAttemptAt: string | null;
  staleData: boolean;
};

export type ArticlePage = {
  articles: Article[];
  pagination: Pagination;
  meta: FeedMeta;
};

export async function fetchArticles(
  page = 1,
  pageSize = 20
): Promise<ArticlePage> {
  const url = `${API_BASE_URL}/articles?page=${page}&pageSize=${pageSize}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Feed service error: HTTP ${response.status}`);
  }
  return response.json() as Promise<ArticlePage>;
}
