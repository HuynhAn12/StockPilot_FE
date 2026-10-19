import { useState } from "react";
import { CheckCircle2, Edit, Layers, Plus, Search, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Badge, Button, Card, Input } from "../components/common";
import { useCategories, useDeleteCategory } from "../hooks/useCatalog";

export function CategoriesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: categoriesData, isLoading, refetch } = useCategories({ limit: 100 });
  const deleteMutation = useDeleteCategory();

  const categories = categoriesData?.items || [];
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = categories.filter((c) => c.isActive).length;

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert("Không thể xóa. Có thể danh mục đang được sản phẩm sử dụng.");
    }
  };

  return (
    <div className="grid gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">
              Quản lý danh mục
            </h1>
          </div>
          <Link to="/categories/new">
            <Button variant="primary">
              <Plus className="mr-1.5 size-4" /> Thêm danh mục
            </Button>
          </Link>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-purple-50 text-purple-600">
                <Layers className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Tổng danh mục</p>
                <p className="text-xl font-bold text-(--sp-text)">{categories.length}</p>
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
        </div>

        {/* Search */}
        <div className="w-full max-w-xs relative">
          <Search className="absolute left-3 top-2.5 size-4 text-(--sp-text-muted)" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm danh mục..."
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card className="overflow-hidden border-(--sp-border)">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <div className="animate-pulse bg-gray-200 h-6 w-1/3 rounded" />
              <div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
              <div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="mx-auto size-12 text-(--sp-text-muted)/50" />
              <h3 className="mt-3 text-base font-semibold text-(--sp-text)">
                Chưa có danh mục nào
              </h3>
              <p className="mt-1 text-sm text-(--sp-text-muted)">
                Bấm "Thêm danh mục" để tạo danh mục đầu tiên.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--sp-border) bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted)">
                  <tr>
                    <th className="px-4 py-3">Mã</th>
                    <th className="px-4 py-3">Tên danh mục</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3 text-right">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--sp-border)">
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-(--sp-bg-subtle)/50 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-mono font-medium text-(--sp-text)">
                        {c.code}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-(--sp-text)">{c.name}</td>
                      <td className="px-4 py-3.5 text-xs text-(--sp-text-muted) max-w-xs truncate">
                        {c.description || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Badge tone={c.isActive ? "success" : "neutral"}>
                          {c.isActive ? "Đang hoạt động" : "Tạm dừng"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/categories/${c.id}/edit`)}
                            className="grid size-8 place-items-center rounded-md text-(--sp-text-muted) hover:bg-(--sp-bg-subtle) hover:text-(--sp-primary)"
                            title="Chỉnh sửa"
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id, c.name)}
                            disabled={deleteMutation.isPending}
                            className="grid size-8 place-items-center rounded-md text-(--sp-text-muted) hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Xóa"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
  );
}