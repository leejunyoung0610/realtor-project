"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../lib/api";
import { Property, Inquiry, Consultation } from "../../lib/types";
import DealTypeBadge from "../../components/DealTypeBadge";
import PriceDisplay from "../../components/PriceDisplay";
import InquiryModal from "../../components/InquiryModal";
import ConsultationModal from "../../components/ConsultationModal";

// 카테고리 정보 타입
interface CategoryInfo {
  key: string;
  name: string;
  emoji: string;
  color: string;
}

// 카테고리 목록
const CATEGORIES: CategoryInfo[] = [
  {
    key: "COMMERCIAL",
    name: "상가",
    emoji: "🏪",
    color: "#e67e22"
  },
  {
    key: "RESIDENTIAL",
    name: "아파트·주택",
    emoji: "🏠",
    color: "#3498db"
  },
  {
    key: "INDUSTRIAL",
    name: "공장·창고",
    emoji: "🏭",
    color: "#95a5a6"
  },
  {
    key: "LAND",
    name: "토지",
    emoji: "🌍",
    color: "#27ae60"
  }
];

export default function AdminHome() {
  const [propertiesByCategory, setPropertiesByCategory] = useState<{[key: string]: Property[]}>({});
  const [inquiryCounts, setInquiryCounts] = useState<{[key: number]: number}>({});
  const [unreadCounts, setUnreadCounts] = useState<{[key: number]: number}>({});
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isInquiryListOpen, setIsInquiryListOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  
  // 상담 문의 관련 상태
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultationCounts, setConsultationCounts] = useState<{count: number, unreadCount: number}>({count: 0, unreadCount: 0});
  const [isConsultationListOpen, setIsConsultationListOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

  useEffect(() => {
    // 각 카테고리별로 매물 데이터 가져오기
    const fetchPropertiesByCategory = async () => {
      const categoryData: {[key: string]: Property[]} = {};
      
      for (const category of CATEGORIES) {
        try {
          const response = await api.get<Property[]>(`/properties/category/${category.key}`);
          categoryData[category.key] = response.data;
        } catch (error) {
          console.error(`${category.name} 카테고리 데이터 로딩 실패:`, error);
          categoryData[category.key] = [];
        }
      }
      
      // 카테고리 없는 매물도 가져오기
      try {
        const allResponse = await api.get<Property[]>("/properties");
        const uncategorized = allResponse.data.filter(
          (p: Property) => !CATEGORIES.some(cat => cat.key === p.category)
        );
        if (uncategorized.length > 0) {
          categoryData["OTHER"] = uncategorized;
        }
      } catch (error) {
        console.error("전체 매물 데이터 로딩 실패:", error);
      }
      
      setPropertiesByCategory(categoryData);
      
      // 각 매물별 문의 개수 가져오기
      const counts: {[key: number]: number} = {};
      const unreadCountsData: {[key: number]: number} = {};
      for (const category of Object.keys(categoryData)) {
        for (const property of categoryData[category]) {
          try {
            const countResponse = await api.get<{count: number, unreadCount: number}>(`/inquiries/property/${property.id}/count`);
            counts[property.id] = countResponse.data.count;
            unreadCountsData[property.id] = countResponse.data.unreadCount || 0;
          } catch (error) {
            console.error(`매물 ${property.id} 문의 개수 조회 실패:`, error);
            counts[property.id] = 0;
            unreadCountsData[property.id] = 0;
          }
        }
      }
      setInquiryCounts(counts);
      setUnreadCounts(unreadCountsData);
      
      // 상담 문의 개수도 가져오기
      try {
        const consultationResponse = await api.get<{count: number, unreadCount: number}>("/consultations/count");
        setConsultationCounts(consultationResponse.data);
      } catch (error) {
        console.error("상담 문의 개수 조회 실패:", error);
      }
    };

    fetchPropertiesByCategory();
  }, []);

  const refreshProperties = async () => {
    const categoryData: {[key: string]: Property[]} = {};
    
    for (const category of CATEGORIES) {
      try {
        const response = await api.get<Property[]>(`/properties/category/${category.key}`);
        categoryData[category.key] = response.data;
      } catch (error) {
        console.error(`${category.name} 카테고리 데이터 로딩 실패:`, error);
        categoryData[category.key] = [];
      }
    }
    
    // 카테고리 없는 매물도 가져오기
    try {
      const allResponse = await api.get<Property[]>("/properties");
      const uncategorized = allResponse.data.filter(
        (p: Property) => !CATEGORIES.some(cat => cat.key === p.category)
      );
      if (uncategorized.length > 0) {
        categoryData["OTHER"] = uncategorized;
      }
    } catch (error) {
      console.error("전체 매물 데이터 로딩 실패:", error);
    }
    
    setPropertiesByCategory(categoryData);
    
    // 문의 개수도 새로고침
    const counts: {[key: number]: number} = {};
    const unreadCountsData: {[key: number]: number} = {};
    for (const category of Object.keys(categoryData)) {
      for (const property of categoryData[category]) {
        try {
          const countResponse = await api.get<{count: number, unreadCount: number}>(`/inquiries/property/${property.id}/count`);
          counts[property.id] = countResponse.data.count;
          unreadCountsData[property.id] = countResponse.data.unreadCount || 0;
        } catch (error) {
          counts[property.id] = 0;
          unreadCountsData[property.id] = 0;
        }
      }
    }
    setInquiryCounts(counts);
    setUnreadCounts(unreadCountsData);
    
    // 상담 문의 개수도 가져오기
    try {
      const consultationResponse = await api.get<{count: number, unreadCount: number}>("/consultations/count");
      setConsultationCounts(consultationResponse.data);
    } catch (error) {
      console.error("상담 문의 개수 조회 실패:", error);
    }
  };

  const handleViewInquiries = async (propertyId: number) => {
    try {
      const response = await api.get<Inquiry[]>(`/inquiries/property/${propertyId}`);
      setInquiries(response.data);
      setSelectedPropertyId(propertyId);
      setIsInquiryListOpen(true);
    } catch (error) {
      console.error("문의 목록 조회 실패:", error);
      alert("문의 목록을 불러오는데 실패했습니다.");
    }
  };

  const handleViewInquiryDetail = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsInquiryModalOpen(true);
    
    // 문의를 읽음 처리
    if (!inquiry.is_read) {
      try {
        await api.patch(`/inquiries/${inquiry.id}/read`, { is_read: true });
        // 문의 목록 업데이트
        setInquiries(prev => prev.map(i => 
          i.id === inquiry.id ? { ...i, is_read: true } : i
        ));
        // 안읽은 개수 새로고침
        if (selectedPropertyId) {
          const countResponse = await api.get<{count: number, unreadCount: number}>(`/inquiries/property/${selectedPropertyId}/count`);
          setUnreadCounts(prev => ({
            ...prev,
            [selectedPropertyId]: countResponse.data.unreadCount || 0
          }));
        }
      } catch (error) {
        console.error("문의 읽음 처리 실패:", error);
      }
    }
  };

  const handleDeleteInquiry = async (inquiryId: number, propertyId: number) => {
    if (!confirm("이 문의를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await api.delete(`/inquiries/${inquiryId}`);
      alert("문의가 삭제되었습니다.");
      
      // 문의 목록에서 제거
      setInquiries(prev => prev.filter(i => i.id !== inquiryId));
      
      // 문의 개수 새로고침
      const countResponse = await api.get<{count: number, unreadCount: number}>(`/inquiries/property/${propertyId}/count`);
      setInquiryCounts(prev => ({
        ...prev,
        [propertyId]: countResponse.data.count
      }));
      setUnreadCounts(prev => ({
        ...prev,
        [propertyId]: countResponse.data.unreadCount || 0
      }));
    } catch (error) {
      console.error("문의 삭제 실패:", error);
      alert("문의 삭제에 실패했습니다.");
    }
  };

  const handleViewConsultations = async () => {
    try {
      const response = await api.get<Consultation[]>("/consultations");
      setConsultations(response.data);
      setIsConsultationListOpen(true);
    } catch (error) {
      console.error("상담 문의 목록 조회 실패:", error);
      alert("상담 문의 목록을 불러오는데 실패했습니다.");
    }
  };

  const handleViewConsultationDetail = async (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsConsultationModalOpen(true);
    
    // 읽지 않은 상담 문의면 읽음 처리
    if (!consultation.is_read) {
      try {
        await api.patch(`/consultations/${consultation.id}/read`, { is_read: true });
        setConsultations(prev => prev.map(c => 
          c.id === consultation.id ? { ...c, is_read: true } : c
        ));
        // 개수 새로고침
        const countResponse = await api.get<{count: number, unreadCount: number}>("/consultations/count");
        setConsultationCounts(countResponse.data);
      } catch (error) {
        console.error("상담 문의 읽음 처리 실패:", error);
      }
    }
  };

  const handleDeleteConsultation = async (consultationId: number) => {
    if (!confirm("이 상담 문의를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await api.delete(`/consultations/${consultationId}`);
      alert("상담 문의가 삭제되었습니다.");
      
      // 상담 문의 목록에서 제거
      setConsultations(prev => prev.filter(c => c.id !== consultationId));
      
      // 개수 새로고침
      const countResponse = await api.get<{count: number, unreadCount: number}>("/consultations/count");
      setConsultationCounts(countResponse.data);
    } catch (error) {
      console.error("상담 문의 삭제 실패:", error);
      alert("상담 문의 삭제에 실패했습니다.");
    }
  };

  const deleteProperty = async (propertyId: number, address: string) => {
    if (!confirm(`"${address}" 매물을 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.\n- 매물 정보가 삭제됩니다\n- 연결된 모든 이미지가 삭제됩니다`)) {
      return;
    }

    try {
      await api.delete(`/properties/${propertyId}`);
      alert("매물이 성공적으로 삭제되었습니다.");
      
      // 매물 목록 새로고침
      refreshProperties();
    } catch (error) {
      console.error("매물 삭제 실패:", error);
      alert("매물 삭제에 실패했습니다.");
    }
  };

  const toggleFeatured = async (propertyId: number, currentFeatured: boolean, address: string) => {
    const action = currentFeatured ? "해제" : "설정";
    if (!confirm(`"${address}" 매물을 추천매물에서 ${action}하시겠습니까?`)) {
      return;
    }

    try {
      await api.patch(`/properties/${propertyId}/featured`, {
        is_featured: !currentFeatured
      });
      
      alert(`추천매물 ${action}이 완료되었습니다.`);
      
      // 매물 목록 새로고침
      refreshProperties();
    } catch (error: unknown) {
      console.error("추천매물 설정 실패:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: { error: string } } };
        if (axiosError.response?.data?.error) {
          alert(axiosError.response.data.error);
        } else {
          alert("추천매물 설정에 실패했습니다.");
        }
      } else {
        alert("추천매물 설정에 실패했습니다.");
      }
    }
  };

  return (
    <div style={{ 
      background: "#f8f9fa", 
      minHeight: "100vh", 
      color: "#333" 
    }}>
      <div style={{ 
        maxWidth: 1000, 
        margin: "0 auto", 
        padding: 20 
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: 30,
          marginBottom: 20
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
            <div>
              <h1 style={{ 
                fontSize: 32, 
                color: "#2c3e50", 
                marginBottom: 5,
                borderBottom: "3px solid #5ba1b1",
                paddingBottom: 10,
                display: "inline-block"
              }}>
                🏢 매물 관리 (관리자)
              </h1>
              <p style={{ color: "#666", fontSize: 16, margin: 0 }}>
                전체 {Object.values(propertiesByCategory).reduce((sum, props) => sum + props.length, 0)}개의 매물이 등록되어 있습니다
              </p>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {/* 상담 문의 버튼 */}
              <button
                onClick={handleViewConsultations}
                style={{
                  padding: "12px 20px",
                  background: consultationCounts.unreadCount > 0
                    ? "linear-gradient(135deg, #dc3545, #c82333)"
                    : "linear-gradient(135deg, #17a2b8, #138496)",
                  color: "#fff",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: consultationCounts.unreadCount > 0
                    ? "0 3px 10px rgba(220,53,69,0.3)"
                    : "0 3px 10px rgba(23,162,184,0.3)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                💬 상담 문의
                {consultationCounts.count > 0 && (
                  <span style={{
                    background: "rgba(255,255,255,0.3)",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {consultationCounts.count}
                  </span>
                )}
                {consultationCounts.unreadCount > 0 && (
                  <span style={{
                    background: "rgba(255,255,255,0.3)",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    🔴 {consultationCounts.unreadCount}
                  </span>
                )}
              </button>

              {/* 매물 등록 버튼 */}
              <Link href="/admin/properties/new">
                <button
                  style={{
                    padding: "12px 20px",
                    background: "linear-gradient(135deg, #28a745, #218838)",
                    color: "#fff",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                    boxShadow: "0 3px 10px rgba(40,167,69,0.3)",
                    transition: "all 0.3s ease"
                  }}
                >
                  ➕ 매물 등록
                </button>
              </Link>
            </div>
          </div>

          {/* 매물 없을 때 */}
          {Object.values(propertiesByCategory).reduce((sum, props) => sum + props.length, 0) === 0 ? (
            <div style={{ 
              textAlign: "center" as const,
              padding: 60,
              background: "#f8f9fa",
              borderRadius: 12,
              border: "1px solid #e9ecef"
            }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🏠</div>
              <h3 style={{ color: "#6c757d", marginBottom: 10, fontSize: 20 }}>
                등록된 매물이 없습니다
              </h3>
              <p style={{ color: "#6c757d", margin: 0 }}>
                첫 번째 매물을 등록해보세요!
              </p>
            </div>
          ) : (
            /* 카테고리별 매물 리스트 */
            <div style={{ marginTop: 10 }}>
              {CATEGORIES.map((category) => {
                const properties = propertiesByCategory[category.key] || [];
                if (properties.length === 0) return null;

                return (
                  <div key={category.key} style={{ marginBottom: 40 }}>
                    {/* 카테고리 헤더 */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 20,
                      paddingBottom: 12,
                      borderBottom: `3px solid ${category.color}`
                    }}>
                      <span style={{ fontSize: 28 }}>{category.emoji}</span>
                      <h2 style={{
                        fontSize: 22,
                        color: category.color,
                        margin: 0,
                        fontWeight: 700
                      }}>
                        {category.name}
                      </h2>
                      <span style={{
                        background: category.color,
                        color: "#fff",
                        padding: "4px 12px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        {properties.length}개
                      </span>
                    </div>

                    {/* 매물 리스트 */}
                    <div style={{ 
                      display: "grid", 
                      gap: 15 
                    }}>
                      {properties.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: 20,
                            background: "#fff",
                            border: "1px solid #e9ecef",
                            borderRadius: 12,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            transition: "all 0.2s ease"
                          }}
                        >
                          {/* 왼쪽: 매물 정보 */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
                              <span style={{ 
                                background: p.status === "거래중" 
                                  ? "linear-gradient(135deg, #28a745, #218838)" 
                                  : "linear-gradient(135deg, #6c757d, #5a6268)",
                                color: "#fff", 
                                padding: "4px 12px", 
                                borderRadius: 20, 
                                fontSize: 12,
                                fontWeight: 600
                              }}>
                                {p.status === "거래중" ? "🟢" : "⚪"} {p.status}
                              </span>
                              
                              {/* 거래유형 배지 */}
                              <DealTypeBadge 
                                dealType={p.deal_type || ""} 
                                size="medium"
                              />
                              
                              {p.is_featured && (
                                <span style={{
                                  background: "linear-gradient(135deg, #ff9f43, #ee5a24)",
                                  color: "#fff",
                                  padding: "4px 10px",
                                  borderRadius: 12,
                                  fontSize: 11,
                                  fontWeight: 600
                                }}>
                                  ⭐ 추천
                                </span>
                              )}
                              
                              <strong style={{ 
                                fontSize: 18, 
                                color: "#2c3e50" 
                              }}>
                                {p.address}
                              </strong>
                            </div>
                            
                            {/* 가격 표시 */}
                            <div style={{ 
                              color: "#5ba1b1", 
                              fontSize: 16,
                              fontWeight: 600,
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                              marginTop: 4
                            }}>
                              <PriceDisplay 
                                property={p} 
                                variant="full"
                                size="medium"
                              />
                            </div>
                            <div style={{ 
                              color: "#666", 
                              fontSize: 14,
                              marginTop: 4,
                              display: "flex",
                              alignItems: "center",
                              gap: 8
                            }}>
                              <span>📍 {p.type} | {p.deal_type} | ID: {p.id}</span>
                              {inquiryCounts[p.id] > 0 && (
                                <button
                                  onClick={() => handleViewInquiries(p.id)}
                                  style={{
                                    padding: "4px 10px",
                                    background: unreadCounts[p.id] > 0
                                      ? "linear-gradient(135deg, #dc3545, #c82333)"
                                      : "linear-gradient(135deg, #007bff, #0056b3)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 12,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    boxShadow: unreadCounts[p.id] > 0 ? "0 2px 4px rgba(220,53,69,0.3)" : "none"
                                  }}
                                >
                                  📧 문의 {inquiryCounts[p.id]}건
                                  {unreadCounts[p.id] > 0 && (
                                    <span style={{
                                      background: "rgba(255,255,255,0.3)",
                                      padding: "2px 6px",
                                      borderRadius: 8,
                                      fontSize: 10
                                    }}>
                                      🔴 {unreadCounts[p.id]}
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 오른쪽: 액션 버튼 */}
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Link href={`/admin/properties/${p.id}`}>
                              <button style={{
                                padding: "10px 16px",
                                border: "none",
                                borderRadius: 8,
                                background: "linear-gradient(135deg, #5ba1b1, #4a8a99)",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 600,
                                boxShadow: "0 2px 6px rgba(91,161,177,0.3)",
                                transition: "all 0.2s ease"
                              }}>
                                ✏️ 수정
                              </button>
                            </Link>

                            <button
                              style={{
                                padding: "10px 16px",
                                border: "none",
                                borderRadius: 8,
                                background: p.is_featured
                                  ? "linear-gradient(135deg, #ff6b6b, #ee5a52)"
                                  : "linear-gradient(135deg, #ff9f43, #ee5a24)",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 600,
                                boxShadow: p.is_featured
                                  ? "0 2px 6px rgba(255,107,107,0.3)"
                                  : "0 2px 6px rgba(255,159,67,0.3)",
                                transition: "all 0.2s ease"
                              }}
                              onClick={() => toggleFeatured(p.id, p.is_featured || false, p.address)}
                            >
                              {p.is_featured ? "⭐ 해제" : "⭐ 추천"}
                            </button>

                            <button
                              style={{
                                padding: "10px 16px",
                                border: "none",
                                borderRadius: 8,
                                background: p.status === "거래중"
                                  ? "linear-gradient(135deg, #ffc107, #e0a800)"
                                  : "linear-gradient(135deg, #28a745, #218838)",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 600,
                                boxShadow: p.status === "거래중"
                                  ? "0 2px 6px rgba(255,193,7,0.3)"
                                  : "0 2px 6px rgba(40,167,69,0.3)",
                                transition: "all 0.2s ease"
                              }}
                              onClick={() =>
                                api
                                  .patch(`/properties/${p.id}/status`, {
                                    status:
                                      p.status === "거래중" ? "거래완료" : "거래중",
                                  })
                                  .then(() => refreshProperties())
                              }
                            >
                              {p.status === "거래중" ? "✅ 완료" : "🔄 재개"}
                            </button>

                            <button
                              style={{
                                padding: "10px 16px",
                                border: "none",
                                borderRadius: 8,
                                background: "linear-gradient(135deg, #dc3545, #c82333)",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 600,
                                boxShadow: "0 2px 6px rgba(220,53,69,0.3)",
                                transition: "all 0.2s ease"
                              }}
                              onClick={() => deleteProperty(p.id, p.address)}
                            >
                              🗑️ 삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* 카테고리 없는 매물 */}
              {propertiesByCategory["OTHER"] && propertiesByCategory["OTHER"].length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                    paddingBottom: 12,
                    borderBottom: "3px solid #6c757d"
                  }}>
                    <span style={{ fontSize: 28 }}>📋</span>
                    <h2 style={{
                      fontSize: 22,
                      color: "#6c757d",
                      margin: 0,
                      fontWeight: 700
                    }}>
                      기타
                    </h2>
                    <span style={{
                      background: "#6c757d",
                      color: "#fff",
                      padding: "4px 12px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {propertiesByCategory["OTHER"].length}개
                    </span>
                  </div>

                  <div style={{ 
                    display: "grid", 
                    gap: 15 
                  }}>
                    {propertiesByCategory["OTHER"].map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: 20,
                          background: "#fff",
                          border: "1px solid #e9ecef",
                          borderRadius: 12,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
                            <span style={{ 
                              background: p.status === "거래중" 
                                ? "linear-gradient(135deg, #28a745, #218838)" 
                                : "linear-gradient(135deg, #6c757d, #5a6268)",
                              color: "#fff", 
                              padding: "4px 12px", 
                              borderRadius: 20, 
                              fontSize: 12,
                              fontWeight: 600
                            }}>
                              {p.status === "거래중" ? "🟢" : "⚪"} {p.status}
                            </span>
                            <DealTypeBadge 
                              dealType={p.deal_type || ""} 
                              size="medium"
                            />
                            {p.is_featured && (
                              <span style={{
                                background: "linear-gradient(135deg, #ff9f43, #ee5a24)",
                                color: "#fff",
                                padding: "4px 10px",
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600
                              }}>
                                ⭐ 추천
                              </span>
                            )}
                            <strong style={{ fontSize: 18, color: "#2c3e50" }}>
                              {p.address}
                            </strong>
                          </div>
                          <div style={{ 
                            color: "#5ba1b1", 
                            fontSize: 16,
                            fontWeight: 600,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            marginTop: 4
                          }}>
                            <PriceDisplay property={p} variant="full" size="medium" />
                          </div>
                          <div style={{ 
                            color: "#666", 
                            fontSize: 14, 
                            marginTop: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}>
                            <span>📍 {p.type} | {p.deal_type} | ID: {p.id}</span>
                            {inquiryCounts[p.id] > 0 && (
                              <button
                                onClick={() => handleViewInquiries(p.id)}
                                style={{
                                  padding: "4px 10px",
                                  background: unreadCounts[p.id] > 0
                                    ? "linear-gradient(135deg, #dc3545, #c82333)"
                                    : "linear-gradient(135deg, #007bff, #0056b3)",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 12,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  boxShadow: unreadCounts[p.id] > 0 ? "0 2px 4px rgba(220,53,69,0.3)" : "none"
                                }}
                              >
                                📧 문의 {inquiryCounts[p.id]}건
                                {unreadCounts[p.id] > 0 && (
                                  <span style={{
                                    background: "rgba(255,255,255,0.3)",
                                    padding: "2px 6px",
                                    borderRadius: 8,
                                    fontSize: 10
                                  }}>
                                    🔴 {unreadCounts[p.id]}
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Link href={`/admin/properties/${p.id}`}>
                            <button style={{
                              padding: "10px 16px",
                              border: "none",
                              borderRadius: 8,
                              background: "linear-gradient(135deg, #5ba1b1, #4a8a99)",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                              boxShadow: "0 2px 6px rgba(91,161,177,0.3)",
                              transition: "all 0.2s ease"
                            }}>
                              ✏️ 수정
                            </button>
                          </Link>
                          <button
                            style={{
                              padding: "10px 16px",
                              border: "none",
                              borderRadius: 8,
                              background: p.is_featured
                                ? "linear-gradient(135deg, #ff6b6b, #ee5a52)"
                                : "linear-gradient(135deg, #ff9f43, #ee5a24)",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                              boxShadow: p.is_featured
                                ? "0 2px 6px rgba(255,107,107,0.3)"
                                : "0 2px 6px rgba(255,159,67,0.3)",
                              transition: "all 0.2s ease"
                            }}
                            onClick={() => toggleFeatured(p.id, p.is_featured || false, p.address)}
                          >
                            {p.is_featured ? "⭐ 해제" : "⭐ 추천"}
                          </button>
                          <button
                            style={{
                              padding: "10px 16px",
                              border: "none",
                              borderRadius: 8,
                              background: p.status === "거래중"
                                ? "linear-gradient(135deg, #ffc107, #e0a800)"
                                : "linear-gradient(135deg, #28a745, #218838)",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                              boxShadow: p.status === "거래중"
                                ? "0 2px 6px rgba(255,193,7,0.3)"
                                : "0 2px 6px rgba(40,167,69,0.3)",
                              transition: "all 0.2s ease"
                            }}
                            onClick={() =>
                              api
                                .patch(`/properties/${p.id}/status`, {
                                  status: p.status === "거래중" ? "거래완료" : "거래중",
                                })
                                .then(() => refreshProperties())
                            }
                          >
                            {p.status === "거래중" ? "✅ 완료" : "🔄 재개"}
                          </button>
                          <button
                            style={{
                              padding: "10px 16px",
                              border: "none",
                              borderRadius: 8,
                              background: "linear-gradient(135deg, #dc3545, #c82333)",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                              boxShadow: "0 2px 6px rgba(220,53,69,0.3)",
                              transition: "all 0.2s ease"
                            }}
                            onClick={() => deleteProperty(p.id, p.address)}
                          >
                            🗑️ 삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 문의 리스트 모달 */}
      {isInquiryListOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsInquiryListOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 30,
              width: "90%",
              maxWidth: 600,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#2c3e50", margin: 0 }}>
                📧 문의 목록 ({inquiries.length}건)
              </h2>
              <button
                onClick={() => setIsInquiryListOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  color: "#999",
                  cursor: "pointer",
                  padding: 0,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {inquiries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                문의가 없습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    onClick={() => handleViewInquiryDetail(inquiry)}
                    style={{
                      padding: 18,
                      border: inquiry.is_read ? "2px solid #e9ecef" : "2px solid #dc3545",
                      borderRadius: 10,
                      transition: "all 0.3s ease",
                      background: inquiry.is_read ? "#fff" : "#fff5f5",
                      position: "relative",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
                    }}
                    onMouseOver={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.borderColor = "#5ba1b1";
                      target.style.background = inquiry.is_read ? "#f0f8ff" : "#ffe6e6";
                      target.style.boxShadow = "0 4px 12px rgba(91,161,177,0.25)";
                      target.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.borderColor = inquiry.is_read ? "#e9ecef" : "#dc3545";
                      target.style.background = inquiry.is_read ? "#fff" : "#fff5f5";
                      target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                      target.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#2c3e50" }}>
                            연락처: {inquiry.contact}
                          </div>
                          {!inquiry.is_read && (
                            <span style={{
                              background: "linear-gradient(135deg, #dc3545, #c82333)",
                              color: "#fff",
                              padding: "3px 10px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              boxShadow: "0 2px 4px rgba(220,53,69,0.3)"
                            }}>
                              🔴 안읽음
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                          {new Date(inquiry.created_at).toLocaleString("ko-KR")}
                        </div>
                        <div style={{
                          fontSize: 14,
                          color: "#555",
                          lineHeight: "1.6",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical"
                        }}>
                          {inquiry.message}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedPropertyId) {
                            handleDeleteInquiry(inquiry.id, selectedPropertyId);
                          }
                        }}
                        style={{
                          padding: "8px 14px",
                          background: "linear-gradient(135deg, #dc3545, #c82333)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(220,53,69,0.3)",
                          transition: "all 0.2s ease",
                          marginLeft: 12
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLElement).style.opacity = "0.85";
                          (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLElement).style.opacity = "1";
                          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                        }}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                    <div style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: "1px solid #e9ecef",
                      fontSize: 12,
                      color: "#5ba1b1",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <span>👆</span>
                      <span>클릭하여 상세보기</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 문의 상세 모달 */}
      {selectedInquiry && selectedPropertyId && (
        <InquiryModal
          isOpen={isInquiryModalOpen}
          onClose={() => {
            setIsInquiryModalOpen(false);
            setSelectedInquiry(null);
          }}
          propertyId={selectedPropertyId}
          mode="view"
          inquiry={selectedInquiry}
        />
      )}

      {/* 상담 문의 목록 모달 */}
      {isConsultationListOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsConsultationListOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 30,
              width: "90%",
              maxWidth: 600,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#2c3e50", margin: 0 }}>
                💬 상담 문의 목록 ({consultations.length}건)
              </h2>
              <button
                onClick={() => setIsConsultationListOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  color: "#999",
                  cursor: "pointer",
                  padding: 0,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {consultations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                상담 문의가 없습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    onClick={() => handleViewConsultationDetail(consultation)}
                    style={{
                      padding: 18,
                      border: consultation.is_read ? "2px solid #e9ecef" : "2px solid #007bff",
                      borderRadius: 10,
                      transition: "all 0.3s ease",
                      background: consultation.is_read ? "#fff" : "#e6f2ff",
                      position: "relative",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
                    }}
                    onMouseOver={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.borderColor = "#5ba1b1";
                      target.style.background = consultation.is_read ? "#f0f8ff" : "#d9edf7";
                      target.style.boxShadow = "0 4px 12px rgba(91,161,177,0.25)";
                      target.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.borderColor = consultation.is_read ? "#e9ecef" : "#007bff";
                      target.style.background = consultation.is_read ? "#fff" : "#e6f2ff";
                      target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                      target.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#2c3e50" }}>
                            {consultation.name}
                          </div>
                          <div style={{ fontSize: 14, color: "#666", fontWeight: 500 }}>
                            {consultation.contact}
                          </div>
                          {!consultation.is_read && (
                            <span style={{
                              background: "linear-gradient(135deg, #007bff, #0056b3)",
                              color: "#fff",
                              padding: "3px 10px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              boxShadow: "0 2px 4px rgba(0,123,255,0.3)"
                            }}>
                              🔵 안읽음
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                          {new Date(consultation.created_at).toLocaleString("ko-KR")}
                        </div>
                        <div style={{
                          fontSize: 14,
                          color: "#555",
                          lineHeight: "1.6",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical"
                        }}>
                          {consultation.message}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConsultation(consultation.id);
                        }}
                        style={{
                          padding: "8px 14px",
                          background: "linear-gradient(135deg, #dc3545, #c82333)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(220,53,69,0.3)",
                          transition: "all 0.2s ease",
                          marginLeft: 12
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLElement).style.opacity = "0.85";
                          (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLElement).style.opacity = "1";
                          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                        }}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                    <div style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: "1px solid #e9ecef",
                      fontSize: 12,
                      color: "#5ba1b1",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      <span>👆</span>
                      <span>클릭하여 상세보기</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 상담 문의 상세 모달 */}
      {selectedConsultation && (
        <ConsultationModal
          isOpen={isConsultationModalOpen}
          onClose={() => {
            setIsConsultationModalOpen(false);
            setSelectedConsultation(null);
          }}
          mode="view"
          consultation={selectedConsultation}
        />
      )}
    </div>
  );
}
