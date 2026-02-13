export interface Property {
  id: number;
  realtor_id: number;
  type: string;
  category?: string; // category 필드 추가
  price: number;
  deposit: number | null;
  monthly_rent: number | null;
  area: number | null;
  rooms: number | null;
  bathrooms: number | null;
  sido: string | null;
  sigungu: string | null;
  dong: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string | null;
  status: string;
  created_at: string;
  main_image?: string | null;
  is_featured?: boolean;
  image_url: string;
  is_main: boolean;
  
  // 새로운 상세 정보 필드들
  maintenance_fee?: number | null;
  direction?: string | null;
  floor_info?: string | null;
  usage_type?: string | null;
  parking?: string | null;
  elevator?: boolean | null;
  move_in_date?: string | null;
  deal_type?: string | null;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  is_main: boolean;
  created_at: string;
}

export interface Inquiry {
  id: number;
  property_id: number;
  contact: string;
  message: string;
  is_read?: boolean;
  created_at: string;
}

export interface Consultation {
  id: number;
  name: string;
  contact: string;
  message: string;
  is_read?: boolean;
  created_at: string;
}


