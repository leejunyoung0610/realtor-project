import Link from "next/link";
import { Property } from "../lib/types";
import { CategoryInfo } from "../lib/categories";
import PropertyCard from "./PropertyCard";

interface CategorySectionProps {
  category: CategoryInfo;
  properties: Property[];
}

export default function CategorySection({ category, properties }: CategorySectionProps) {
  if (properties.length === 0) {
    return null; // 해당 카테고리에 매물이 없으면 표시하지 않음
  }

  return (
    <div style={{ marginBottom: 60 }}>
      {/* 카테고리 헤더 */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 24 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 32 }}>{category.emoji}</span>
          <div>
            <h3 style={{ 
              fontSize: 24, 
              margin: 0, 
              color: category.color,
              fontWeight: 700
            }}>
              {category.name}
            </h3>
            <p style={{ 
              fontSize: 14, 
              color: "#666", 
              margin: 0,
              marginTop: 4
            }}>
              {category.description}
            </p>
          </div>
        </div>
        
        {/* 매물 더보기 버튼 */}
        <Link
          href={`/properties?category=${category.key}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            backgroundColor: category.color,
            color: "white",
            textDecoration: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          매물 더보기 →
        </Link>
      </div>

      {/* 매물 그리드 */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "flex-start"
        }}
      >
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </div>
  );
}

