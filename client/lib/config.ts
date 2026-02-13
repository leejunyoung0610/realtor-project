/**
 * 애플리케이션 설정
 * 환경 변수에서 값을 가져오며, 기본값을 제공합니다.
 */

export const config = {
  // API 설정
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  
  // 회사 정보
  company: {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || "베리굿 부동산",
    representative: process.env.NEXT_PUBLIC_COMPANY_REPRESENTATIVE || "문수진",
    phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "010-7503-6000",
    phoneAlt: process.env.NEXT_PUBLIC_COMPANY_PHONE_ALT || "00000000000",
    address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "충청남도 천안시 청당동",
    registration: process.env.NEXT_PUBLIC_COMPANY_REGISTRATION || "0000-0000-0000",
    registrationDisplay: process.env.NEXT_PUBLIC_COMPANY_REGISTRATION_DISPLAY || "000-0000-0000",
  },

  // 앱 설정
  app: {
    title: "베리굿 부동산",
    description: "천안 지역 전문 부동산 중개",
    version: "1.0.0",
  },

  // 페이지네이션 설정
  pagination: {
    itemsPerPage: 12,
    itemsPerPageHome: 8,
  },

  // 이미지 설정
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    placeholder: '/placeholder-property.jpg',
  },
} as const;
