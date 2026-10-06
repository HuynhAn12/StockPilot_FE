// Utility function to merge class names (like clsx/cn)
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Format currency to VND
export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
