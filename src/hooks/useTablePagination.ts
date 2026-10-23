import { useEffect, useState } from "react";

/**
 * Page state for client-side paginated tables.
 *
 * Stays on the current page when rows are edited or refetched (only stepping back if the page
 * no longer exists, e.g. after deleting its last row), and returns to the first page when
 * `resetKey` changes — pass the active search/filter values as the key.
 */
export function useTablePagination(rowCount: number, pageSize: number, resetKey = "") {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  useEffect(() => {
    setPagination((current) => (current.pageIndex === 0 ? current : { ...current, pageIndex: 0 }));
  }, [resetKey]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(rowCount / pageSize) - 1);
    setPagination((current) => (current.pageIndex > lastPage ? { ...current, pageIndex: lastPage } : current));
  }, [rowCount, pageSize]);

  return [pagination, setPagination] as const;
}
