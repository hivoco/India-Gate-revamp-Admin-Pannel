"use client";

import { useEffect, useState } from "react";
import { getContacts } from "../../api/contact";
import type { Contact, tedResponse } from "../../types";
import Pagination from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";
import { X, Mail, Phone, Calendar, User, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactsPage() {
  const [data, setData] = useState<tedResponse<Contact> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);

  const perPage = 10;

  useEffect(() => {
    let active = true;

    getContacts(page, perPage)
      .then((res) => {
        if (active) setData(res.data.data);
      })
      .catch(() => {
        if (active) toast.error("Failed to load contacts");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Contact Submissions
      </h2>

      <div className="bg-white rounded-3xl border border-[#E7E2DC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF8F6] border-b border-[#E7E2DC]">
              <tr>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  #
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Name
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Email
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Contact No
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Message
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No contacts found
                  </td>
                </tr>
              ) : (
                data?.items.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="hover:bg-[#FAF8F6] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(page - 1) * (data?.per_page || 20) + i + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#2E211B]">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6A5A50]">
                      {c.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6A5A50]">
                      {c.mobile_no || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6A5A50] max-w-xs truncate">
                      {c.message}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8A7A70]">
                      {new Date(c.created_at).toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              page={page}
              totalPages={data.total_pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      <Modal open={selected !== null} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">
                Contact Details
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={18} className="text-[#6B2D1F] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-800">
                    {selected.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={18} className="text-[#6B2D1F] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {selected.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={18} className="text-[#6B2D1F] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Contact No</p>
                  <p className="text-sm text-gray-800">
                    {selected.mobile_no ? (
                      <a
                        href={`tel:${selected.mobile_no}`}
                        className="text-blue-600 hover:underline"
                      >
                        {selected.mobile_no}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-[#6B2D1F] mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">Submitted On</p>
                  <p className="text-sm text-gray-800">
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare size={18} className="text-[#6B2D1F] mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Message</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap bg-[#FAF8F6] rounded-lg p-3 mt-1">
                    {selected.message}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <a
                href={`mailto:${selected.email}?subject=Re: Contact Form Submission&body=Hi ${selected.name},%0A%0A`}
                className="px-5 py-3 rounded-2xl border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition flex items-center gap-2"
              >
                <Mail size={16} />
                Reply via Email
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
