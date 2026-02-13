"use client";

import React from "react";
import api from "../../../../lib/api";
import ImageUpload from "../../../components/ImageUpload";

export default function NewProperty() {
  const [selectedImages, setSelectedImages] = React.useState<FileList | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");

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

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = {
      realtor_id: 1,
      // 카테고리와 매물 종류
      category: selectedCategory, // category 추가
      type: (form.elements.namedItem("property_type") as HTMLSelectElement).value || "", // 매물종류(아파트,빌라,원룸) -> type
      deal_type: (form.elements.namedItem("deal_type") as HTMLSelectElement).value || "", // 거래유형(매매,전세,월세) -> deal_type
      price: Number((form.elements.namedItem("price") as HTMLInputElement).value) || 0,
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
      sido: null,
      sigungu: null,
      dong: null,
      address: (form.elements.namedItem("address") as HTMLInputElement).value || "",
      lat: null,
      lng: null,
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

    // 🔴 디버깅: 전송할 데이터 확인
    console.log("=== 클라이언트 전송 데이터 ===");
    console.log("formData:", formData);
    console.log("formData의 키들:", Object.keys(formData));
    console.log("null/undefined 값들:", Object.entries(formData).filter(([, value]) => value === null || value === undefined));
    console.log("빈 문자열 값들:", Object.entries(formData).filter(([, value]) => value === ""));
    console.log("필수 필드 체크:");
    console.log("- realtor_id:", formData.realtor_id, typeof formData.realtor_id);
    console.log("- type:", formData.type, typeof formData.type);
    console.log("- price:", formData.price, typeof formData.price);
    console.log("- address:", formData.address, typeof formData.address);
    console.log("- deal_type:", formData.deal_type, typeof formData.deal_type);

    try {
      // 1. 매물 등록
      const propertyResponse = await api.post("/properties", formData);
      const propertyId = propertyResponse.data.id;

      // 2. 이미지 업로드 (선택한 이미지가 있을 경우)
      if (selectedImages && selectedImages.length > 0) {
        const imageFormData = new FormData();
        
        // 모든 이미지를 한 번에 FormData에 추가
        for (let i = 0; i < selectedImages.length; i++) {
          imageFormData.append("images", selectedImages[i]); // "images" (복수) 사용
        }

        try {
          await api.post(`/properties/${propertyId}/images`, imageFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } catch (imageError) {
          console.error("이미지 업로드 실패:", imageError);
          alert("이미지 업로드에 실패했습니다.");
          return;
        }
      }

      alert("매물 등록 완료!");
      location.href = "/admin";
    } catch (error) {
      console.error("등록 실패:", error);
      alert("매물 등록에 실패했습니다.");
    }
  };

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
          <h1 style={{ 
            fontSize: 28, 
            color: "#2c3e50", 
            marginBottom: 8,
            borderBottom: "3px solid #5ba1b1",
            paddingBottom: 10
          }}>
            🏠 매물 등록 (관리자)
          </h1>
          <p style={{ color: "#666", marginBottom: 30 }}>
            새로운 매물 정보를 입력해주세요
          </p>

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
                placeholder="예: 충남 천안시 서북구 불당동 123-45"
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
                  placeholder="예: 300000000"
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
                  placeholder="예: 500000"
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
                  placeholder="예: 10000000"
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
                  placeholder="예: 100000"
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
                  placeholder="예: 84.5"
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
                  placeholder="예: 3"
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
                  placeholder="예: 2"
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
            <div style={{ marginBottom: 30 }}>
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

            <ImageUpload
              selectedImages={selectedImages}
              onImageSelect={setSelectedImages}
              showUploadButton={false}
            />

            <div style={{ display: "flex", gap: 15, justifyContent: "flex-end" }}>
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
                  background: "linear-gradient(135deg, #28a745, #218838)", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: "0 3px 10px rgba(40,167,69,0.3)",
                  transition: "all 0.3s ease"
                }}
              >
                ✅ 매물 등록
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
