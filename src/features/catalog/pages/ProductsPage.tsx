import { useState } from "react";
import { CheckCircle2, Layers, Package, Search } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useCategories, useProducts } from "../hooks/useCatalog";

export function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  const { data: productsData, isLoading, refetch } = useProducts({
    search: searchTerm || undefined,
    categoryId: selectedCategoryId,
  });
  const { data: categoriesData } = useCategories();

  const products = productsData?.items || [];
  const categories = categoriesData?.items || [];

  const activeCount = products.filter((p) => p.isActive).length;

  return (
    <OwnerLayout title="Danh mục sản phẩm" onRefresh={() => refetch()}>
      <div className="grid gap-6">
        {/* Header Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">Quản lý sản phẩm</h1>
            <p className="mt-1 text-sm text-(--sp-text-muted)">
              Xem và quản lý danh mục, thông tin sản phẩm và phân loại hàng hóa từ Backend API.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Package className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Tổng số sản phẩm</p>
                <p className="text-xl font-bold text-(--sp-text)">{products.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Đang hoạt động</p>
                <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-purple-50 text-purple-600">
                <Layers className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Danh mục hàng</p>
                <p className="text-xl font-bold text-purple-700">{categories.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full max-w-xs relative">
            <Search className="absolute left-3 top-2.5 size-4 text-(--sp-text-muted)" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(undefined)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategoryId === undefined
                  ? "bg-(--sp-primary) text-white shadow-xs"
                  : "bg-(--sp-bg-subtle) text-(--sp-text-muted) hover:text-(--sp-text)"
              }`}
            >
              Tất cả danh mục
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryId(c.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategoryId === c.id
                    ? "bg-(--sp-primary) text-white shadow-xs"
                    : "bg-(--sp-bg-subtle) text-(--sp-text-muted) hover:text-(--sp-text)"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <Card className="overflow-hidden border-(--sp-border)">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto size-12 text-(--sp-text-muted)/50" />
              <h3 className="mt-3 text-base font-semibold text-(--sp-text)">Không tìm thấy sản phẩm nào</h3>
              <p className="mt-1 text-sm text-(--sp-text-muted)">
                Chưa có sản phẩm nào phù hợp với bộ lọc tìm kiếm hiện tại.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--sp-border) bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted)">
                  <tr>
                    <th className="px-4 py-3">Mã sản phẩm</th>
                    <th className="px-4 py-3">Tên sản phẩm</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--sp-border)">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-(--sp-bg-subtle)/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-medium text-(--sp-text)">{p.code}</td>
                      <td className="px-4 py-3.5 font-medium text-(--sp-text)">{p.name}</td>
                      <td className="px-4 py-3.5 text-xs text-(--sp-text-muted)">
                        {p.category?.name || "Chưa phân loại"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-(--sp-text-muted) max-w-xs truncate">
                        {p.description || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Badge tone={p.isActive ? "success" : "neutral"}>
                          {p.isActive ? "Đang kinh doanh" : "Tạm dừng"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </OwnerLayout>
  );
}
