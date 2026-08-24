"use client";

import { useState } from "react";
// import { us } from 'react-router-dom';
import { useRouter } from "next/navigation";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import PasswordInput from "@/app/components/ui/PasswordInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setToken, setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      // Checking that frontend receiving the accessToken token

      // console.log(res.data)
      const accessToken = res.data?.data?.accessToken;
      const user = res.data?.data?.user;
      // const superadmin = res.data?.superadmin;

      if (accessToken && user) {
        setToken(accessToken);
        setUser(user);
      }
      toast.success("Login successful");
      router.replace("/dashboard");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#672E1F]">
            INDIA GATE BASMATI RICE
          </h1>
          <p className="text-gray-500 mt-2">Sign in to admin panel</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#672E1F] text-white py-2.5 rounded-lg font-medium hover:bg-[#672E1F] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
