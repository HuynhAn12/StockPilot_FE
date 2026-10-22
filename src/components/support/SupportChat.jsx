import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Send, X, Loader2, Lock } from 'lucide-react';
import { MAX_SUPPORT_IMAGES, MAX_SUPPORT_IMAGE_BYTES, SUPPORT_IMAGE_TYPES } from '../../services/supportService';
import { formatVNDateTime } from '../../services/adminService';

/**
 * Runs `fn` every `ms` while `enabled` and the browser tab is visible, and once when the tab
 * becomes visible again, so open conversations update without reloading the page.
 */
export function usePolling(fn, ms, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => {
      if (document.visibilityState === 'visible') fnRef.current();
    };
    const timer = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [ms, enabled]);
}

function formatDay(value) {
  const d = new Date(value);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/** Private image: fetched with the auth header (fetcher) and shown through an object URL. */
function AttachmentImage({ attachment, fetcher, onOpen }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    fetcher(attachment.id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id, fetcher]);

  if (failed) {
    return <div className="w-28 h-20 rounded-lg border border-dashed border-[#CBD5E1] text-[11px] text-[#94A3B8] flex items-center justify-center">Không tải được ảnh</div>;
  }
  if (!url) return <div className="w-28 h-20 rounded-lg bg-slate-100 animate-pulse" />;
  return (
    <button type="button" onClick={() => onOpen(url, attachment.fileName)} className="block cursor-zoom-in" title={attachment.fileName}>
      <img src={url} alt={attachment.fileName} className="max-w-55 max-h-40 rounded-lg border border-black/5 object-cover" />
    </button>
  );
}

