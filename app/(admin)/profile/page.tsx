"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/app/api/auth";
import { useAuth } from "@/app/context/AuthContext";
import { KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import PasswordInput from "@/app/components/ui/PasswordInput";

const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("The two new passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await changePassword(currentPassword, newPassword);

      toast.success("Password updated, please sign in again");

      // the password that minted this session is gone, so the session goes
      // with it rather than being left running on stale credentials
      logout();
      router.replace("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Account</h2>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 max-w-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="text-lg font-medium text-[#2E211B]">
              {user?.email ?? "—"}
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#F1ECE7] text-[#6B2D1F] capitalize">
            {user?.role ?? "—"}
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-6 space-y-6 max-w-xl"
      >
        <div className="flex items-center gap-2 text-[#6B2D1F]">
          <KeyRound size={18} />
          <h3 className="text-lg font-semibold">Change password</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current password
          </label>
          <PasswordInput
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm new password
          </label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className={inputClass}
          />
        </div>

        <p className="text-xs text-gray-500">
          You will be signed out once the password changes, and any other
          session signed in as this account stops working too.
        </p>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
