import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";

import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  ChartCard,
  Checkbox,
  Combobox,
  ConfirmDialog,
  DataTable,
  Drawer,
  EmptyState,
  ErrorState,
  FormField,
  IconButton,
  Input,
  LoadingButton,
  MetricCard,
  Modal,
  Pagination,
  PasswordInput,
  RadioGroup,
  RiskBadge,
  SearchInput,
  Select,
  Sheet,
  Skeleton,
  StatusBadge,
  Stepper,
  Tabs,
  Textarea,
} from "../components/ui/primitives";
import { PublicShellDemo, RoleShell, ShellPreviewContent } from "../layouts/AppShells";

const tableRows = [
  [
    <div>
      <p className="font-medium">Gạo ST25 5kg</p>
      <p className="text-[13px] text-[var(--sp-text-muted)]">SKU: GAO-ST25-5</p>
    </div>,
    "Thực phẩm khô",
    <span className="sp-tabular">128</span>,
    <RiskBadge risk="low" />,
    <StatusBadge status="active" />,
    <IconButton label="Thao tác" variant="ghost">
      <MoreHorizontal className="size-4" />
    </IconButton>,
  ],
  [
    <div>
      <p className="font-medium">Nước mắm truyền thống</p>
      <p className="text-[13px] text-[var(--sp-text-muted)]">SKU: NM-TT-750</p>
    </div>,
    "Gia vị",
    <span className="sp-tabular">18</span>,
    <RiskBadge risk="medium" />,
    <StatusBadge status="pending" />,
    <IconButton label="Thao tác" variant="ghost">
      <MoreHorizontal className="size-4" />
    </IconButton>,
  ],
  [
    <div>
      <p className="font-medium">Sữa tươi không đường</p>
      <p className="text-[13px] text-[var(--sp-text-muted)]">SKU: SUA-KD-1L</p>
    </div>,
    "Sữa",
    <span className="sp-tabular">4</span>,
    <RiskBadge risk="critical" />,
    <StatusBadge status="failed" />,
    <IconButton label="Thao tác" variant="ghost">
      <MoreHorizontal className="size-4" />
    </IconButton>,
  ],
];

