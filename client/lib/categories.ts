export interface CategoryInfo {
  key: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    key: "RESIDENTIAL",
    name: "아파트·주택",
    emoji: "🏠",
    color: "#3498db",
    description: "아파트, 오피스텔, 원룸, 투룸, 빌라",
  },
  {
    key: "COMMERCIAL",
    name: "상가",
    emoji: "🏪",
    color: "#e67e22",
    description: "상가, 사무실",
  },
  {
    key: "INDUSTRIAL",
    name: "공장·창고",
    emoji: "🏭",
    color: "#95a5a6",
    description: "공장, 창고",
  },
  {
    key: "LAND",
    name: "토지",
    emoji: "🌍",
    color: "#27ae60",
    description: "토지",
  },
];
