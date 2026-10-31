// Nhãn tiếng Việt và hàm định dạng dùng chung cho các trang quản trị.

export const ROLE_LABELS = {
  SHOP_OWNER: 'Chủ cửa hàng',
  WAREHOUSE_STAFF: 'Nhân viên kho',
  ADMIN: 'Quản trị viên',
};

export function roleLabel(role) {
  return ROLE_LABELS[String(role || '').toUpperCase()] || 'Hệ thống';
}

export const ACTION_LABELS = {
  USER_LOGIN: 'Đăng nhập',
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  PASSWORD_RESET: 'Đặt lại mật khẩu',
  USER_CREATED: 'Tạo tài khoản',
  USER_UPDATED: 'Cập nhật tài khoản',
  USER_DELETED: 'Xóa tài khoản',
  USER_DISABLED: 'Vô hiệu hóa tài khoản',
  USER_LOCKED: 'Khóa tài khoản',
  USER_UNLOCKED: 'Mở khóa tài khoản',
  USER_SESSIONS_REVOKED: 'Đăng xuất mọi thiết bị',
  PASSWORD_RESET_SENT_BY_ADMIN: 'Gửi mã đặt lại mật khẩu',
  SYSTEM_SETTING_UPDATED: 'Đổi cài đặt hệ thống',
  STORE_REGISTERED: 'Đăng ký cửa hàng',
  STORE_LOCKED: 'Tạm khóa cửa hàng',
  STORE_UNLOCKED: 'Mở lại cửa hàng',
  STORE_UPDATED: 'Sửa thông tin cửa hàng',
  ORDER_CREATED: 'Tạo đơn hàng',
  ORDER_CONFIRMED: 'Xác nhận đơn hàng',
  ORDER_FULFILLED: 'Hoàn tất đơn hàng',
  ORDER_CANCELED: 'Hủy đơn hàng',
  POS_SALE_CREATED: 'Bán hàng tại quầy',
  RETURN_CREATED: 'Tạo phiếu trả hàng',
  PAYMENT_CREATED: 'Tạo thanh toán',
  PAYMENT_PAID: 'Ghi nhận thanh toán',
  PAYMENT_CONFIG_UPDATED: 'Cập nhật cấu hình thanh toán',
  PAYMENT_CONFIG_DISABLED: 'Tắt cấu hình thanh toán',
  PRODUCT_CREATED: 'Thêm sản phẩm',
  PRODUCT_DELETED: 'Xóa sản phẩm',
  PRODUCT_DEACTIVATED: 'Ngừng bán sản phẩm',
  PRODUCT_REACTIVATED: 'Mở bán lại sản phẩm',
  UPDATED_SKU: 'Cập nhật SKU',
  CATEGORY_CREATED: 'Thêm danh mục',
  CATEGORY_DELETED: 'Xóa danh mục',
  CATEGORY_DEACTIVATED: 'Ẩn danh mục',
  CATEGORY_REACTIVATED: 'Hiện lại danh mục',
  INVENTORY_INFLOW: 'Nhập kho',
  INVENTORY_OUTFLOW: 'Xuất kho',
  INVENTORY_AUDIT: 'Điều chỉnh tồn kho',
  STOCK_TAKE_COMPLETED: 'Hoàn tất kiểm kê',
  STOCK_TAKE_CANCELED: 'Hủy kiểm kê',
  IMPORT_COMMITTED: 'Nhập dữ liệu từ file',
  HISTORICAL_SALES_IMPORT_COMMITTED: 'Nhập lịch sử bán hàng',
  PRICING_RECOMMENDATION_APPROVED: 'Duyệt giá đề xuất',
  PRICING_RECOMMENDATION_REJECTED: 'Từ chối giá đề xuất',
  PRICING_RECOMMENDATION_MODIFIED: 'Chỉnh giá đề xuất',
  ALERT_ACKNOWLEDGED: 'Ghi nhận cảnh báo',
  ALERT_RESOLVED: 'Xử lý cảnh báo',
  LEAD_STATUS_UPDATED: 'Cập nhật khách tiềm năng',
  LEAD_ASSIGNED: 'Giao khách tiềm năng',
  SUPPORT_TICKET_CREATED: 'Gửi yêu cầu hỗ trợ',
  SUPPORT_TICKET_UPDATED: 'Cập nhật yêu cầu hỗ trợ',
  AUDIT_LOG_EXPORTED: 'Xuất nhật ký kiểm toán',
};

export function actionLabel(action) {
  if (!action) return 'Thao tác';
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const text = action.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Hành động cần admin chú ý (khóa, xóa, hủy...) được tô đỏ; còn lại để màu trung tính. */
export function isSensitiveAction(action) {
  return /LOCK|DELETE|DISABLE|CANCEL|REVOKE|EXPORT|SETTING/.test(String(action || '')) && !/UNLOCK/.test(String(action || ''));
}

export const ENTITY_LABELS = {
  USER: 'Tài khoản',
  AUTH: 'Đăng nhập',
  STORE: 'Cửa hàng',
  ORDER: 'Đơn hàng',
  RETURN: 'Trả hàng',
  PAYMENT: 'Thanh toán',
  STORE_PAYMENT_CONFIG: 'Cấu hình thanh toán',
  PRODUCT: 'Sản phẩm',
  CATEGORY: 'Danh mục',
  INVENTORY: 'Kho',
  STOCK_TAKE: 'Kiểm kê',
  IMPORT_JOB: 'Nhập dữ liệu',
  PRICING: 'Giá bán',
  PRICING_RECOMMENDATION: 'Giá đề xuất',
  ALERT: 'Cảnh báo',
  CONTACT_LEAD: 'Khách tiềm năng',
  AUDIT_LOG: 'Nhật ký',
  SYSTEM: 'Hệ thống',
  SYSTEM_SETTING: 'Cài đặt hệ thống',
  SUPPORT_TICKET: 'Hỗ trợ',
};

export function entityLabel(entityType) {
  return ENTITY_LABELS[entityType] || entityType || 'Hệ thống';
}

export function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return '';
}

export function apiErrorMessage(err, fallback = 'Không kết nối được máy chủ. Vui lòng thử lại.') {
  return err?.response?.data?.error?.message || err?.message || fallback;
}
