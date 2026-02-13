"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Ruler,
  DoorOpen,
  Layers,
  Compass,
  Car,
  ChevronUp,
  Wallet,
  Calendar,
  Building2,
  Send,
  CheckCircle,
  Phone,
  Share2,
} from "lucide-react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import DealTypeBadge from "../../../components/DealTypeBadge";
import ConsultationModal from "../../../components/ConsultationModal";
import { Property, PropertyImage } from "../../../lib/types";
import { getPriceDisplay, formatPrice } from "../../../lib/priceUtils";
import { config } from "../../../lib/config";
import api, { API_BASE_URL } from "../../../lib/api";

const CATEGORY_MAP: Record<string, string> = {
  COMMERCIAL: "상가",
  RESIDENTIAL: "아파트/주택",
  INDUSTRIAL: "공장/창고",
  LAND: "토지",
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultOpen, setConsultOpen] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const [propRes, imgRes] = await Promise.all([
          api.get(`/properties/${params.id}`),
          api.get(`/properties/${params.id}/images`),
        ]);
        setProperty(propRes.data);
        setImages(imgRes.data);
      } catch (err) {
        console.error("매물 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [params.id]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError("");
    try {
      await api.post("/inquiries", {
        property_id: property?.id,
        contact: inquiryPhone,
        message: inquiryMessage,
      });
      setInquirySubmitted(true);
      setTimeout(() => {
        setInquirySubmitted(false);
        setInquiryPhone("");
        setInquiryMessage("");
      }, 3000);
    } catch {
      setInquiryError("전송에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header onConsultationClick={() => setConsultOpen(true)} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'var(--border)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>매물 정보를 불러오고 있습니다...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!property) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header onConsultationClick={() => setConsultOpen(true)} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>매물을 찾을 수 없습니다</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>존재하지 않는 매물이거나 삭제된 매물입니다.</p>
          <Link
            href="/properties"
            className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white no-underline"
            style={{ background: 'var(--primary)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로 돌아가기
          </Link>
        </main>
        <Footer />
        <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
      </div>
    );
  }

  const priceData = getPriceDisplay(property);
  const mainImageUrl = images.length > 0
    ? `${API_BASE_URL}${images[activeImageIdx]?.image_url}`
    : property.main_image
    ? `${API_BASE_URL}${property.main_image}`
    : null;

  // Build detail rows
  const detailRows = [
    property.area ? { icon: <Ruler className="h-4 w-4" />, label: "면적", value: `${(property.area / 3.3058).toFixed(0)}평 (${property.area}m²)` } : null,
    property.rooms != null ? { icon: <DoorOpen className="h-4 w-4" />, label: "방/화장실", value: `${property.rooms}개 / ${property.bathrooms || 0}개` } : null,
    property.floor_info ? { icon: <Layers className="h-4 w-4" />, label: "층수", value: property.floor_info } : null,
    property.direction ? { icon: <Compass className="h-4 w-4" />, label: "방향", value: property.direction } : null,
    property.parking ? { icon: <Car className="h-4 w-4" />, label: "주차", value: property.parking } : null,
    property.elevator != null ? { icon: <ChevronUp className="h-4 w-4" />, label: "엘리베이터", value: property.elevator ? "있음" : "없음" } : null,
    property.maintenance_fee != null ? { icon: <Wallet className="h-4 w-4" />, label: "관리비", value: `${property.maintenance_fee}만원/월` } : null,
    property.move_in_date ? { icon: <Calendar className="h-4 w-4" />, label: "입주가능일", value: property.move_in_date } : null,
    property.usage_type ? { icon: <Building2 className="h-4 w-4" />, label: "용도", value: property.usage_type } : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div className="flex min-h-screen flex-col">
      <Header onConsultationClick={() => setConsultOpen(true)} />

      <main className="flex-1" style={{ background: 'var(--background)' }}>
        {/* Breadcrumb */}
        <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" className="transition-colors hover:opacity-80 no-underline" style={{ color: 'var(--muted-foreground)' }}>홈</Link>
              <span style={{ color: 'var(--muted-foreground)' }}>/</span>
              <Link href="/properties" className="transition-colors hover:opacity-80 no-underline" style={{ color: 'var(--muted-foreground)' }}>매물 목록</Link>
              <span style={{ color: 'var(--muted-foreground)' }}>/</span>
              <span className="font-medium" style={{ color: 'var(--foreground)' }}>{property.type}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Left Column */}
            <div className="flex flex-col gap-8 lg:col-span-2">
              {/* Image Gallery */}
              <div className="flex flex-col gap-3">
                <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '16/10', background: 'var(--muted)' }}>
                  {mainImageUrl ? (
                    <img src={mainImageUrl} alt={property.type} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="flex flex-col items-center gap-3 opacity-40">
                        <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                        </svg>
                        <span className="text-sm">{property.type} 이미지</span>
                      </div>
                    </div>
                  )}

                  {property.status === "거래완료" && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <span className="rounded-xl px-8 py-4 text-xl font-bold shadow-xl" style={{ background: 'var(--card)', color: 'var(--foreground)' }}>
                        거래완료
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImageIdx(idx)}
                        className="overflow-hidden rounded-lg transition-all cursor-pointer border-none p-0"
                        style={{
                          aspectRatio: '4/3',
                          background: 'var(--muted)',
                          outline: activeImageIdx === idx ? '2px solid var(--accent)' : 'none',
                          outlineOffset: '2px',
                          opacity: activeImageIdx === idx ? 1 : 0.7,
                        }}
                      >
                        <img
                          src={`${API_BASE_URL}${img.image_url}`}
                          alt={`이미지 ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Info */}
              <div className="flex flex-col gap-6">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    {property.deal_type && <DealTypeBadge dealType={property.deal_type} />}
                    {property.category && (
                      <span className="rounded-md px-2.5 py-1 text-xs font-medium" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                        {CATEGORY_MAP[property.category] || property.category}
                      </span>
                    )}
                    <span className="rounded-md px-2.5 py-1 text-xs font-medium" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                      {property.type}
                    </span>
                  </div>
                  <h1 className="mb-2 text-2xl font-bold md:text-3xl" style={{ color: 'var(--foreground)' }}>
                    {property.type}
                  </h1>
                  <div className="flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{property.address}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="rounded-xl p-6" style={{ background: 'rgba(30,58,95,0.05)' }}>
                  <p className="mb-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>거래 가격</p>
                  {priceData.primary && (
                    <p className="text-3xl font-bold m-0" style={{ color: 'var(--primary)' }}>
                      {priceData.primary.label} {formatPrice(priceData.primary.value)}
                    </p>
                  )}
                  {priceData.secondary && (
                    <p className="text-lg font-semibold mt-1 m-0" style={{ color: 'var(--accent)' }}>
                      {priceData.secondary.label} {formatPrice(priceData.secondary.value)}
                    </p>
                  )}
                </div>

                {/* Details Table */}
                {detailRows.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--foreground)' }}>상세 정보</h2>
                    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--border)' }}>
                      {detailRows.map((row, idx) => (
                        <div
                          key={row.label}
                          className="flex items-center gap-4 px-5 py-4"
                          style={{
                            borderBottom: idx !== detailRows.length - 1 ? '1px solid var(--border)' : 'none',
                            background: idx % 2 === 0 ? 'var(--card)' : 'var(--background)',
                          }}
                        >
                          <div className="flex w-32 items-center gap-2.5" style={{ color: 'var(--muted-foreground)' }}>
                            {row.icon}
                            <span className="text-sm font-medium">{row.label}</span>
                          </div>
                          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {property.description && (
                  <div>
                    <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--foreground)' }}>매물 설명</h2>
                    <div className="rounded-xl p-6" style={{ background: 'var(--card)' }}>
                      <p className="whitespace-pre-line text-sm leading-relaxed m-0" style={{ color: 'var(--muted-foreground)' }}>
                        {property.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="flex flex-col gap-6">
              {/* Quick Actions */}
              <div className="flex flex-col gap-3 rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <a
                  href={`tel:${config.company.phone}`}
                  className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors no-underline"
                  style={{ background: 'var(--accent)' }}
                >
                  <Phone className="h-4 w-4" />
                  전화 문의
                </a>
                <button
                  onClick={() => setConsultOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors cursor-pointer"
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  <Share2 className="h-4 w-4" />
                  간편 상담
                </button>
              </div>

              {/* Inquiry Form */}
              <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                {inquirySubmitted ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(34,197,94,0.1)' }}>
                      <CheckCircle className="h-7 w-7" style={{ color: '#22c55e' }} />
                    </div>
                    <h3 className="text-lg font-bold m-0" style={{ color: 'var(--foreground)' }}>문의 완료!</h3>
                    <p className="text-center text-sm m-0" style={{ color: 'var(--muted-foreground)' }}>
                      빠른 시일 내에 연락드리겠습니다.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="mb-4 text-lg font-bold" style={{ color: 'var(--foreground)' }}>이 매물 문의하기</h3>
                    {inquiryError && (
                      <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
                        {inquiryError}
                      </div>
                    )}
                    <form onSubmit={handleInquirySubmit} className="flex flex-col gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>연락처</label>
                        <input
                          type="tel"
                          required
                          value={inquiryPhone}
                          onChange={(e) => setInquiryPhone(e.target.value)}
                          placeholder="010-0000-0000"
                          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                          style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>문의내용</label>
                        <textarea
                          rows={4}
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          placeholder={`"${property.type}" 매물에 대해 문의합니다.`}
                          className="w-full resize-none rounded-lg px-4 py-2.5 text-sm outline-none"
                          style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </div>
                      <button
                        type="submit"
                        className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors cursor-pointer border-none"
                        style={{ background: 'var(--primary)' }}
                      >
                        <Send className="h-4 w-4" />
                        문의하기
                      </button>
                    </form>
                  </>
                )}
              </div>

              {/* Agent Info */}
              <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>담당 중개사</h3>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(30,58,95,0.1)' }}>
                    <Building2 className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <p className="font-semibold m-0" style={{ color: 'var(--foreground)' }}>{config.company.name}</p>
                    <p className="text-sm m-0" style={{ color: 'var(--muted-foreground)' }}>{config.company.phone}</p>
                  </div>
                </div>
              </div>

              {/* Back button */}
              <button
                onClick={() => router.push("/properties")}
                className="flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors cursor-pointer"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
              >
                <ArrowLeft className="h-4 w-4" />
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
    </div>
  );
}
