import type { Metadata } from 'next';

export type BoardListSearchParams = {
  page?: string;
  from?: string;
  store?: string;
  search?: string;
  searchType?: string;
  period?: string;
};

export function getBoardListMetadataState(
  basePath: string,
  searchParams?: BoardListSearchParams | null
): { path: string; robots?: Metadata['robots'] } {
  const pageParam = searchParams?.page;
  const parsedPage = pageParam ? Number(pageParam) : 1;
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 1 ? parsedPage : 1;
  const hasFilterParams = Boolean(
    searchParams?.from ||
    searchParams?.store ||
    searchParams?.search ||
    searchParams?.searchType ||
    searchParams?.period
  );
  const shouldNoindex = currentPage > 1 || hasFilterParams;

  return {
    path: currentPage > 1 && !hasFilterParams ? `${basePath}?page=${currentPage}` : basePath,
    ...(shouldNoindex && { robots: { index: false, follow: true } }),
  };
}
