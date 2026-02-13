"use client";

import { useState } from "react";
import { X, Send, CheckCircle } from "lucide-react";
import api from "../lib/api";
import { Inquiry } from "../lib/types";

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  propertyTitle?: string;
  mode?: "create" | "view";
  inquiry?: Inquiry | null;
}

export default function InquiryModal({ isOpen, onClose, propertyId, propertyTitle, mode = "create", inquiry }: InquiryModalProps) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // View mode - 관리자 페이지에서 문의 상세보기
  if (mode === "view" && inquiry) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
        <div className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl" style={{ background: 'var(--card, #fff)' }}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent cursor-pointer transition-colors hover:bg-gray-100"
            style={{ color: 'var(--muted-foreground, #666)' }}
          >
            <X className="h-4 w-4" />
          </button>

          <h2 className="mb-4 text-xl font-bold" style={{ color: 'var(--foreground, #333)' }}>📧 문의 상세</h2>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--muted-foreground, #666)' }}>연락처</label>
              <p className="text-base font-semibold mt-1" style={{ color: 'var(--foreground, #333)' }}>{inquiry.contact}</p>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--muted-foreground, #666)' }}>문의 내용</label>
              <p className="text-sm leading-relaxed mt-1 whitespace-pre-line" style={{ color: 'var(--foreground, #333)' }}>
                {inquiry.message}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--muted-foreground, #666)' }}>접수일</label>
              <p className="text-sm mt-1" style={{ color: 'var(--foreground, #333)' }}>
                {new Date(inquiry.created_at).toLocaleString("ko-KR")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create mode - 사용자 문의 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/inquiries", {
        property_id: propertyId,
        contact: phone,
        message,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setPhone("");
        setMessage("");
        onClose();
      }, 2000);
    } catch {
      setError("전송에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl" style={{ background: 'var(--card, #fff)' }}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent cursor-pointer transition-colors hover:bg-gray-100"
          style={{ color: 'var(--muted-foreground, #666)' }}
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(34,197,94,0.1)' }}>
              <CheckCircle className="h-8 w-8" style={{ color: '#22c55e' }} />
            </div>
            <h3 className="text-xl font-bold m-0" style={{ color: 'var(--foreground, #333)' }}>문의 완료!</h3>
            <p className="text-center text-sm m-0" style={{ color: 'var(--muted-foreground, #666)' }}>
              빠른 시일 내에 연락드리겠습니다.
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--foreground, #333)' }}>매물 문의</h2>
            {propertyTitle && (
              <p className="mb-6 text-sm" style={{ color: 'var(--muted-foreground, #666)' }}>
                &quot;{propertyTitle}&quot; 매물에 대해 문의합니다.
              </p>
            )}

            {error && (
              <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--foreground, #333)' }}>연락처</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                  style={{ border: '1px solid var(--border, #e5e7eb)', background: 'var(--background, #f8f9fb)', color: 'var(--foreground, #333)' }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--foreground, #333)' }}>문의내용</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="문의하실 내용을 입력하세요"
                  className="w-full resize-none rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                  style={{ border: '1px solid var(--border, #e5e7eb)', background: 'var(--background, #f8f9fb)', color: 'var(--foreground, #333)' }}
                />
              </div>
              <button
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 cursor-pointer border-none"
                style={{ background: 'var(--primary, #1e3a5f)' }}
              >
                <Send className="h-4 w-4" />
                문의하기
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
