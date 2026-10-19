import { ArrowLeft, Edit, Package } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Badge, Button, Card } from "../components/common";
import { useProduct } from "../hooks/useCatalog";

function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id ? Number(id) : undefined;
  const { data: productResponse, isLoading } = useProduct(productId);
  const product = productResponse?.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-(--sp-text-muted) hover:text-(--sp-text)"
        >
          <ArrowLeft className="size-4" /> Quay lại danh sách
        </Link>
        {product && (
          <Link to={`/products/${product.id}/edit`}>
            <Button variant="primary" size="sm">
              <Edit className="mr-1.5 size-4" /> Chỉnh sửa
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="animate-pulse bg-gray-200 h-40 w-full rounded" />
          <div className="animate-pulse bg-gray-200 h-40 w-full rounded" />
        </div>
        ) : !product ? (
          <Card className="p-8 text-center border-(--sp-border)">
            <Package className="mx-auto size-12 text-(--sp-text-muted)/50" />
            <p className="mt-3 text-sm text-(--sp-text-muted)">Không tìm thấy sản phẩm.</p>
          </Card>
        ) : (
          <>
            <Card className="p-6 border-(--sp-border)">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-(--sp-text)">{product.name}</h1>
                  <p className="mt-1 font-mono text-sm text-(--sp-text-muted)">
                    Mã: {product.code}
                  </p>
                </div>
                <Badge tone={product.isActive ? "success" : "neutral"}>
                  {product.isActive ? "Đang kinh doanh" : "Tạm dừng"}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-(--sp-text-muted)">Danh mục</p>
                  <p className="mt-1 text-sm text-(--sp-text)">
                    {product.category?.name || "Chưa phân loại"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-(--sp-text-muted)">Số biến thể</p>
                  <p className="mt-1 text-sm text-(--sp-text)">
                    {product.stockItems?.length || 0}
                  </p>
                </div>
                {product.description && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-(--sp-text-muted)">Mô tả</p>
                    <p className="mt-1 text-sm text-(--sp-text)">{product.description}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="border-(--sp-border)">
              <div className="border-b border-(--sp-border) p-4">
                <h2 className="text-base font-semibold text-(--sp-text)">
                  Danh sách biến thể (SKU)
                </h2>
              </div>
              {!product.stockItems || product.stockItems.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-(--sp-text-muted)">Chưa có biến thể nào.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-(--sp-border) bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted)">
                      <tr>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Tên biến thể</th>
                        <th className="px-4 py-3 text-right">Giá vốn</th>
                        <th className="px-4 py-3 text-right">Giá bán</th>
                        <th className="px-4 py-3 text-right">Tồn min/max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--sp-border)">
                      {product.stockItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-mono text-(--sp-text)">{item.sku}</td>
                          <td className="px-4 py-3 text-(--sp-text)">{item.name}</td>
                          <td className="px-4 py-3 text-right text-(--sp-text-muted)">
                            {formatCurrency(item.costPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-(--sp-text)">
                            {formatCurrency(item.sellingPrice)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-(--sp-text-muted)">
                            {item.minStockLevel} / {item.maxStockLevel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
  );
}