// Nhãn song ngữ (Việt - Anh) và hàm định dạng dùng chung cho các trang quản trị.
import { useUIStore } from '../../components/store/uiStore';

const getLang = (forcedLang) => {
  if (forcedLang) return forcedLang;
  try {
    return useUIStore.getState()?.language || 'vi';
  } catch {
    return 'vi';
  }
};

export const ROLE_LABELS_VI = {
  SHOP_OWNER: 'Chủ cửa hàng',
  WAREHOUSE_STAFF: 'Nhân viên kho',
  ADMIN: 'Quản trị viên',
};

export const ROLE_LABELS_EN = {
  SHOP_OWNER: 'Shop Owner',
  WAREHOUSE_STAFF: 'Warehouse Staff',
  ADMIN: 'Platform Admin',
};

function createLocalizedProxy(mapVi, mapEn) {
  return new Proxy({}, {
    get(target, prop) {
      const isEn = getLang() === 'en';
      const map = isEn ? mapEn : mapVi;
      return map[prop];
    },
    ownKeys() {
      const isEn = getLang() === 'en';
      const map = isEn ? mapEn : mapVi;
      return Reflect.ownKeys(map);
    },
    getOwnPropertyDescriptor(target, prop) {
      const isEn = getLang() === 'en';
      const map = isEn ? mapEn : mapVi;
      if (prop in map) {
        return {
          value: map[prop],
          writable: true,
          enumerable: true,
          configurable: true,
        };
      }
      return undefined;
    },
  });
}

export const ROLE_LABELS = createLocalizedProxy(ROLE_LABELS_VI, ROLE_LABELS_EN);

export function roleLabel(role, lang) {
  const isEn = getLang(lang) === 'en';
  const map = isEn ? ROLE_LABELS_EN : ROLE_LABELS_VI;
  return map[String(role || '').toUpperCase()] || (isEn ? 'System' : 'Hệ thống');
}

