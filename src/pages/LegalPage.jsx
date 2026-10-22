import React, { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { StockPilotLogoIcon } from '../components/common/StockPilotLogo';
import { LEGAL_DOCUMENTS, LEGAL_EFFECTIVE_DATE, LEGAL_LINKS, LEGAL_VERSION, OPERATOR } from './legalContent';

export function LegalPage() {
  const { slug } = useParams();
  const doc = LEGAL_DOCUMENTS[slug];

  useEffect(() => {
    if (doc) document.title = `${doc.title} · StockPilot`;
    window.scrollTo(0, 0);
  }, [doc]);

  if (!doc) return <Navigate to="/dieu-khoan/dieu-khoan-su-dung" replace />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#334155]">
      <header className="bg-white border-b border-[#E5E7EB] print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <StockPilotLogoIcon size="sm" />
            <span className="font-bold text-[#0F172A]">StockPilot</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-[13px] text-[#64748B] hover:text-[#0F172A]">
            <ArrowLeft className="w-4 h-4" /> Trang chủ
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[240px_1fr] gap-8">
        <nav className="print:hidden" aria-label="Văn bản pháp lý">
          <p className="text-[12px] font-medium text-[#94A3B8] mb-2">Văn bản pháp lý</p>
          <ul className="space-y-1">
            {LEGAL_LINKS.map((link) => (
              <li key={link.slug}>
                <Link
                  to={`/dieu-khoan/${link.slug}`}
                  className={`block px-3 py-2 rounded-lg text-[13px] ${
                    link.slug === slug ? 'bg-blue-50 text-[#1D4ED8] font-medium' : 'text-[#475569] hover:bg-slate-100'
                  }`}
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="bg-white rounded-xl border border-[#E5E7EB] p-6 sm:p-10 print:border-0 print:p-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[24px] sm:text-[28px] font-bold text-[#0F172A] leading-tight">{doc.title}</h1>
              <p className="text-[13px] text-[#64748B] mt-2">
                Phiên bản {LEGAL_VERSION} · Có hiệu lực từ {LEGAL_EFFECTIVE_DATE}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#475569] hover:bg-slate-50"
            >
              <Printer className="w-3.5 h-3.5" /> In / Lưu PDF
            </button>
          </div>

          <p className="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-900">
            StockPilot hiện là sản phẩm của đồ án tốt nghiệp, chưa đăng ký kinh doanh. Văn bản này sẽ được rà soát pháp lý và bổ sung
            thông tin doanh nghiệp trước khi cung cấp dịch vụ thương mại.
          </p>

          <p className="mt-5 text-[15px] leading-relaxed text-[#475569]">{doc.summary}</p>

          <div className="mt-6 space-y-7">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-[17px] font-semibold text-[#0F172A] mb-2.5">{section.heading}</h2>
                {section.paragraphs?.map((p) => (
                  <p key={p} className="text-[15px] leading-relaxed text-[#475569] mb-2.5">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed text-[#475569]">
                    {section.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <footer className="mt-10 pt-5 border-t border-[#E5E7EB] text-[13px] text-[#64748B] space-y-1">
            <p>Đơn vị vận hành: {OPERATOR.name}</p>
            <p>Địa chỉ: {OPERATOR.address}</p>
            <p>Đăng ký kinh doanh: {OPERATOR.businessRegistration}</p>
            <p>Liên hệ: {OPERATOR.contact}</p>
          </footer>
        </article>
      </div>
    </div>
  );
}

export default LegalPage;
