import "../globals.css";
import SessionProviderWrapper from "./SessionProviderWrapper";
import { Mali } from "next/font/google";

const mali = Mali({
  variable: "--font-mali",
  subsets: ["latin", "thai"], // ต้องมี "thai" เพื่อรองรับภาษาไทย
  weight: ["400", "500", "700"], // เลือกน้ำหนักตามต้องการ
});

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${mali.variable} font-mali antialiased`}>
      <SessionProviderWrapper>
        {children}
      </SessionProviderWrapper>
    </div>
  );
}
