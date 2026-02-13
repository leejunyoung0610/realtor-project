import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  onConsultationClick?: () => void;
}

export default function Layout({ children, onConsultationClick }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header onConsultationClick={onConsultationClick} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