function Lightbox({ image, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-6" onClick={onClose} role="dialog" aria-label={image.name}>
      <img src={image.url} alt={image.name} className="max-w-full max-h-full rounded-lg shadow-2xl" />
      <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Đóng">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

/** Chat-style conversation grouped by day. `viewerIsAdmin` decides which side counts as "mine". */
export function MessageThread({ messages, viewerIsAdmin, fetchAttachment }) {
  const endRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);
  const lastId = messages[messages.length - 1]?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lastId]);

  let lastDay = '';
  return (
    <div className="space-y-3">
      {messages.map((m) => {
        const mine = viewerIsAdmin ? m.fromAdmin : !m.fromAdmin;
        const day = formatDay(m.createdAt);
        const showDay = day !== lastDay;
        lastDay = day;
        const name = m.author?.fullName || (m.fromAdmin ? 'Đội hỗ trợ' : 'Cửa hàng');

        return (
          <React.Fragment key={m.id}>
            {showDay && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-[#E5E7EB]" />
                <span className="text-[11px] text-[#94A3B8] capitalize">{day}</span>
                <div className="flex-1 h-px bg-[#E5E7EB]" />
              </div>
            )}
            <div className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[12px] font-semibold ${
                  m.fromAdmin ? 'bg-blue-600 text-white' : 'bg-slate-200 text-[#475569]'
                }`}
                aria-hidden="true"
              >
                {m.fromAdmin && !viewerIsAdmin ? 'SP' : name.charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-[78%] flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div className="text-[11px] text-[#94A3B8] mb-1 flex items-center gap-1">
                  {m.isInternal && (
                    <span className="inline-flex items-center gap-0.5 text-amber-700">
                      <Lock className="w-3 h-3" /> Ghi chú nội bộ ·
                    </span>
                  )}
                  {name} · <span title={formatVNDateTime(m.createdAt)}>{formatTime(m.createdAt)}</span>
                </div>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed space-y-2 ${
                    m.isInternal
                      ? 'bg-amber-50 border border-amber-200 text-amber-950'
                      : mine
                      ? 'bg-[#3B82F6] text-white rounded-tr-md'
                      : 'bg-white border border-[#E5E7EB] text-[#334155] rounded-tl-md'
                  }`}
                >
                  {m.body && <p className="whitespace-pre-wrap wrap-break-word">{m.body}</p>}
                  {m.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {m.attachments.map((a) => (
                        <AttachmentImage key={a.id} attachment={a} fetcher={fetchAttachment} onOpen={(url, name) => setLightbox({ url, name })} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div ref={endRef} />
      {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

function validateImages(current, incoming) {
  const accepted = [];
  const errors = [];
  for (const file of incoming) {
    if (!SUPPORT_IMAGE_TYPES.includes(file.type)) errors.push(`${file.name}: chỉ nhận ảnh JPG, PNG, WEBP, GIF`);
    else if (file.size > MAX_SUPPORT_IMAGE_BYTES) errors.push(`${file.name}: ảnh lớn hơn 5 MB`);
    else if (current.length + accepted.length >= MAX_SUPPORT_IMAGES) errors.push(`Tối đa ${MAX_SUPPORT_IMAGES} ảnh mỗi tin nhắn`);
    else accepted.push(file);
  }
  return { accepted, errors: [...new Set(errors)] };
}

/** Thumbnails for images picked but not sent yet. */
export function PendingImages({ files, onRemove }) {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    const next = files.map((f) => URL.createObjectURL(f));
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file, i) => (
        <div key={`${file.name}-${i}`} className="relative">
          <img src={urls[i]} alt={file.name} className="w-16 h-16 rounded-lg object-cover border border-[#E5E7EB]" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center"
            aria-label={`Bỏ ảnh ${file.name}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Hook for any form that accepts pasted, dropped or picked images. */
export function useImagePicker(onError) {
  const [files, setFiles] = useState([]);
  const add = (list) => {
    const incoming = Array.from(list || []).filter((f) => f.type?.startsWith('image/') || SUPPORT_IMAGE_TYPES.includes(f.type));
    if (!incoming.length) return;
    setFiles((current) => {
      const { accepted, errors } = validateImages(current, incoming);
      if (errors.length) onError?.(errors.join('. '));
      return [...current, ...accepted];
    });
  };
  const remove = (index) => setFiles((current) => current.filter((_, i) => i !== index));
  const clear = () => setFiles([]);
  const onPaste = (e) => {
    const images = Array.from(e.clipboardData?.files || []);
    if (images.length) {
      e.preventDefault();
      add(images);
    }
  };
  return { files, add, remove, clear, onPaste };
}

/**
 * Message box: Enter sends, Shift+Enter adds a line; images can be picked, pasted or dropped.
 * `extra` renders controls on the left of the send button (e.g. the internal-note switch).
 */
export function Composer({ onSend, placeholder, disabled, extra, hint, quickReplies, tone = 'default', onError }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const images = useImagePicker(onError);

  const canSend = !sending && !disabled && (text.trim().length > 0 || images.files.length > 0);

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await onSend(text.trim(), images.files);
      setText('');
      images.clear();
    } catch {
      // The caller already reported the error; keep the draft so nothing typed is lost.
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`p-3 border-t border-[#E5E7EB] space-y-2 ${dragging ? 'bg-blue-50' : 'bg-white'}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        images.add(e.dataTransfer.files);
      }}
    >
      {quickReplies?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {quickReplies.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setText((t) => (t ? `${t}\n${q.text}` : q.text))}
              className="px-2 py-0.5 rounded-full border border-[#E5E7EB] text-[11px] text-[#475569] hover:bg-slate-50 cursor-pointer"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
      <PendingImages files={images.files} onRemove={images.remove} />
      <div className={`flex items-end gap-2 rounded-xl border px-2 py-1.5 focus-within:ring-2 ${tone === 'internal' ? 'border-amber-300 bg-amber-50 focus-within:ring-amber-200' : 'border-[#E5E7EB] focus-within:border-[#3B82F6] focus-within:ring-blue-100'}`}>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={disabled || images.files.length >= MAX_SUPPORT_IMAGES}
          className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          aria-label="Đính kèm ảnh"
          title={`Đính kèm ảnh (tối đa ${MAX_SUPPORT_IMAGES}, mỗi ảnh ≤ 5 MB). Có thể dán ảnh bằng Ctrl+V.`}
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={SUPPORT_IMAGE_TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            images.add(e.target.files);
            e.target.value = '';
          }}
        />
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={images.onPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          maxLength={5000}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-[13px] text-[#334155] placeholder:text-[#94A3B8] focus:outline-none py-1.5 max-h-40 field-sizing-content"
        />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className="p-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white disabled:opacity-40 cursor-pointer"
          aria-label="Gửi"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
        <div>{extra}</div>
        <span>{hint ?? 'Enter để gửi · Shift+Enter xuống dòng · Dán hoặc kéo thả ảnh vào đây'}</span>
      </div>
    </div>
  );
}
