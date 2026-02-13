import { Property } from "../lib/types";
import { getPriceDisplay, formatPrice } from "../lib/priceUtils";

interface PriceDisplayProps {
  property: Property;
  size?: "small" | "medium" | "large" | "sm" | "md" | "lg";
  variant?: "compact" | "full";
}

export default function PriceDisplay({ property, size = "medium", variant = "compact" }: PriceDisplayProps) {
  const priceData = getPriceDisplay(property);

  const sizeMap: Record<string, string> = {
    small: "text-sm font-bold",
    sm: "text-sm font-bold",
    medium: "text-base font-bold",
    md: "text-lg font-bold",
    large: "text-2xl font-bold",
    lg: "text-3xl font-bold",
  };

  const sizeClass = sizeMap[size] || sizeMap["medium"];

  return (
    <div className="flex flex-col gap-0.5">
      {priceData.primary && (
        <p className={`${sizeClass} m-0`} style={{ color: 'var(--primary)' }}>
          {variant === "full" ? `${priceData.primary.label} ` : ""}{formatPrice(priceData.primary.value)}
        </p>
      )}
      {priceData.secondary && (
        <p className="text-sm font-semibold m-0" style={{ color: 'var(--accent)' }}>
          {variant === "full" ? `${priceData.secondary.label} ` : ""}{formatPrice(priceData.secondary.value)}
        </p>
      )}
    </div>
  );
}
