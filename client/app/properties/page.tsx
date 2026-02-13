"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, LayoutGrid } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PropertyCard from "../../components/PropertyCard";
import ConsultationModal from "../../components/ConsultationModal";
import { Property } from "../../lib/types";
import api from "../../lib/api";

const CATEGORIES = [
  { key: "ALL", label: "전체" },
  { key: "COMMERCIAL", label: "상가" },
  { key: "RESIDENTIAL", label: "아파트/주택" },
  { key: "INDUSTRIAL", label: "공장/창고" },
  { key: "LAND", label: "토지" },
];

const DEAL_TYPES = ["매매", "전세", "월세"];

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ color: 'var(--muted-foreground)' }}>
          로딩 중...
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}

function PropertiesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "ALL";

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeDealType, setActiveDealType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [consultOpen, setConsultOpen] = useState(false);

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

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (activeCategory !== "ALL" && p.category !== activeCategory) return false;
      if (activeDealType !== "ALL" && p.deal_type !== activeDealType) return false;
      if (searchQuery && !p.type.includes(searchQuery) && !p.address.includes(searchQuery)) return false;
      return true;
    });
  }, [properties, activeCategory, activeDealType, searchQuery]);

  const activeCount = filteredProperties.length;
  const soldCount = filteredProperties.filter((p) => p.status === "거래완료").length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header onConsultationClick={() => setConsultOpen(true)} />

      <main className="flex-1" style={{ background: 'var(--background)' }}>
        {/* Page Header */}
        <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <LayoutGrid className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                <h1 className="text-3xl font-bold m-0" style={{ color: 'var(--foreground)' }}>매물 목록</h1>
              </div>
              <p className="text-sm m-0" style={{ color: 'var(--muted-foreground)' }}>
                총 {activeCount}개 매물
                {soldCount > 0 && ` (거래완료 ${soldCount}건 포함)`}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-[73px] z-40" style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer border-none"
                    style={
                      activeCategory === cat.key
                        ? { background: 'var(--primary)', color: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                        : { background: 'var(--muted)', color: 'var(--foreground)' }
                    }
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search & Deal Type */}
              <div className="flex items-center gap-3">
                {/* Deal Type Filter */}
                <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setActiveDealType("ALL")}
                    className="rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer border-none"
                    style={
                      activeDealType === "ALL"
                        ? { background: 'var(--primary)', color: 'white' }
                        : { background: 'transparent', color: 'var(--muted-foreground)' }
                    }
                  >
                    전체
                  </button>
                  {DEAL_TYPES.map((dt) => (
                    <button
                      key={dt}
                      onClick={() => setActiveDealType(dt)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer border-none"
                      style={
                        activeDealType === dt
                          ? { background: 'var(--primary)', color: 'white' }
                          : { background: 'transparent', color: 'var(--muted-foreground)' }
                      }
                    >
                      {dt}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="주소/매물명 검색"
                    className="w-48 rounded-lg py-2 pl-9 pr-4 text-sm outline-none md:w-56"
                    style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Grid */}
        <div className="mx-auto max-w-7xl px-6 py-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'var(--border)', borderTopColor: 'transparent' }} />
              <p className="mt-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>매물을 불러오고 있습니다...</p>
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl py-24" style={{ border: '1px dashed var(--border)' }}>
              <SlidersHorizontal className="h-10 w-10 opacity-40" style={{ color: 'var(--muted-foreground)' }} />
              <div className="text-center">
                <p className="text-lg font-semibold m-0" style={{ color: 'var(--foreground)' }}>검색 결과가 없습니다</p>
                <p className="mt-1 text-sm m-0" style={{ color: 'var(--muted-foreground)' }}>
                  필터 조건을 변경하거나 검색어를 수정해보세요.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveCategory("ALL");
                  setActiveDealType("ALL");
                  setSearchQuery("");
                }}
                className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors cursor-pointer border-none"
                style={{ background: 'var(--primary)' }}
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <ConsultationModal isOpen={consultOpen} onClose={() => setConsultOpen(false)} />
    </div>
  );
}
