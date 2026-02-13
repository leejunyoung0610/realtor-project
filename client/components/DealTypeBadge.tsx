interface DealTypeBadgeProps {
  dealType: string;
  size?: "small" | "medium" | "large";
}

const dealTypeStyles: Record<string, { bg: string; text: string }> = {
  "매매": { bg: "rgba(30,58,95,0.1)", text: "var(--primary)" },
  "전세": { bg: "rgba(26,143,203,0.1)", text: "var(--accent)" },
  "월세": { bg: "rgba(34,197,94,0.1)", text: "#16a34a" },
};

export default function DealTypeBadge({ dealType, size = "small" }: DealTypeBadgeProps) {
  const style = dealTypeStyles[dealType] || dealTypeStyles["매매"];

  const sizeClasses = {
    small: "px-2 py-0.5 text-xs",
    medium: "px-2.5 py-1 text-xs",
    large: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold ${sizeClasses[size]}`}
      style={{ background: style.bg, color: style.text }}
    >
      {dealType}
    </span>
  );
}
