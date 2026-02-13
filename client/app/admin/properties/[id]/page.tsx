"use client";

import React, { useEffect, useState } from "react";
import api from "../../../../lib/api";
import { Property, PropertyImage } from "../../../../lib/types";
import ImageUpload from "../../../components/ImageUpload";

export default function EditProperty({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 🔑 Next 15 방식: params unwrap
  const { id } = React.use(params);

  const [data, setData] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // 카테고리별 매물 종류 매핑
  const getTypesByCategory = (category: string) => {
    switch (category) {
      case 'RESIDENTIAL':
        return [
          { value: '아파트', label: '아파트' },
          { value: '빌라', label: '빌라' },
          { value: '원룸', label: '원룸' },
          { value: '투룸', label: '투룸' },
          { value: '오피스텔', label: '오피스텔' }
        ];
      case 'COMMERCIAL':
        return [
          { value: '상가', label: '상가' },
          { value: '사무실', label: '사무실' }
        ];
      case 'INDUSTRIAL':
        return [
          { value: '공장', label: '공장' },
          { value: '창고', label: '창고' }
        ];
      case 'LAND':
        return [
          { value: '토지', label: '토지' }
        ];
      default:
        return [];
    }
  };

  // type에서 category 추론하는 함수
  const getCategoryFromType = (type: string) => {
    if (['아파트', '오피스텔', '원룸', '투룸', '빌라'].includes(type)) {
      return 'RESIDENTIAL';
    } else if (['상가', '사무실'].includes(type)) {
      return 'COMMERCIAL';
    } else if (['공장', '창고'].includes(type)) {
      return 'INDUSTRIAL';
    } else if (type === '토지') {
      return 'LAND';
    }
    return '';
  };

  useEffect(() => {
    api.get<Property[]>("/properties").then((res) => {
      const found = res.data.find((p) => p.id === Number(id));
      setData(found ?? null);
      
      // 기존 매물의 type에서 category 추론하여 설정
      if (found) {
        const category = found.category || getCategoryFromType(found.type);
        setSelectedCategory(category);
      }
    });
    
    // 이미지 목록 가져오기
    api.get(`/properties/${id}/images`).then((res) => {
      setImages(res.data);
    }).catch(() => {
      setImages([]);
    });
  }, [id]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const updateData = {
      // 카테고리와 매물 종류
      category: selectedCategory, // category 추가
      type: (form.elements.namedItem("property_type") as HTMLSelectElement).value, // 매물종류(아파트,빌라,원룸) -> type
      deal_type: (form.elements.namedItem("deal_type") as HTMLSelectElement).value, // 거래유형(매매,전세,월세) -> deal_type
      price: Number((form.elements.namedItem("price") as HTMLInputElement).value),
      deposit: (form.elements.namedItem("deposit") as HTMLInputElement).value ? 
        Number((form.elements.namedItem("deposit") as HTMLInputElement).value) : null,
      monthly_rent: (form.elements.namedItem("monthly_rent") as HTMLInputElement).value ? 
        Number((form.elements.namedItem("monthly_rent") as HTMLInputElement).value) : null,
      area: (form.elements.namedItem("area") as HTMLInputElement).value ? 
        Number((form.elements.namedItem("area") as HTMLInputElement).value) : null,
      rooms: (form.elements.namedItem("rooms") as HTMLInputElement).value ? 
        Number((form.elements.namedItem("rooms") as HTMLInputElement).value) : null,
      bathrooms: (form.elements.namedItem("bathrooms") as HTMLInputElement).value ? 
        Number((form.elements.namedItem("bathrooms") as HTMLInputElement).value) : null,
      address: (form.elements.namedItem("address") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value || null,
      
      // 새로운 상세 정보 필드들
      maintenance_fee: (form.elements.namedItem("maintenance_fee") as HTMLInputElement).value ? 
        Number((form.elements.namedItem("maintenance_fee") as HTMLInputElement).value) : null,
      direction: (form.elements.namedItem("direction") as HTMLSelectElement).value || null,
      floor_info: (form.elements.namedItem("floor_info") as HTMLInputElement).value || null,
      usage_type: (form.elements.namedItem("usage_type") as HTMLSelectElement).value || null,
      parking: (form.elements.namedItem("parking") as HTMLSelectElement).value || null,
      elevator: (form.elements.namedItem("elevator") as HTMLSelectElement).value === "true",
      move_in_date: (form.elements.namedItem("move_in_date") as HTMLInputElement).value || null,
    };

    // 🔴 디버깅: updateData 확인
    console.log("=== UPDATE DATA 확인 ===");
    console.log("updateData:", updateData);
    console.log("updateData의 키들:", Object.keys(updateData));
    console.log("undefined 값들:", Object.entries(updateData).filter(([, value]) => value === undefined));

    try {
      await api.put(`/properties/${id}`, updateData);
      alert("매물 수정 완료!");
      location.href = "/admin";
    } catch (error) {
      console.error("매물 수정 실패:", error);
      alert("매물 수정에 실패했습니다.");
    }
  };

  const handleImageUploadComplete = () => {
    // 이미지 업로드 완료 후 목록 새로고침
    api.get(`/properties/${id}/images`).then((res) => {
      setImages(res.data);
    });
  };

  const deleteImage = async (imageId: number) => {
    if (!confirm("이미지를 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/properties/${id}/images/${imageId}`);
      alert("이미지 삭제 완료");
      
      // 이미지 목록 새로고침
      api.get(`/properties/${id}/images`).then((res) => {
        setImages(res.data);
      });
    } catch (error) {
      console.error("이미지 삭제 실패:", error);
      alert("이미지 삭제 실패");
    }
  };

  const setMainImage = async (imageId: number) => {
    if (!confirm("이 이미지를 대표 이미지로 설정하시겠습니까?")) return;

    try {
      await api.patch(`/properties/${id}/images/${imageId}/main`);
      alert("대표 이미지 설정 완료");
      
      // 이미지 목록 새로고침
      api.get(`/properties/${id}/images`).then((res) => {
        setImages(res.data);
      });
    } catch (error) {
      console.error("대표 이미지 설정 실패:", error);
      alert("대표 이미지 설정 실패");
    }
  };

  const deleteProperty = async () => {
    if (!data) return;

    if (!confirm(`"${data.address}" 매물을 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.\n- 매물 정보가 삭제됩니다\n- 연결된 모든 이미지가 삭제됩니다`)) {
      return;
    }

    try {
      await api.delete(`/properties/${id}`);
      alert("매물이 성공적으로 삭제되었습니다.");
      
      // 관리자 메인 페이지로 이동
      window.location.href = "/admin";
    } catch (error) {
      console.error("매물 삭제 실패:", error);
      alert("매물 삭제에 실패했습니다.");
    }
  };

  if (!data) return (
    <div style={{ 
      background: "#fff", 
      minHeight: "100vh", 
      padding: 20, 
      color: "#333" 
    }}>
      로딩중...
    </div>
  );

  return (
    <div style={{ 
      background: "#f8f9fa", 
      minHeight: "100vh", 
      color: "#333" 
    }}>
      <div style={{ 
        maxWidth: 800, 
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
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start", 
            marginBottom: 30 
          }}>
            <div>
              <h1 style={{ 
                fontSize: 28, 
                color: "#2c3e50", 
                marginBottom: 8,
                borderBottom: "3px solid #5ba1b1",
                paddingBottom: 10
              }}>
                매물 수정 (관리자)
              </h1>
              <p style={{ color: "#666", margin: 0 }}>
                {data.address} - {data.type}
              </p>
            </div>
            
            <button
              type="button"
              onClick={deleteProperty}
              style={{
                padding: "12px 20px",
                background: "linear-gradient(135deg, #dc3545, #c82333)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 3px 10px rgba(220,53,69,0.3)",
                transition: "all 0.3s ease"
              }}
            >
              🗑️ 매물 삭제
            </button>
          </div>

          {/* 기본 정보 수정 */}
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ 
              fontSize: 20, 
              color: "#34495e", 
              marginBottom: 15,
              borderLeft: "4px solid #5ba1b1",
              paddingLeft: 10
            }}>
              매물 정보 수정
            </h3>
            <form onSubmit={submit}>
              {/* 거래유형 */}
              <div style={{ marginBottom: 25 }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: 600,
                  color: "#2c3e50"
                }}>
                  거래유형 *:
                </label>
                <select
                  name="deal_type"
                  defaultValue={data.deal_type || ""}
                  required
                  style={{ 
                    width: "100%", 
                    padding: "12px 15px", 
                    border: "2px solid #e1e5e9",
                    borderRadius: 8,
                    fontSize: 16,
                    color: "#2c3e50",
                    background: "#fff"
                  }}
                >
                  <option value="">거래유형을 선택하세요</option>
                  <option value="매매">매매</option>
                  <option value="전세">전세</option>
                  <option value="월세">월세</option>
                  <option value="단기임대">단기임대</option>
                </select>
              </div>

              {/* 매물 카테고리 */}
              <div style={{ marginBottom: 25 }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: 600,
                  color: "#2c3e50"
                }}>
                  매물 카테고리 *:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  required
                  style={{ 
                    width: "100%", 
                    padding: "12px 15px", 
                    border: "2px solid #e1e5e9",
                    borderRadius: 8,
                    fontSize: 16,
                    color: "#2c3e50",
                    background: "#fff"
                  }}
                >
                  <option value="">매물 카테고리를 선택하세요</option>
                  <option value="RESIDENTIAL">🏠 주거용 (아파트, 빌라, 원룸 등)</option>
                  <option value="COMMERCIAL">🏪 상업용 (상가, 사무실)</option>
                  <option value="INDUSTRIAL">🏭 산업용 (공장, 창고)</option>
                  <option value="LAND">🌍 토지</option>
                </select>
              </div>

              {/* 매물종류 */}
              <div style={{ marginBottom: 25 }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: 600,
                  color: "#2c3e50"
                }}>
                  매물종류 *:
                </label>
                <select
                  name="property_type"
                  defaultValue={data.type || ""}
                  required
                  disabled={!selectedCategory}
                  style={{ 
                    width: "100%", 
                    padding: "12px 15px", 
                    border: "2px solid #e1e5e9",
                    borderRadius: 8,
                    fontSize: 16,
                    color: "#2c3e50",
                    background: selectedCategory ? "#fff" : "#f8f9fa",
                    cursor: selectedCategory ? "pointer" : "not-allowed"
                  }}
                >
                  <option value="">
                    {selectedCategory ? "매물종류를 선택하세요" : "먼저 카테고리를 선택하세요"}
                  </option>
                  {getTypesByCategory(selectedCategory).map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 주소 */}
              <div style={{ marginBottom: 25 }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: 600,
                  color: "#2c3e50"
                }}>
                  주소 *:
                </label>
                <input
                  name="address"
                  type="text"
                  defaultValue={data.address || ""}
                  required
                  style={{ 
                    width: "100%", 
                    padding: "12px 15px", 
                    border: "2px solid #e1e5e9",
                    borderRadius: 8,
                    fontSize: 16,
                    color: "#2c3e50",
                    background: "#fff"
                  }}
                />
              </div>

              {/* 금액 정보 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    매매가격/전세가 (원) *:
                  </label>
                  <input
                    name="price"
                    type="number"
                    defaultValue={data.price || ""}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    월세 (원):
                  </label>
                  <input
                    name="monthly_rent"
                    type="number"
                    defaultValue={data.monthly_rent || ""}
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  />
                </div>
              </div>

              {/* 보증금과 관리비 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    보증금 (원):
                  </label>
                  <input
                    name="deposit"
                    type="number"
                    defaultValue={data.deposit || ""}
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    관리비 (원):
                  </label>
                  <input
                    name="maintenance_fee"
                    type="number"
                    defaultValue={data.maintenance_fee || ""}
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  />
                </div>
              </div>

              {/* 면적과 방향 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    면적 (㎡):
                  </label>
                  <input
                    name="area"
                    type="number"
                    step="0.1"
                    defaultValue={data.area || ""}
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    방향:
                  </label>
                  <select
                    name="direction"
                    defaultValue={data.direction || ""}
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  >
                    <option value="">선택하세요</option>
                    <option value="남향">남향</option>
                    <option value="동향">동향</option>
                    <option value="서향">서향</option>
                    <option value="북향">북향</option>
                    <option value="남동향">남동향</option>
                    <option value="남서향">남서향</option>
                    <option value="북동향">북동향</option>
                    <option value="북서향">북서향</option>
                  </select>
                </div>
              </div>

              {/* 방/욕실 개수 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    방 개수:
                  </label>
                  <input
                    name="rooms"
                    type="number"
                    min="0"
                    defaultValue={data.rooms || ""}
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    욕실 개수:
                  </label>
                  <input
                    name="bathrooms"
                    type="number"
                    min="0"
                    defaultValue={data.bathrooms || ""}
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  />
                </div>
              </div>

              {/* 층정보와 용도 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    층정보:
                  </label>
                  <input
                    name="floor_info"
                    type="text"
                    defaultValue={data.floor_info || ""}
                    placeholder="예: 5층/15층"
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    용도:
                  </label>
                  <select
                    name="usage_type"
                    defaultValue={data.usage_type || ""}
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  >
                    <option value="">선택하세요</option>
                    <option value="주거용">주거용</option>
                    <option value="상업용">상업용</option>
                    <option value="업무용">업무용</option>
                    <option value="혼합용">혼합용</option>
                  </select>
                </div>
              </div>

              {/* 주차와 엘리베이터 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 25 }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    주차:
                  </label>
                  <select
                    name="parking"
                    defaultValue={data.parking || ""}
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  >
                    <option value="">선택하세요</option>
                    <option value="가능">가능</option>
                    <option value="불가능">불가능</option>
                    <option value="별도계약">별도계약</option>
                  </select>
                </div>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: 8, 
                    fontWeight: 600,
                    color: "#2c3e50"
                  }}>
                    엘리베이터:
                  </label>
                  <select
                    name="elevator"
                    defaultValue={data.elevator !== null && data.elevator !== undefined ? data.elevator.toString() : ""}
                    style={{ 
                      width: "100%", 
                      padding: "12px 15px", 
                      border: "2px solid #e1e5e9",
                      borderRadius: 8,
                      fontSize: 16,
                      color: "#2c3e50",
                      background: "#fff"
                    }}
                  >
                    <option value="">선택하세요</option>
                    <option value="true">있음</option>
                    <option value="false">없음</option>
                  </select>
                </div>
              </div>

              {/* 입주가능일 */}
              <div style={{ marginBottom: 25 }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: 600,
                  color: "#2c3e50"
                }}>
                  입주가능일:
                </label>
                <input
                  name="move_in_date"
                  type="date"
                  defaultValue={data.move_in_date ? new Date(data.move_in_date).toISOString().split('T')[0] : ""}
                  style={{ 
                    width: "100%", 
                    padding: "12px 15px", 
                    border: "2px solid #e1e5e9",
                    borderRadius: 8,
                    fontSize: 16,
                    color: "#2c3e50",
                    background: "#fff"
                  }}
                />
              </div>

              {/* 상세 설명 */}
              <div style={{ marginBottom: 25 }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: 8, 
                  fontWeight: 600,
                  color: "#2c3e50"
                }}>
                  상세 설명:
                </label>
                <textarea
                  name="description"
                  defaultValue={data.description ?? ""}
                  placeholder="매물에 대한 상세한 설명을 입력해주세요..."
                  style={{ 
                    width: "100%", 
                    padding: "12px 15px", 
                    border: "2px solid #e1e5e9",
                    borderRadius: 8,
                    minHeight: 120,
                    fontSize: 16,
                    color: "#2c3e50",
                    background: "#fff",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 15 }}>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  style={{
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #6c757d, #5a6268)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                    boxShadow: "0 3px 10px rgba(108,117,125,0.3)"
                  }}
                >
                  ↩️ 취소
                </button>

                <button 
                  type="submit"
                  style={{ 
                    padding: "12px 24px", 
                    background: "linear-gradient(135deg, #5ba1b1, #4a8a99)", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                    boxShadow: "0 3px 10px rgba(91,161,177,0.3)",
                    transition: "all 0.3s ease"
                  }}
                >
                  💾 매물 수정 저장
                </button>
              </div>
            </form>
          </div>

          {/* 이미지 관리 */}
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ 
              fontSize: 20, 
              color: "#34495e", 
              marginBottom: 15,
              borderLeft: "4px solid #28a745",
              paddingLeft: 10
            }}>
              이미지 관리
            </h3>
            
            <ImageUpload
              propertyId={Number(id)}
              selectedImages={selectedImages}
              onImageSelect={setSelectedImages}
              onUploadComplete={handleImageUploadComplete}
              showUploadButton={true}
              existingImages={images}
              onImageDelete={deleteImage}
              onSetMainImage={setMainImage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
