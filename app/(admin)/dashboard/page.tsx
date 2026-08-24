"use client";

import { useEffect, useState } from "react";
// import { useNavigate } from 'react-router-dom';
import { useRouter } from "next/navigation";
import { getStats } from "../../api/dashboard";
import type { DashboardStats } from "../../types";
// import AdminLayout from "../components/layout/AdminLayout";
import {
  MessageSquare,
  FileText,
  HelpCircle,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getStats()
      .then((res) => {
        // console.log('Dashboard Response:', res.data);
        setStats(res.data.data);
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading...</div>;
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Total Contacts",
      value: stats.total_contacts,
      icon: Users,
      color: "bg-teal-500",
    },
    {
      label: "Weekly Contacts",
      value: stats.weekly_contacts,
      icon: TrendingUp,
      color: "bg-blue-500",
    },
    {
      label: "Total Blogs",
      value: stats.total_blogs,
      icon: FileText,
      color: "bg-green-500",
    },
    {
      label: "Total FAQs",
      value: stats.total_faqs,
      icon: HelpCircle,
      color: "bg-purple-500",
    },
    {
      label: "Today's Contacts",
      value:
        stats.daily_contacts.length > 0
          ? stats.daily_contacts[stats.daily_contacts.length - 1].count
          : 0,
      icon: MessageSquare,
      color: "bg-orange-500",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4"
          >
            <div className={`${card.color} p-3 rounded-lg text-white`}>
              <card.icon size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Daily Contact Forms (Last 7 Days)
        </h3>
        {stats.daily_contacts.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.daily_contacts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#672E1F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-10">
            No contact data for the last 7 days
          </p>
        )}
      </div>

      {/* Latest 5 Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Contacts */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Contacts</h3>
            <button
              onClick={() => router.push("/contacts")}
              className="text-sm text-[#457e7f] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recent_contacts.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">
                No contacts yet
              </p>
            ) : (
              stats.recent_contacts.map((c) => (
                <div key={c.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(c.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Blogs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Blogs</h3>
            <button
              onClick={() => router.push("/blogs")}
              className="text-sm text-[#457e7f] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recent_blogs.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">
                No blogs yet
              </p>
            ) : (
              stats.recent_blogs.map((b) => (
                <div key={b.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-800">{b.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        b.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {b.is_published ? "Published" : "Draft"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(b.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent FAQs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent FAQs</h3>
            <button
              onClick={() => router.push("/faqs")}
              className="text-sm text-[#457e7f] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recent_faqs.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">
                No FAQs yet
              </p>
            ) : (
              stats.recent_faqs.map((f) => (
                <div key={f.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-800">
                    {f.question}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {f.answer}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
