import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { apiGetPlatformStatus } from '../../services/adminService';

const REFRESH_MS = 5 * 60 * 1000;

/** Platform-wide notice set by an admin (Hệ thống → Cài đặt). Renders nothing when there is none. */
export function PlatformAnnouncement() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      apiGetPlatformStatus()
        .then((status) => !cancelled && setMessage(status?.announcement || null))
        .catch(() => {});
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!message) return null;

  return (
    <div role="status" className="flex items-start gap-2 px-4 lg:px-6 py-2 bg-amber-50 border-b border-amber-200 text-[13px] text-amber-900">
      <Megaphone className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
      <span>{message}</span>
    </div>
  );
}
