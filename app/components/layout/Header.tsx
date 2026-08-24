"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
// import { useNavigate } from 'react-router-dom';
import { useRouter } from "next/navigation";

export default function Header() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-[#E7E2DC] flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-[#2E211B]">Admin Panel</h1>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
      >
        <LogOut size={18} />
        Logout
      </button>
    </header>
  );
}
