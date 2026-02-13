"use client";

import React from "react";
import api, { API_BASE_URL } from "../../lib/api";
import { PropertyImage } from "../../lib/types";

interface ImageUploadProps {
  propertyId?: number; // 기존 매물 수정시 사용
  selectedImages: FileList | null;
  onImageSelect: (files: FileList | null) => void;
  onUploadComplete?: () => void; // 업로드 완료시 콜백
  showUploadButton?: boolean; // 업로드 버튼 표시 여부 (매물 수정시에만 표시)
  existingImages?: PropertyImage[]; // 기존 이미지 목록 (매물 수정시)
  onImageDelete?: (imageId: number) => void; // 이미지 삭제 콜백
  onSetMainImage?: (imageId: number) => void; // 대표 이미지 설정 콜백
}

export default function ImageUpload({
  propertyId,
  selectedImages,
  onImageSelect,
  onUploadComplete,
  showUploadButton = false,
  existingImages = [],
  onImageDelete,
  onSetMainImage
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // 이미지 파일만 필터링
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (imageFiles.length > 0) {
        // 기존 선택된 파일들과 새로운 파일들을 합치기
        const dt = new DataTransfer();
        
        // 기존 선택된 파일들 추가
        if (selectedImages) {
          Array.from(selectedImages).forEach(file => dt.items.add(file));
        }
        
        // 새로운 파일들 추가
        imageFiles.forEach(file => dt.items.add(file));
        
        onImageSelect(dt.files);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // 기존 선택된 파일들과 새로운 파일들을 합치기
      const dt = new DataTransfer();
      
      // 기존 선택된 파일들 추가
      if (selectedImages) {
        Array.from(selectedImages).forEach(file => dt.items.add(file));
      }
      
      // 새로운 파일들 추가
      Array.from(files).forEach(file => dt.items.add(file));
      
      onImageSelect(dt.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    if (selectedImages) {
      const dt = new DataTransfer();
      Array.from(selectedImages).forEach((file, index) => {
        if (index !== indexToRemove) {
          dt.items.add(file);
        }
      });
      onImageSelect(dt.files.length > 0 ? dt.files : null);
    }
  };

  const handleUpload = async () => {
    if (!propertyId || !selectedImages || selectedImages.length === 0) return;

    setIsUploading(true);
    
    try {
      // 모든 이미지를 한 번에 FormData에 추가
      const formData = new FormData();
      for (let i = 0; i < selectedImages.length; i++) {
        formData.append("images", selectedImages[i]); // "images" (복수) 사용
      }

      await api.post(`/properties/${propertyId}/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("이미지 업로드 완료!");
      onImageSelect(null); // 선택된 파일들 초기화
      onUploadComplete?.(); // 업로드 완료 콜백
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: 30 }}>
      <label style={{ 
        display: "block", 
        marginBottom: 8, 
        fontWeight: 600,
        color: "#2c3e50"
      }}>
        매물 이미지 {!showUploadButton && "(선택사항)"}:
      </label>
      
      <div style={{ 
        border: isDragging ? "2px solid #28a745" : "2px dashed #5ba1b1",
        borderRadius: 12,
        padding: 25,
        textAlign: "center" as const,
        background: isDragging ? "#f0fff4" : "#f8fdff",
        marginBottom: 15,
        transition: "all 0.2s ease",
        cursor: "pointer"
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        const input = document.querySelector(`input[type="file"][data-upload="${propertyId || 'new'}"]`) as HTMLInputElement;
        input?.click();
      }}
      >
        <div style={{ fontSize: 48, marginBottom: 10 }}>
          {isDragging ? "📥" : "📸"}
        </div>
        
        <input
          type="file"
          multiple
          accept="image/*"
          data-upload={propertyId || 'new'}
          onChange={handleFileSelect}
          style={{ 
            display: "none"
          }}
        />
        
        <p style={{ 
          color: isDragging ? "#28a745" : "#666", 
          margin: 0, 
          fontSize: 16,
          fontWeight: isDragging ? 600 : 400
        }}>
          {isDragging 
            ? "📥 이미지를 여기에 놓아주세요!" 
            : "📁 클릭하거나 이미지를 드래그해서 업로드"
          }
        </p>
        
        <p style={{ color: "#999", margin: "8px 0 0 0", fontSize: 12 }}>
          JPG, PNG, GIF 파일 지원 • 여러 파일 동시 선택 가능
        </p>
        
        {selectedImages && selectedImages.length > 0 && (
          <div style={{ marginTop: 15 }}>
            <p style={{ color: "#28a745", fontSize: 14, fontWeight: 600 }}>
              ✅ {selectedImages.length}개의 이미지 선택됨
            </p>
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: 8, 
              marginTop: 10,
              justifyContent: "center"
            }}>
              {Array.from(selectedImages).map((file, index) => (
                <div key={index} style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#f8f9fa",
                  padding: "4px 8px",
                  borderRadius: 16,
                  fontSize: 11,
                  color: "#666",
                  border: "1px solid #e9ecef"
                }}>
                  <span style={{ marginRight: 6 }}>{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    style={{
                      background: "#dc3545",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      fontSize: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 기존 이미지 목록 (매물 수정시에만 표시) */}
      {showUploadButton && existingImages.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ 
            color: "#2c3e50", 
            fontSize: 16, 
            marginBottom: 15,
            fontWeight: 600 
          }}>
            📷 현재 업로드된 이미지
          </h4>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 15 
          }}>
            {existingImages.map((image) => (
              <div key={image.id} style={{
                position: "relative",
                border: image.is_main ? "3px solid #28a745" : "2px solid #e9ecef",
                borderRadius: 12,
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <img
                  src={`${API_BASE_URL}${image.image_url}`}
                  alt="매물 이미지"
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    display: "block"
                  }}
                />
                
                {/* 대표 이미지 표시 */}
                {image.is_main && (
                  <div style={{
                    position: "absolute",
                    top: 5,
                    left: 5,
                    background: "#28a745",
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600
                  }}>
                    ⭐ 대표
                  </div>
                )}
                
                {/* 이미지 관리 버튼들 */}
                <div style={{
                  position: "absolute",
                  bottom: 5,
                  right: 5,
                  display: "flex",
                  gap: 5
                }}>
                  {/* 대표 이미지 설정 버튼 */}
                  {!image.is_main && onSetMainImage && (
                    <button
                      type="button"
                      onClick={() => onSetMainImage(image.id)}
                      style={{
                        background: "#ffc107",
                        color: "#000",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 6px",
                        fontSize: 10,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                      title="대표 이미지로 설정"
                    >
                      ⭐
                    </button>
                  )}
                  
                  {/* 삭제 버튼 */}
                  {onImageDelete && (
                    <button
                      type="button"
                      onClick={() => onImageDelete(image.id)}
                      style={{
                        background: "#dc3545",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 6px",
                        fontSize: 10,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                      title="이미지 삭제"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 업로드 버튼 (매물 수정시에만 표시) */}
      {showUploadButton && selectedImages && selectedImages.length > 0 && (
        <button 
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          style={{ 
            padding: "12px 24px", 
            background: isUploading 
              ? "linear-gradient(135deg, #6c757d, #5a6268)"
              : "linear-gradient(135deg, #28a745, #218838)", 
            color: "#fff", 
            border: "none", 
            borderRadius: 8,
            cursor: isUploading ? "not-allowed" : "pointer",
            fontSize: 16,
            fontWeight: 600,
            boxShadow: "0 3px 10px rgba(40,167,69,0.3)"
          }}
        >
          {isUploading ? "⏳ 업로드 중..." : "📤 이미지 업로드"}
        </button>
      )}
    </div>
  );
}
