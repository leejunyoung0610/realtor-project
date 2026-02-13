"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Menu, X, Phone } from "lucide-react";
import { config } from "../lib/config";

interface HeaderProps {
  onConsultationClick?: () => void;
}

export default function Header({ onConsultationClick }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--primary)' }}>
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
              {config.company.name}
            </span>
            <span className="text-xs leading-tight" style={{ color: 'var(--muted-foreground)' }}>
              천안 지역 전문
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/properties" className="text-sm font-medium transition-colors hover:opacity-80 no-underline" style={{ color: 'var(--muted-foreground)' }}>
            매물보기
          </Link>
          <Link href="/#contact" className="text-sm font-medium transition-colors hover:opacity-80 no-underline" style={{ color: 'var(--muted-foreground)' }}>
            문의하기
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <a href={`tel:${config.company.phone}`} className="flex items-center gap-2 text-sm font-medium transition-colors no-underline" style={{ color: 'var(--muted-foreground)' }}>
            <Phone className="h-4 w-4" />
            {config.company.phone}
          </a>
          <button
            onClick={onConsultationClick}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 cursor-pointer border-none"
            style={{ background: 'var(--primary)' }}
          >
            간편상담
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden bg-transparent border-none cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t bg-white px-6 pb-6 pt-4 md:hidden" style={{ borderColor: 'var(--border)' }}>
          <nav className="flex flex-col gap-4">
            <Link href="/properties" className="text-sm font-medium no-underline" style={{ color: 'var(--foreground)' }} onClick={() => setMobileOpen(false)}>
              매물보기
            </Link>
            <Link href="/#contact" className="text-sm font-medium no-underline" style={{ color: 'var(--foreground)' }} onClick={() => setMobileOpen(false)}>
              문의하기
            </Link>
            <a href={`tel:${config.company.phone}`} className="flex items-center gap-2 text-sm font-medium no-underline" style={{ color: 'var(--foreground)' }}>
              <Phone className="h-4 w-4" />
              {config.company.phone}
            </a>
            <button
              onClick={() => { setMobileOpen(false); onConsultationClick?.(); }}
              className="w-full rounded-lg px-5 py-2.5 text-sm font-semibold text-white cursor-pointer border-none"
              style={{ background: 'var(--primary)' }}
            >
              간편상담
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
