import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { CategoryForm } from "../components/CategoryForm";
import { useCreateCategory } from "../hooks/useCatalog";
import type { CreateCategoryPayload } from "../types";

export function CategoryCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateCategory();

  const handleSubmit = async (values: unknown) => {
    await createMutation.mutateAsync(values as CreateCategoryPayload);
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
        <h1 className="text-2xl font-bold text-(--sp-text)">Thêm danh mục mới</h1>
        <p className="mt-1 text-sm text-(--sp-text-muted)">
          Tạo danh mục để phân loại sản phẩm.
        </p>
      </div>

      <CategoryForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}