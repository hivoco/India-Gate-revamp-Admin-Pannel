"use client";

import { useEffect, useState } from "react";
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../../api/admins";
import type { Admin, tedResponse } from "../../types";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";
import { ADMIN_SECTIONS } from "../../lib/constants/admin-sections";
import { Plus, Edit, Trash2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import PasswordInput from "@/app/components/ui/PasswordInput";

interface AdminForm {
  email: string;
  password: string;
  permissions: string[];
}

// a new admin starts with every section ticked, untick whatever they should
// not reach. an empty list is still valid, it just leaves them with My Account
const emptyForm: AdminForm = {
  email: "",
  password: "",
  permissions: ADMIN_SECTIONS.map((section) => section.key),
};

export default function AdminsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<tedResponse<Admin> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const perPage = 10;

  useEffect(() => {
    let active = true;

    getAdmins(page, perPage)
      .then((res) => {
        if (active) setData(res.data.data);
      })
      .catch(() => {
        if (active) toast.error("Failed to load admins");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  if (user?.role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-500">
          Only superadmins can manage admin accounts.
        </p>
      </div>
    );
  }

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const togglePermission = (key: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, key]
        : prev.permissions.filter((existing) => existing !== key),
    }));
  };

  const openEdit = (admin: Admin) => {
    // a null permissions column means the account predates per section access
    // and still has everything, so show every box ticked
    const current = Array.isArray(admin.permissions)
      ? admin.permissions
      : admin.permissions === null || admin.permissions === undefined
        ? ADMIN_SECTIONS.map((section) => section.key)
        : [];

    setForm({ email: admin.email, password: "", permissions: current });
    setEditing(admin);
  };

  const handleSave = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await updateAdmin(editing.id, {
          email: form.email.trim(),
          password: form.password,
          permissions: form.permissions,
        });
        toast.success("Admin updated");
      } else {
        await createAdmin({
          email: form.email.trim(),
          password: form.password,
          permissions: form.permissions,
        });
        toast.success("Admin created");
      }
      setCreateOpen(false);
      setEditing(null);
      getAdmins(page, perPage).then((res) => setData(res.data.data));
    } catch {
      toast.error(editing ? "Failed to update admin" : "Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteAdmin(deleteId);
      toast.success("Admin deleted");
      getAdmins(page, perPage).then((res) => setData(res.data.data));
    } catch {
      toast.error("Failed to delete admin");
    }

    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2E211B]">Admins</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition cursor-pointer"
        >
          <Plus size={18} />
          Add Admin
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E7E2DC] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF8F6] border-b border-[#E7E2DC]">
              <tr>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  #
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Email
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Role
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Created
                </th>
                <th className="px-6 py-5 text-sm font-semibold text-[#5B4035] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No admins found
                  </td>
                </tr>
              ) : (
                data?.items.map((a, i) => {
                  const isSuperadmin = a.role === "superadmin";

                  return (
                    <tr
                      // the two tables number their rows separately, so an id
                      // on its own is not unique across this list
                      key={`${a.role ?? "admin"}-${a.id}`}
                      className="hover:bg-[#FAF8F6] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {(page - 1) * (data?.per_page || 10) + i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[#2E211B]">
                        {a.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                            isSuperadmin
                              ? "bg-[#F3E8F5] text-[#7B3F8F]"
                              : "bg-[#F1ECE7] text-[#6B2D1F]"
                          }`}
                        >
                          {a.role ?? "admin"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(a.created_at).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-6 py-4">
                        {isSuperadmin ? (
                          // editing and deleting here both target the admins
                          // table, and removing the last superadmin would lock
                          // everyone out. a superadmin changes its own password
                          // from My Account instead
                          <span className="text-xs text-gray-400">
                            Manage from My Account
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(a)}
                              className="p-3 border border-[#D7CFC8] rounded-xl text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteId(a.id)}
                              className="p-3 border border-[#D7CFC8] rounded-xl text-[#6B2D1F] hover:bg-[#F8F4F0] transition cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
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

      <Modal
        open={createOpen || editing !== null}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {editing ? "Edit Admin" : "Add Admin"}
        </h3>
        <p className="text-gray-500 mb-6">
          {editing
            ? "Leave the password blank to keep the current one."
            : "Enter the email and password for the new admin account."}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editing}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent"
              placeholder={editing ? "Leave blank to keep current" : "Enter password"}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Sections this admin can access
              </label>

              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      permissions: ADMIN_SECTIONS.map((s) => s.key),
                    }))
                  }
                  className="text-[#6B2D1F] hover:underline cursor-pointer"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, permissions: [] }))
                  }
                  className="text-gray-500 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ADMIN_SECTIONS.map((section) => {
                const checked = form.permissions.includes(section.key);

                return (
                  <label
                    key={section.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                      checked
                        ? "border-[#6B2D1F] bg-[#F8F4F0]"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        togglePermission(section.key, e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#457e7f] focus:ring-[#457e7f]"
                    />
                    <span className="text-sm text-gray-700">
                      {section.label}
                    </span>
                  </label>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Only the ticked sections appear in this admin&apos;s sidebar, and
              the api refuses the rest. Tick none and they can still sign in,
              but only to My Account. Admins is superadmin only and is never
              assignable.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setCreateOpen(false);
              setEditing(null);
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#672E1F] text-white rounded-lg hover:bg-[#7d3b28] disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </button>
        </div>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Delete Admin
        </h3>
        <p className="text-gray-500 mb-6">
          Are you sure you want to delete this admin? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}