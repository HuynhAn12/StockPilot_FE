import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";


import { CategoryForm } from "../components/CategoryForm";
import { useCategory, useUpdateCategory } from "../hooks/useCatalog";
import type { UpdateCategoryPayload } from "../types";

export function CategoryEditPage() {
  const { id } = useParams<{ id: string }>();
  const categoryId = id ? Number(id) : undefined;
  const navigate = useNavigate();

  const { data: categoryResponse, isLoading } = useCategory(categoryId);
  const updateMutation = useUpdateCategory();

  const category = categoryResponse?.data;

  const handleSubmit = async (values: unknown) => {
    if (!categoryId) return;
    await updateMutation.mutateAsync({
      id: categoryId,
      body: values as UpdateCategoryPayload,
    });
    navigate("/categories");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link
          to="/categories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="size-4" /> Quay lại
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--sp-text)">Chỉnh sửa danh mục</h1>
        <p className="mt-1 text-sm text-(--sp-text-muted)">
          Cập nhật thông tin danh mục.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse bg-gray-200 h-32 w-full rounded" />
        </div>
      ) : !category ? (
        <div className="rounded-lg border border-(--sp-border) bg-(--sp-surface) p-8 text-center">
          <p className="text-sm text-(--sp-text-muted)">Không tìm thấy danh mục.</p>
        </div>
      ) : (
        <CategoryForm
          mode="edit"
          category={category}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      )}
    </div>
  );
}