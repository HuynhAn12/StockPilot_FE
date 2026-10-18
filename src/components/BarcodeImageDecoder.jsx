/**
 * BarcodeImageDecoder.jsx
 * Giải mã mã vạch từ ảnh tải lên — client-side, không cần backend.
 * Dùng ZXing (HTML5 browser library).
 */
import React, { useState, useRef, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  ScanLine, Upload, X, CheckCircle2, AlertTriangle,
  Loader2, Camera, RotateCcw
} from "lucide-react";

/**
 * Props:
 *   onDecoded(barcodeText: string) — gọi khi đọc mã vạch thành công
 *   onClose() — đóng modal
 */
export function BarcodeImageDecoder({ onDecoded, onClose }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | decoding | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const decodeFromImage = useCallback(async (imageElement) => {
    setStatus("decoding");
    setResult(null);
    setErrorMsg(null);
    try {
      const reader = new BrowserMultiFormatReader();
      const decoded = await reader.decodeFromImageElement(imageElement);
      setResult(decoded.getText());
      setStatus("success");
    } catch (err) {
      console.warn("Không đọc được mã vạch:", err);
      setStatus("error");
      setErrorMsg(
        "Không tìm thấy mã vạch trong ảnh. Thử lại với ảnh rõ hơn hoặc góc chụp thẳng hơn."
      );
    }
  }, []);

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      setResult(null);
      setErrorMsg(null);
      setStatus("idle");

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        const img = new Image();
        img.onload = () => decodeFromImage(img);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    [decodeFromImage]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handlePaste = useCallback(
    (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          handleFile(item.getAsFile());
          break;
        }
      }
    },
    [handleFile]
  );

  const reset = () => {
    setImagePreview(null);
    setResult(null);
    setErrorMsg(null);
    setStatus("idle");
  };

  const handleUseResult = () => {
    if (result) {
      onDecoded(result);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onPaste={handlePaste}
      tabIndex={-1}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 25px 60px -10px rgba(0,0,0,0.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg,#1e40af 0%,#3b82f6 100%)",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: "10px",
                padding: "7px",
                display: "flex",
              }}
            >
              <ScanLine size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                Đọc mã vạch từ ảnh
              </div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
                Tải ảnh chứa mã vạch để tự động nhận diện
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <X size={18} color="#fff" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {!imagePreview ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#3b82f6" : "#cbd5e1"}`,
                borderRadius: "16px",
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "#eff6ff" : "#f8fafc",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "14px",
                  background: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Upload size={28} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#1e40af", fontSize: 14 }}>
                  Nhấn để chọn ảnh mã vạch
                </div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                  hoặc kéo thả ảnh vào đây
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                JPG, PNG, WEBP • Bạn cũng có thể dán (Ctrl+V)
              </div>
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#f1f5f9",
                  borderRadius: "10px",
                  padding: "6px 12px",
                }}
              >
                <Camera size={13} color="#64748b" />
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Hỗ trợ: EAN-13, EAN-8, Code128, QR Code, UPC, Data Matrix...
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <img
                  src={imagePreview}
                  alt="Barcode preview"
                  style={{ width: "100%", maxHeight: 240, objectFit: "contain", display: "block", background: "#f8fafc" }}
                />
                {status === "decoding" && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(15,23,42,0.55)",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: 8,
                  }}>
                    <Loader2 size={30} color="#60a5fa" style={{ animation: "spin 1s linear infinite" }} />
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Đang nhận diện mã vạch...</span>
                  </div>
                )}
              </div>

              {status === "success" && result && (
                <div style={{
                  background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "12px",
                  padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>Đã nhận diện thành công!</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#14532d", fontFamily: "monospace", marginTop: 2, letterSpacing: "0.04em" }}>
                      {result}
                    </div>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div style={{
                  background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "12px",
                  padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <AlertTriangle size={18} color="#ea580c" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 12, color: "#c2410c", fontWeight: 600 }}>Không nhận diện được</div>
                    <div style={{ fontSize: 11, color: "#9a3412", marginTop: 2 }}>{errorMsg}</div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={reset}
                  style={{
                    flex: 1, padding: "9px 14px", borderRadius: "10px",
                    border: "1px solid #e2e8f0", background: "#f8fafc",
                    cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#475569",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  <RotateCcw size={13} /> Thử ảnh khác
                </button>

                {status === "success" && result && (
                  <button
                    onClick={handleUseResult}
                    style={{
                      flex: 2, padding: "9px 14px", borderRadius: "10px",
                      border: "none", background: "linear-gradient(135deg,#1e40af,#3b82f6)",
                      cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      boxShadow: "0 4px 12px -2px rgba(59,130,246,0.4)",
                    }}
                  >
                    <CheckCircle2 size={15} /> Dùng mã này
                  </button>
                )}
              </div>
            </div>
          )}

          {!imagePreview && (
            <div style={{
              background: "#f0f9ff", borderRadius: "10px", padding: "10px 14px",
              fontSize: 11, color: "#0369a1", lineHeight: 1.5,
            }}>
              <strong>💡 Mẹo:</strong> Ảnh chụp rõ mã vạch, đủ sáng, không bị mờ hoặc méo sẽ cho kết quả tốt nhất.
              Có thể chụp màn hình sản phẩm rồi dán vào (Ctrl+V).
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files[0])}
          style={{ display: "none" }}
        />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
