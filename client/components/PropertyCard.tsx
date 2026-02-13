"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Property } from "../lib/types";
import { getPriceDisplay, formatPrice } from "../lib/priceUtils";
import DealTypeBadge from "./DealTypeBadge";
import { API_BASE_URL } from "../lib/api";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const priceData = getPriceDisplay(property);
  const imageUrl = property.main_image
    ? `${API_BASE_URL}${property.main_image}`
    : property.image_url
    ? `${API_BASE_URL}${property.image_url}`
    : null;

  return (
    <Link href={`/properties/${property.id}`} className="group block no-underline">
      <article
        className="overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          transform: 'translateY(0)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        {/* Image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: 'var(--muted)' }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={property.type}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--muted)' }}>
              <div className="flex flex-col items-center gap-2 opacity-40">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
                <span className="text-xs">{property.type}</span>
              </div>
            </div>
          )}

          {/* Sold overlay */}
          {property.status === "거래완료" && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <span className="rounded-lg px-4 py-2 text-sm font-bold shadow-lg" style={{ background: 'var(--card)', color: 'var(--foreground)' }}>
                거래완료
              </span>
            </div>
          )}

          {/* Deal type badge */}
          {property.deal_type && (
            <div className="absolute left-3 top-3">
              <DealTypeBadge dealType={property.deal_type} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <span className="line-clamp-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {property.address}
            </span>
          </div>
          <h3 className="line-clamp-1 text-base font-semibold m-0 transition-colors" style={{ color: 'var(--foreground)' }}>
            {property.type}
          </h3>
          {priceData.primary && (
            <p className="text-lg font-bold m-0" style={{ color: 'var(--primary)' }}>
              {priceData.primary.label} {formatPrice(priceData.primary.value)}
            </p>
          )}
          {priceData.secondary && (
            <p className="text-sm font-semibold m-0" style={{ color: 'var(--accent)' }}>
              {priceData.secondary.label} {formatPrice(priceData.secondary.value)}
            </p>
          )}
          {property.area && (
            <p className="text-xs m-0" style={{ color: 'var(--muted-foreground)' }}>
              {(property.area / 3.3058).toFixed(0)}평 ({property.area}m²)
              {property.floor_info ? ` | ${property.floor_info}` : ''}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
