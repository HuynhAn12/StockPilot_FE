import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";


import { ProductForm } from "../components/ProductForm";
import {
  useCategories,
  useProduct,
  useUpdateProduct,
} from "../hooks/useCatalog";
import type { UpdateProductPayload } from "../types";

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id ? Number(id) : undefined;
  const navigate = useNavigate();

  const { data: productResponse, isLoading } = useProduct(productId);
  const { data: categoriesData } = useCategories({ limit: 100 });
  const updateMutation = useUpdateProduct();

  const product = productResponse?.data;
  const categories = categoriesData?.items || [];

  const handleSubmit = async (values: unknown) => {
    if (!productId) return;
    await updateMutation.mutateAsync({
      id: productId,
      body: values as UpdateProductPayload,
    });
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
        <h1 className="text-2xl font-bold text-(--sp-text)">Chỉnh sửa sản phẩm</h1>
        <p className="mt-1 text-sm text-(--sp-text-muted)">
          Cập nhật thông tin cơ bản của sản phẩm. Biến thể (SKU) quản lý ở trang riêng.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse bg-gray-200 h-32 w-full rounded" />
          <div className="animate-pulse bg-gray-200 h-32 w-full rounded" />
        </div>
      ) : !product ? (
        <div className="rounded-lg border border-(--sp-border) bg-(--sp-surface) p-8 text-center">
          <p className="text-sm text-(--sp-text-muted)">Không tìm thấy sản phẩm.</p>
        </div>
      ) : (
        <ProductForm
          mode="edit"
          product={product}
          categories={categories}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      )}
    </div>
  );
}