export function ShowcasePage() {
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1440px] overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="grid min-w-0 gap-8">
      <header className="flex min-w-0 flex-col gap-4 border-b border-[var(--sp-border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Breadcrumb items={["StockPilot", "Internal", "Visual foundation"]} />
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-normal break-words sm:text-3xl">
            StockPilot UI foundation showcase
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--sp-text-muted)] sm:text-base">
            Trang nội bộ dùng dữ liệu demo để review design system, primitives và shell theo vai trò. Không có nghiệp vụ thật.
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <Button variant="secondary">
            <Download className="size-4" />
            Xuất review
          </Button>
          <Button>
            <Plus className="size-4" />
            Thêm demo
          </Button>
        </div>
      </header>

      <section className="grid min-w-0 gap-4 lg:grid-cols-4">
        <MetricCard label="Doanh thu demo" value="128,4tr" delta="+8,2%" tone="success" />
        <MetricCard label="Đơn hàng demo" value="342" delta="Ổn định" />
        <MetricCard label="Cảnh báo kho" value="18" delta="Cần xem" tone="warning" />
        <MetricCard label="Rủi ro khẩn cấp" value="3" delta="Ưu tiên" tone="danger" />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-4 sm:p-5">
          <SectionHeader
            title="Controls"
            description="Button, icon button, input, select, combobox, checkbox, radio, textarea và form field."
          />
          <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                <Button>Chính</Button>
                <Button variant="secondary">Phụ</Button>
                <Button variant="subtle">Nhẹ</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Xóa</Button>
                <LoadingButton />
                <IconButton label="Bộ lọc" variant="secondary">
                  <Filter className="size-4" />
                </IconButton>
              </div>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <FormField label="Tên cửa hàng" hint="Dữ liệu demo, chưa lưu.">
                  <Input placeholder="An Phát Mini Mart" />
                </FormField>
                <FormField label="Mật khẩu" error="Mật khẩu cần ít nhất 8 ký tự.">
                  <PasswordInput placeholder="Nhập mật khẩu" />
                </FormField>
                <FormField label="Loại hình">
                  <Select
                    placeholder="Chọn loại hình"
                    options={[
                      { value: "mini-mart", label: "Cửa hàng tiện lợi" },
                      { value: "grocery", label: "Tạp hóa" },
                      { value: "pharmacy", label: "Nhà thuốc" },
                    ]}
                  />
                </FormField>
                <FormField label="Tỉnh/thành">
                  <Combobox
                    placeholder="Tìm tỉnh/thành"
                    options={[
                      { value: "hcm", label: "TP. Hồ Chí Minh" },
                      { value: "hn", label: "Hà Nội" },
                      { value: "dn", label: "Đà Nẵng" },
                    ]}
                  />
                </FormField>
              </div>
            </div>
            <div className="grid gap-3">
              <FormField label="Tìm sản phẩm">
                <SearchInput placeholder="SKU, tên sản phẩm..." />
              </FormField>
              <FormField label="Ghi chú vận hành">
                <Textarea placeholder="Ví dụ: kiểm tra lại tồn kho trước khi xác nhận..." />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <Checkbox label="Gửi thông báo cho quản lý" defaultChecked />
                <RadioGroup
                  defaultValue="normal"
                  options={[
                    { value: "normal", label: "Ưu tiên thường" },
                    { value: "urgent", label: "Ưu tiên cao" },
                  ]}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader title="Badges and states" description="Trạng thái luôn có nhãn, không chỉ dựa vào màu." />
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge>Trung tính</Badge>
            <Badge tone="success">Khỏe</Badge>
            <Badge tone="warning">Cần chú ý</Badge>
            <Badge tone="danger">Khẩn cấp</Badge>
            <Badge tone="info">Thông tin</Badge>
            <Badge tone="ai">AI explanation</Badge>
            <StatusBadge status="active" />
            <StatusBadge status="pending" />
            <StatusBadge status="completed" />
            <StatusBadge status="failed" />
            <RiskBadge risk="low" />
            <RiskBadge risk="medium" />
            <RiskBadge risk="high" />
            <RiskBadge risk="critical" />
          </div>
          <div className="mt-5 grid gap-3">
            <EmptyState
              title="Chưa có dữ liệu demo"
              description="Empty state cần chỉ rõ người dùng có thể làm gì tiếp theo khi triển khai nghiệp vụ."
            />
            <ErrorState
              title="Không tải được dữ liệu"
              description="Lỗi demo hiển thị ổn định trong giao diện, không chỉ phụ thuộc toast."
            />
          </div>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="p-4 sm:p-5">
          <SectionHeader title="Data table" description="Mẫu bảng desktop với density vừa phải và overflow ngang có kiểm soát." />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput placeholder="Tìm trong bảng demo..." />
            <div className="flex gap-2">
              <Button variant="secondary">
                <SlidersHorizontal className="size-4" />
                Bộ lọc
              </Button>
              <Button variant="secondary">
                <Settings2 className="size-4" />
                Cột
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <DataTable
              columns={["Sản phẩm", "Danh mục", "Tồn", "Rủi ro", "Trạng thái", ""]}
              rows={tableRows}
            />
          </div>
          <div className="mt-4">
            <Pagination />
          </div>
        </Card>
        <ChartCard />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <SectionHeader title="Dialogs, drawer and sheet" description="Radix primitives dùng cho focus trap và keyboard behavior." />
          <div className="mt-5 flex flex-wrap gap-2">
            <Modal trigger={<Button variant="secondary">Mở modal</Button>} title="Modal demo">
              <p className="text-sm leading-6 text-[var(--sp-text-muted)]">
                Modal dành cho nội dung cần xác nhận hoặc nhập ngắn. Không dùng để che toàn bộ workflow dài.
              </p>
            </Modal>
            <ConfirmDialog
              trigger={<Button variant="danger">Xác nhận xóa</Button>}
              title="Xác nhận thao tác"
              description="Đây là hộp thoại demo. Các thao tác kho, đơn hàng, giá và quyền phải chờ backend xác nhận."
            />
            <Drawer trigger={<Button variant="secondary">Mở drawer</Button>} title="Chi tiết demo">
              <p className="text-sm leading-6 text-[var(--sp-text-muted)]">
                Drawer phù hợp cho xem nhanh alert, recommendation hoặc audit metadata ở phase sau.
              </p>
            </Drawer>
            <Sheet trigger={<Button variant="secondary">Mở sheet</Button>} title="Sheet demo">
              <p className="text-sm leading-6 text-[var(--sp-text-muted)]">
                Sheet dùng cùng component drawer, giữ hành vi responsive nhất quán.
              </p>
            </Sheet>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeader title="Tabs, stepper and skeleton" description="Dùng cho setup, lọc theo trạng thái và loading ban đầu." />
          <div className="mt-5">
            <Tabs
              defaultValue="summary"
              tabs={[
                {
                  value: "summary",
                  label: "Tổng quan",
                  content: <p className="text-sm text-[var(--sp-text-muted)]">Nội dung tab demo.</p>,
                },
                {
                  value: "history",
                  label: "Lịch sử",
                  content: <p className="text-sm text-[var(--sp-text-muted)]">Lịch sử demo.</p>,
                },
              ]}
            />
          </div>
          <div className="mt-5">
            <Stepper steps={["Tài khoản", "Cửa hàng", "Địa chỉ", "Thiết lập", "Xác nhận"]} current={2} />
          </div>
          <div className="mt-5 grid gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4">
        <SectionBlock title="Public/Auth shell">
          <PublicShellDemo />
        </SectionBlock>
        <SectionBlock title="Store Owner shell">
          <RoleShell role="owner" title="Tổng quan cửa hàng">
            <ShellPreviewContent role="owner" />
          </RoleShell>
        </SectionBlock>
        <SectionBlock title="Warehouse Staff shell">
          <RoleShell role="warehouse" title="Tổng quan kho">
            <ShellPreviewContent role="warehouse" />
          </RoleShell>
        </SectionBlock>
        <SectionBlock title="Admin shell">
          <RoleShell role="admin" title="Tổng quan hệ thống">
            <ShellPreviewContent role="admin" />
          </RoleShell>
        </SectionBlock>
      </section>

      <section className="rounded-[10px] border border-[var(--sp-border)] bg-white p-4 sm:p-5">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--sp-success)]" />
          <div>
            <h2 className="font-semibold">Scope guard</h2>
            <p className="mt-1 text-sm text-[var(--sp-text-muted)]">
              Trang này dừng ở foundation, design system, primitives, role shells và visual review. Không triển khai đăng ký,
              dashboard logic, products, inventory, orders, analytics, alerts, pricing hoặc AI Assistant.
            </p>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-[var(--sp-warning)]" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-[var(--sp-text-muted)]">{description}</p>
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
