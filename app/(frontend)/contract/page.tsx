"use client";

import { AiOutlineMail, AiOutlinePhone } from "react-icons/ai";
import { FaFacebook, FaLine } from "react-icons/fa";
import Header from "@/app/components/Header";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <h1 className="text-3xl font-bold mb-6 text-[#D4A373]">ติดต่อเรา</h1>
        <div className="bg-[#FAEDCD] rounded-xl shadow-md p-8 w-full max-w-md space-y-6">
          <div className="flex items-center space-x-3">
            <AiOutlineMail size={24} className="text-[#D4A373]" />
            <span className="text-lg">Email: homepaw@example.com</span>
          </div>
          <div className="flex items-center space-x-3">
            <AiOutlinePhone size={24} className="text-[#D4A373]" />
            <span className="text-lg">โทร: 099-999-9999</span>
          </div>
          <div className="flex items-center space-x-3">
            <FaFacebook size={24} className="text-[#1877F3]" />
            <a
              href="https://facebook.com/homepaw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg underline hover:text-[#D4A373]"
            >
              Facebook: HomePaw
            </a>
          </div>
          <div className="flex items-center space-x-3">
            <FaLine size={24} className="text-green-500" />
            <span className="text-lg">Line ID: @homepaw</span>
          </div>
        </div>
      </div>
    </div>
  );
}
