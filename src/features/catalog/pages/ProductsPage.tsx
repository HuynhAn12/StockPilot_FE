import { DataTable } from "../../../components/data-display/DataTable";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useProducts } from "../hooks/useCatalog";

export function ProductsPage() {
  const { data, isLoading } = useProducts();
  const products = data?.items || [];

  return (
    <OwnerLayout title="Danh mục sản phẩm">
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-(--sp-text)">Quản lý sản phẩm</h1>
          <p className="mt-1 text-sm text-(--sp-text-muted)">
            Xem và cập nhật danh mục, thông tin sản phẩm và phân loại hàng hóa.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-(--sp-text-muted)">Đang tải dữ liệu...</p>
        ) : (
          <DataTable
            columns={["Mã sản phẩm", "Tên sản phẩm", "Trạng thái"]}
            rows={products.map((p) => [p.code, p.name, p.isActive ? "Hoạt động" : "Tạm ẩn"])}
          />
        )}
      </div>
    </OwnerLayout>
  );
}
