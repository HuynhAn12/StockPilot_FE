import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ProductForm } from "../components/ProductForm";
import {
  useCategories,
  useCreateProduct,
} from "../hooks/useCatalog";
import type { CreateProductPayload } from "../types";

export function ProductCreatePage() {
  const navigate = useNavigate();
  const { data: categoriesData } = useCategories({ limit: 100 });
  const createMutation = useCreateProduct();

  const categories = categoriesData?.items || [];

  const handleSubmit = async (values: unknown) => {
    await createMutation.mutateAsync(values as CreateProductPayload);
    navigate("/products");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="size-4" /> Quay lại
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--sp-text)">Thêm sản phẩm mới</h1>
        <p className="mt-1 text-sm text-(--sp-text-muted)">
          Điền thông tin sản phẩm và khai báo ít nhất 1 biến thể (SKU).
        </p>
      </div>

      <ProductForm
        mode="create"
        categories={categories}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}