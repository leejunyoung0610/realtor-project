import { Property } from "./types";

export interface PriceDisplayData {
  primary: {
    label: string;
    value: number;
  } | null;
  secondary: {
    label: string;
    value: number;
  } | null;
}

/**
 * 거래유형별 가격 표시 로직 (도메인 규칙 기반)
 * 
 * 책임 분리 원칙:
 * - 프론트엔드는 해석하지 않고, 거래유형별로만 표시
 * - 값의 존재 여부가 아닌, 도메인 규칙에 따른 표시
 * 
 * 도메인 규칙 (DB 정리 완료됨):
 * - 매매: price (매매가)만 의미있음, deposit=NULL, monthly_rent=NULL
 * - 전세: price (전세금)만 의미있음, monthly_rent=NULL
 * - 월세: deposit (보증금) + monthly_rent (월세)만 의미있음, price=NULL
 * 
 * @param property - 매물 정보
 * @returns 표시할 가격 정보
 */
export function getPriceDisplay(property: Property): PriceDisplayData {
  // 거래유형에 따라 표시할 가격 정보 결정 (deal_type 기준)
  switch (property.deal_type) {
    case "매매":
      return {
        primary: {
          label: "매매가",
          value: property.price || 0
        },
        secondary: null
      };
    
    case "전세":
      return {
        primary: {
          label: "전세금",
          value: property.price || 0  // 전세금은 price 필드에 저장됨
        },
        secondary: null
      };
    
    case "월세":
      return {
        primary: {
          label: "보증금",
          value: property.deposit || 0
        },
        secondary: {
          label: "월세",
          value: property.monthly_rent || 0
        }
      };
    
    default:
      // 알 수 없는 거래유형의 경우 기본 처리
      return {
        primary: {
          label: property.deal_type || "가격",
          value: property.price || 0
        },
        secondary: null
      };
  }
}

/**
 * 가격을 한국식 표기법으로 포맷 (억, 만원 단위)
 * @param value - 가격 값
 * @returns 포맷된 가격 문자열 (예: "30억원", "1000만원", "700만원")
 */
export function formatPrice(value: number): string {
  if (value === 0) return "0원";
  
  const eok = Math.floor(value / 100000000);  // 억 (100,000,000)
  const man = Math.floor((value % 100000000) / 10000);  // 만 (10,000)
  const remainder = value % 10000;  // 만원 미만

  let result = "";
  
  // 억 단위
  if (eok > 0) {
    result += `${eok}억`;
  }
  
  // 만 단위
  if (man > 0) {
    if (result) result += " ";
    result += `${man}만`;
  }
  
  // 만원 미만 (천원 단위까지)
  if (remainder > 0) {
    if (result) {
      // 다른 단위가 있으면 원 붙이기
      result += "원";
    } else {
      // 만원 미만만 있는 경우
      result = `${remainder.toLocaleString()}원`;
    }
  } else {
    // 나머지가 0이면 원 붙이기
    result += "원";
  }
  
  return result;
}

/**
 * 간단한 가격 포맷 (formatPrice와 동일하게 처리)
 * @param value - 가격 값
 * @returns 포맷된 가격 문자열
 */
export function formatPriceSimple(value: number): string {
  return formatPrice(value);
}
