"use client";

import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../../api/settings";
import {
  SETTING_FIELDS,
  SETTING_GROUPS,
} from "../../lib/constants/site-settings";
import HomeSlides from "../../components/HomeSlides";
import toast from "react-hot-toast";

const inputClass =
  "w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#457e7f] focus:border-transparent";

export default function SitePage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await getSettings();
        const data: Record<string, string> = res.data?.data ?? {};

        if (cancelled) return;

        setValues(data);
        setSaved(data);
      } catch {
        if (!cancelled) toast.error("Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = SETTING_FIELDS.some(
    (f) => (values[f.key] ?? "") !== (saved[f.key] ?? ""),
  );

  const handleSave = async () => {
    setSaving(true);

    // every field is sent, so clearing one reaches the api as an empty string
    // and removes the override
    const payload: Record<string, string> = {};
    for (const f of SETTING_FIELDS) payload[f.key] = values[f.key] ?? "";

    try {
      await saveSettings(payload);
      setSaved({ ...values });
      toast.success("Saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#2E211B] mb-1">
            Home &amp; Footer
          </h2>
          <p className="text-sm text-gray-500 max-w-2xl">
            Content on the home page and the footer links. Leave a field blank
            and the site keeps what it ships with. Changes show up within five
            minutes, no redeploy needed.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="shrink-0 px-6 py-2.5 rounded-lg border border-[#6B2D1F] text-[#6B2D1F] bg-white hover:bg-[#6B2D1F] hover:text-white transition disabled:opacity-40 cursor-pointer"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      <HomeSlides />

      {SETTING_GROUPS.map((group) => {
        const fields = SETTING_FIELDS.filter((f) => f.group === group);

        if (!fields.length) return null;

        return (
          <div
            key={group}
            className="bg-white rounded-3xl border border-[#E7E2DC] shadow-sm p-6 mb-6"
          >
            <h3 className="text-sm font-semibold text-[#5B4035] uppercase mb-4">
              {group}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {fields.map((field) => {
                const value = values[field.key] ?? "";
                const overridden = Boolean(saved[field.key]);

                return (
                  <div
                    key={field.key}
                    className={field.type === "textarea" ? "lg:col-span-2" : ""}
                  >
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {overridden && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EDF5E8] text-[#3F8F2B] font-medium">
                          custom
                        </span>
                      )}
                    </label>

                    {field.type === "textarea" ? (
                      <textarea
                        rows={4}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          setValues((p) => ({ ...p, [field.key]: e.target.value }))
                        }
                        className={inputClass}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          setValues((p) => ({ ...p, [field.key]: e.target.value }))
                        }
                        className={inputClass}
                      />
                    )}

                    {field.help && (
                      <p className="mt-1 text-xs text-gray-500">{field.help}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