export const ACTION_LABELS_VI = {
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
  SYSTEM_SETTING_RESTORED: 'Khôi phục cài đặt hệ thống',
  LOGIN_FAILED: 'Đăng nhập sai',
  LOGIN_BLOCKED: 'Đăng nhập bị chặn (đang khóa tạm)',
  LOGIN_LOCK_CLEARED: 'Gỡ khóa đăng nhập tạm thời',
  DECISION_RECALC_TRIGGERED_BY_ADMIN: 'Admin tính lại Decision Engine',
  STORE_OWNER_TRANSFERRED: 'Chuyển quyền chủ cửa hàng',
  ANNOUNCEMENT_SENT: 'Gửi thông báo tới cửa hàng',
  ADMIN_2FA_ENABLED: 'Bật xác thực 2 lớp',
  ADMIN_2FA_DISABLED: 'Tắt xác thực 2 lớp',
  ADMIN_2FA_RESET: 'Đặt lại xác thực 2 lớp',
  STORE_DATA_EXPORTED: 'Xuất dữ liệu cửa hàng',
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

export const ACTION_LABELS_EN = {
  USER_LOGIN: 'Signed in',
  LOGIN: 'Signed in',
  LOGOUT: 'Signed out',
  PASSWORD_RESET: 'Password reset',
  USER_CREATED: 'Created user account',
  USER_UPDATED: 'Updated user account',
  USER_DELETED: 'Deleted user account',
  USER_DISABLED: 'Disabled user account',
  USER_LOCKED: 'Locked user account',
  USER_UNLOCKED: 'Unlocked user account',
  USER_SESSIONS_REVOKED: 'Revoked all device sessions',
  PASSWORD_RESET_SENT_BY_ADMIN: 'Sent password reset link',
  SYSTEM_SETTING_UPDATED: 'Updated system setting',
  SYSTEM_SETTING_RESTORED: 'Restored system setting',
  LOGIN_FAILED: 'Failed login attempt',
  LOGIN_BLOCKED: 'Login blocked (rate limited)',
  LOGIN_LOCK_CLEARED: 'Cleared temporary login lock',
  DECISION_RECALC_TRIGGERED_BY_ADMIN: 'Triggered Decision Engine recalc',
  STORE_OWNER_TRANSFERRED: 'Transferred store ownership',
  ANNOUNCEMENT_SENT: 'Sent platform announcement',
  ADMIN_2FA_ENABLED: 'Enabled 2FA',
  ADMIN_2FA_DISABLED: 'Disabled 2FA',
  ADMIN_2FA_RESET: 'Reset 2FA credentials',
  STORE_DATA_EXPORTED: 'Exported store data',
  STORE_REGISTERED: 'Registered store',
  STORE_LOCKED: 'Locked store',
  STORE_UNLOCKED: 'Unlocked store',
  STORE_UPDATED: 'Updated store profile',
  ORDER_CREATED: 'Created order',
  ORDER_CONFIRMED: 'Confirmed order',
  ORDER_FULFILLED: 'Fulfilled order',
  ORDER_CANCELED: 'Cancelled order',
  POS_SALE_CREATED: 'POS retail sale',
  RETURN_CREATED: 'Created return receipt',
  PAYMENT_CREATED: 'Created payment',
  PAYMENT_PAID: 'Recorded payment',
  PAYMENT_CONFIG_UPDATED: 'Updated payment gateway',
  PAYMENT_CONFIG_DISABLED: 'Disabled payment gateway',
  PRODUCT_CREATED: 'Created product',
  PRODUCT_DELETED: 'Deleted product',
  PRODUCT_DEACTIVATED: 'Deactivated product',
  PRODUCT_REACTIVATED: 'Reactivated product',
  UPDATED_SKU: 'Updated SKU',
  CATEGORY_CREATED: 'Created category',
  CATEGORY_DELETED: 'Deleted category',
  CATEGORY_DEACTIVATED: 'Hidden category',
  CATEGORY_REACTIVATED: 'Restored category',
  INVENTORY_INFLOW: 'Inventory inflow',
  INVENTORY_OUTFLOW: 'Inventory outflow',
  INVENTORY_AUDIT: 'Inventory audit adjustment',
  STOCK_TAKE_COMPLETED: 'Completed stock take',
  STOCK_TAKE_CANCELED: 'Cancelled stock take',
  IMPORT_COMMITTED: 'Committed spreadsheet data',
  HISTORICAL_SALES_IMPORT_COMMITTED: 'Imported historical sales',
  PRICING_RECOMMENDATION_APPROVED: 'Approved price recommendation',
  PRICING_RECOMMENDATION_REJECTED: 'Rejected price recommendation',
  PRICING_RECOMMENDATION_MODIFIED: 'Modified price recommendation',
  ALERT_ACKNOWLEDGED: 'Acknowledged alert',
  ALERT_RESOLVED: 'Resolved alert',
  LEAD_STATUS_UPDATED: 'Updated lead status',
  LEAD_ASSIGNED: 'Assigned lead',
  SUPPORT_TICKET_CREATED: 'Created support ticket',
  SUPPORT_TICKET_UPDATED: 'Updated support ticket',
  AUDIT_LOG_EXPORTED: 'Exported audit log CSV',
};

export const ACTION_LABELS = createLocalizedProxy(ACTION_LABELS_VI, ACTION_LABELS_EN);

export function actionLabel(action, lang) {
  const isEn = getLang(lang) === 'en';
  if (!action) return isEn ? 'Action' : 'Thao tác';
  const map = isEn ? ACTION_LABELS_EN : ACTION_LABELS_VI;
  if (map[action]) return map[action];
  const text = action.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Hành động cần admin chú ý (khóa, xóa, hủy...) được tô đỏ; còn lại để màu trung tính. */
export function isSensitiveAction(action) {
  return /LOCK|DELETE|DISABLE|CANCEL|REVOKE|EXPORT|SETTING/.test(String(action || '')) && !/UNLOCK/.test(String(action || ''));
}

export const ENTITY_LABELS_VI = {
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

export const ENTITY_LABELS_EN = {
  USER: 'User Account',
  AUTH: 'Authentication',
  STORE: 'Store',
  ORDER: 'Order',
  RETURN: 'Return Receipt',
  PAYMENT: 'Payment',
  STORE_PAYMENT_CONFIG: 'Payment Gateway',
  PRODUCT: 'Product',
  CATEGORY: 'Category',
  INVENTORY: 'Inventory',
  STOCK_TAKE: 'Stock Take',
  IMPORT_JOB: 'Data Import',
  PRICING: 'Pricing',
  PRICING_RECOMMENDATION: 'Price Suggestion',
  ALERT: 'Risk Alert',
  CONTACT_LEAD: 'Lead',
  AUDIT_LOG: 'Audit Log',
  SYSTEM: 'System',
  SYSTEM_SETTING: 'System Setting',
  SUPPORT_TICKET: 'Support Ticket',
};

export const ENTITY_LABELS = createLocalizedProxy(ENTITY_LABELS_VI, ENTITY_LABELS_EN);

export function entityLabel(entityType, lang) {
  const isEn = getLang(lang) === 'en';
  const map = isEn ? ENTITY_LABELS_EN : ENTITY_LABELS_VI;
  return map[entityType] || entityType || (isEn ? 'System' : 'Hệ thống');
}

export function formatRelativeTime(value, lang) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const isEn = getLang(lang) === 'en';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSec < 60) return isEn ? 'Just now' : 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isEn ? `${diffMin}m ago` : `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return isEn ? `${diffHour}h ago` : `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return isEn ? `${diffDay}d ago` : `${diffDay} ngày trước`;
  return '';
}

export function apiErrorMessage(err, fallback) {
  const isEn = getLang() === 'en';
  const defaultFallback = isEn ? 'Unable to connect to the server. Please try again.' : 'Không kết nối được máy chủ. Vui lòng thử lại.';
  return err?.response?.data?.error?.message || err?.message || fallback || defaultFallback;
}
