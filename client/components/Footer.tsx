import Link from "next/link";
import { Building2, Phone, MapPin, Clock } from "lucide-react";
import { config } from "../lib/config";

export default function Footer() {
  return (
    <footer className="border-t" style={{ background: 'var(--foreground)', color: 'var(--background)', borderColor: 'var(--border)' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Company Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--accent)' }}>
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold m-0">{config.company.name}</p>
                <p className="text-xs opacity-60 m-0">천안 지역 전문 부동산</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed opacity-60 m-0">
              천안 지역의 다양한 매물을 전문적으로 중개합니다. 상가, 아파트, 주택, 공장, 창고, 토지 등 고객님의 요구에 맞는 최적의 매물을 찾아드립니다.
            </p>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider opacity-40 m-0">연락처</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="text-sm opacity-70">{config.company.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <a href={`tel:${config.company.phone}`} className="text-sm opacity-70 transition-opacity hover:opacity-100 no-underline" style={{ color: 'inherit' }}>
                  {config.company.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="text-sm opacity-70">평일 09:00 ~ 18:00</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider opacity-40 m-0">바로가기</h3>
            <nav className="flex flex-col gap-2.5">
              <Link href="/properties" className="text-sm opacity-70 transition-opacity hover:opacity-100 no-underline" style={{ color: 'inherit' }}>전체 매물</Link>
              <Link href="/properties?category=COMMERCIAL" className="text-sm opacity-70 transition-opacity hover:opacity-100 no-underline" style={{ color: 'inherit' }}>상가</Link>
              <Link href="/properties?category=RESIDENTIAL" className="text-sm opacity-70 transition-opacity hover:opacity-100 no-underline" style={{ color: 'inherit' }}>아파트/주택</Link>
              <Link href="/properties?category=INDUSTRIAL" className="text-sm opacity-70 transition-opacity hover:opacity-100 no-underline" style={{ color: 'inherit' }}>공장/창고</Link>
              <Link href="/properties?category=LAND" className="text-sm opacity-70 transition-opacity hover:opacity-100 no-underline" style={{ color: 'inherit' }}>토지</Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t pt-8" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row text-xs opacity-40">
            <div>대표: {config.company.representative} | 등록번호: {config.company.registrationDisplay}</div>
            <div>&copy; {new Date().getFullYear()} {config.company.name}. All rights reserved.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
