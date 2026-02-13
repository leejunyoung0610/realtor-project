"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Phone,
  Store,
  Home,
  Factory,
  Mountain,
  Shield,
  Clock,
  Users,
  MessageSquare,
  Send,
  CheckCircle,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PropertyCard from "../components/PropertyCard";
import ConsultationModal from "../components/ConsultationModal";
import { config } from "../lib/config";
import { Property } from "../lib/types";
import api from "../lib/api";

const CATEGORIES = [
  { key: "COMMERCIAL", label: "상가", icon: Store },
  { key: "RESIDENTIAL", label: "아파트/주택", icon: Home },
  { key: "INDUSTRIAL", label: "공장/창고", icon: Factory },
  { key: "LAND", label: "토지", icon: Mountain },
];

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultOpen, setConsultOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactError, setContactError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await api.get("/properties");
        setProperties(res.data);
      } catch (err) {
        console.error("매물 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const getPropertiesByCategory = (categoryKey: string) => {
    return properties.filter((p) => p.category === categoryKey);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError("");
    try {
      await api.post("/consultations", {
        name: contactName,
        contact: contactPhone,
        message: contactMessage,
      });
      setContactSubmitted(true);
      setTimeout(() => {
        setContactSubmitted(false);
        setContactName("");
        setContactPhone("");
        setContactMessage("");
      }, 3000);
    } catch {
      setContactError("전송에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header onConsultationClick={() => setConsultOpen(true)} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden" style={{ background: 'var(--primary)' }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full" style={{ background: 'var(--accent)' }} />
            <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full" style={{ background: 'var(--accent)' }} />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-14 md:py-16 lg:py-20">
            <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium text-white" style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)' }}>
                  천안 지역 전문 부동산
                </div>
                <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                  천안에서 찾는<br />최적의 부동산 매물
                </h1>
                <p className="mb-8 max-w-lg text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  상가, 아파트, 주택, 공장, 창고, 토지까지. 풍부한 경험과 전문성으로 고객님께 최적의 매물을 제안합니다.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/properties"
                    className="flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold shadow-lg transition-all hover:opacity-90 no-underline"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    매물 둘러보기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setConsultOpen(true)}
                    className="flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold text-white transition-all bg-transparent cursor-pointer"
                    style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                  >
                    <Phone className="h-4 w-4" />
                    간편 상담
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                {[
                  { num: "500+", label: "누적 거래 건수" },
                  { num: "15년", label: "업계 경력" },
                  { num: `${properties.length}+`, label: "현재 매물 수" },
                  { num: "98%", label: "고객 만족도" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-1 rounded-xl px-6 py-5"
                    style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(4px)' }}
                  >
                    <span className="text-2xl font-bold text-white md:text-3xl">{stat.num}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Category Quick Nav */}
        <section style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const count = getPropertiesByCategory(cat.key).length;
                return (
                  <Link
                    key={cat.key}
                    href={`/properties?category=${cat.key}`}
                    className="group flex flex-col items-center gap-3 rounded-xl p-6 transition-all hover:shadow-md no-underline"
                    style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl transition-colors" style={{ background: 'rgba(30,58,95,0.05)', color: 'var(--primary)' }}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{cat.label}</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{count}개 매물</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-16" style={{ background: 'var(--background)' }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-2xl font-bold md:text-3xl" style={{ color: 'var(--foreground)' }}>
                왜 {config.company.name}인가요?
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                풍부한 경력의 전문가가 함께합니다
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: Shield, title: "신뢰할 수 있는 거래", desc: "투명한 정보 제공과 안전한 계약 프로세스로 고객님의 자산을 보호합니다." },
                { icon: Clock, title: "빠른 응대", desc: "문의 접수 후 1시간 이내 연락드립니다. 긴급 상담도 가능합니다." },
                { icon: Users, title: "맞춤형 서비스", desc: "고객님의 예산과 조건에 맞는 최적의 매물을 직접 선별하여 추천해드립니다." },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.title} className="flex flex-col items-start gap-4 rounded-xl p-8 transition-all hover:shadow-md" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(26,143,203,0.1)', color: 'var(--accent)' }}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold m-0" style={{ color: 'var(--foreground)' }}>{item.title}</h3>
                    <p className="text-sm leading-relaxed m-0" style={{ color: 'var(--muted-foreground)' }}>{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Category Sections with Properties */}
        {!loading && CATEGORIES.map((cat, idx) => {
          const catProperties = getPropertiesByCategory(cat.key);
          const isEven = idx % 2 === 0;
          return (
            <section key={cat.key} className="py-16" style={{ background: isEven ? 'var(--background)' : 'var(--card)' }}>
              <div className="mx-auto max-w-7xl px-6">
                <div className="mb-10 flex items-end justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1 rounded-full" style={{ background: 'var(--accent)' }} />
                      <h2 className="text-2xl font-bold md:text-3xl m-0" style={{ color: 'var(--foreground)' }}>{cat.label}</h2>
                    </div>
                    <p className="ml-4 text-sm m-0" style={{ color: 'var(--muted-foreground)' }}>
                      천안 지역 {cat.label} 매물
                    </p>
                  </div>
                  <Link
                    href={`/properties?category=${cat.key}`}
                    className="group flex items-center gap-1.5 text-sm font-medium transition-colors no-underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    더보기
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                {catProperties.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {catProperties.slice(0, 4).map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-xl py-16" style={{ border: '1px dashed var(--border)' }}>
                    <p className="text-sm m-0" style={{ color: 'var(--muted-foreground)' }}>등록된 매물이 없습니다.</p>
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {/* Loading State */}
        {loading && (
          <section className="py-20">
            <div className="mx-auto max-w-7xl px-6 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'var(--border)', borderTopColor: 'transparent' }} />
              <p className="mt-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>매물을 불러오고 있습니다...</p>
            </div>
          </section>
        )}

        {/* Contact / Consultation Section */}
        <section id="contact" className="py-20" style={{ background: 'var(--primary)' }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left Side */}
              <div>
                <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                  부동산 문의는<br />{config.company.name}에게 맡겨주세요
                </h2>
                <p className="mb-8 max-w-md" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  찾으시는 매물이 있거나 궁금한 점이 있으시면 언제든 문의해주세요. 전문 상담원이 친절하게 안내해드립니다.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <Phone className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <p className="text-xs m-0" style={{ color: 'rgba(255,255,255,0.5)' }}>전화 문의</p>
                      <a href={`tel:${config.company.phone}`} className="text-lg font-semibold text-white no-underline">
                        {config.company.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <MessageSquare className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <p className="text-xs m-0" style={{ color: 'rgba(255,255,255,0.5)' }}>영업시간</p>
                      <p className="text-sm font-medium text-white m-0">평일 09:00 ~ 18:00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="rounded-2xl p-8 shadow-2xl" style={{ background: 'var(--card)' }}>
                {contactSubmitted ? (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(34,197,94,0.1)' }}>
                      <CheckCircle className="h-8 w-8" style={{ color: '#22c55e' }} />
                    </div>
                    <h3 className="text-xl font-bold m-0" style={{ color: 'var(--foreground)' }}>문의 완료!</h3>
                    <p className="text-center text-sm m-0" style={{ color: 'var(--muted-foreground)' }}>
                      빠른 시일 내에 연락드리겠습니다.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="mb-6 text-xl font-bold" style={{ color: 'var(--foreground)' }}>간편 문의하기</h3>
                    {contactError && (
                      <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
                        {contactError}
                      </div>
                    )}
                    <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>이름</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="이름을 입력하세요"
                          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                          style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>연락처</label>
                        <input
                          type="tel"
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="010-0000-0000"
                          className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                          style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--foreground)' }}>문의내용</label>
                        <textarea
                          rows={4}
                          required
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          placeholder="찾으시는 매물이나 문의사항을 입력하세요"
                          className="w-full resize-none rounded-lg px-4 py-2.5 text-sm outline-none"
                          style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                        />
                      </div>
                      <button
                        type="submit"
                        className="mt-2 flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 cursor-pointer border-none"
                        style={{ background: 'var(--primary)' }}
                      >
                        <Send className="h-4 w-4" />
                        문의하기
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
    </div>
  );
}
