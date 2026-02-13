"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      await api.get("/admin/verify");
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem("admin_token");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/admin/login", { password });
      localStorage.setItem("admin_token", response.data.token);
      setIsAuthenticated(true);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response: { data: { error: string } } };
        setError(axiosErr.response?.data?.error || "로그인에 실패했습니다.");
      } else {
        setError("서버에 연결할 수 없습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setPassword("");
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f8f9fa",
          color: "#666",
          fontSize: 18,
        }}
      >
        인증 확인 중...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1e3a5f 0%, #2a4f7a 100%)",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 40,
            width: "100%",
            maxWidth: 400,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#1e3a5f",
                margin: 0,
                marginBottom: 8,
              }}
            >
              관리자 로그인
            </h1>
            <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
              관리자 비밀번호를 입력해주세요
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: error ? "2px solid #dc3545" : "2px solid #e5e7eb",
                  borderRadius: 10,
                  fontSize: 16,
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1e3a5f";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = error
                    ? "#dc3545"
                    : "#e5e7eb";
                }}
                autoFocus
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#fff5f5",
                  border: "1px solid #fecaca",
                  color: "#dc3545",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 14,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              style={{
                width: "100%",
                padding: "14px",
                background:
                  isSubmitting || !password
                    ? "#ccc"
                    : "linear-gradient(135deg, #1e3a5f, #2a4f7a)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                cursor: isSubmitting || !password ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 관리자 상단 바 */}
      <div
        style={{
          background: "#1e3a5f",
          color: "#fff",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          🔒 관리자 모드
        </span>
        <button
          onClick={handleLogout}
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.25)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
          }}
        >
          로그아웃
        </button>
      </div>
      {children}
    </div>
  );
}
