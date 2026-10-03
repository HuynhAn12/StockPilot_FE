import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button, IconButton } from "../ui/Button";

export function Pagination({
  currentPage = 1,
  totalItems = 128,
  pageSize = 10,
  onPageChange,
}: {
  currentPage?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}) {
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-(--sp-text-muted)">
        {totalItems > 0 ? `${startItem}-${endItem} trong ${totalItems} mục` : "Không có mục nào"}
      </p>
      <div className="flex items-center gap-2">
        <IconButton
          label="Trang trước"
          variant="secondary"
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
        >
          <ChevronLeft className="size-4" />
        </IconButton>
        <Button variant="secondary">{`Trang ${currentPage}`}</Button>
        <IconButton
          label="Trang sau"
          variant="secondary"
          disabled={endItem >= totalItems}
          onClick={() => onPageChange?.(currentPage + 1)}
        >
          <ChevronRight className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}
