import React, { useEffect, useState } from "react";
import { Settings as SettingsIcon, Home, Clock, Utensils, Shield, Check, Save } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { fetchSettings, saveSettings } from "@/api/settings";
import { getCurrentUser } from "@/api/auth";
import { toast } from "sonner";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"general" | "booking" | "account">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentUser = getCurrentUser() || { name: "Administrator", email: "admin@casanest.com" };

  const [settings, setSettingsState] = useState<Record<string, string>>({
    homestay_name: "Casa Nest Homestay",
    phone: "+91 84000 95434, +91 93369 41261",
    email: "Info@casanesthomestay.in",
    instagram: "https://www.instagram.com/casa_nest__?stkn=eWU0M3Ryb3lvZjkx&utm_source=qr",
    address: "B23/33 Plot 58, Gurudham Colony, Near PMO Office, Varanasi, Uttar Pradesh",
    check_in_time: "12:00",
    check_out_time: "11:00",
    cancellation_policy: "Free cancellation up to 48 hours before check-in.",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSettings();
      if (data && Object.keys(data).length > 0) {
        setSettingsState((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saveSettings(settings);
      toast.success("Homestay settings saved successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Homestay Settings"
      subtitle="Configure Casa Nest property details, stay policies & administrative access"
    >
      <div className="space-y-6 text-xs max-w-4xl">
        {/* Settings Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#20352b]/10 pb-3">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold transition-all ${
              activeTab === "general"
                ? "bg-[#20352b] text-[#fbf8f1]"
                : "text-[#666960] hover:text-[#20352b] bg-[#fbf8f1]"
            }`}
          >
            <Home size={14} />
            <span>General Homestay</span>
          </button>
          <button
            onClick={() => setActiveTab("booking")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold transition-all ${
              activeTab === "booking"
                ? "bg-[#20352b] text-[#fbf8f1]"
                : "text-[#666960] hover:text-[#20352b] bg-[#fbf8f1]"
            }`}
          >
            <Clock size={14} />
            <span>Stay & Check-in Policy</span>
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold transition-all ${
              activeTab === "account"
                ? "bg-[#20352b] text-[#fbf8f1]"
                : "text-[#666960] hover:text-[#20352b] bg-[#fbf8f1]"
            }`}
          >
            <Shield size={14} />
            <span>Admin Account</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Homestay Profile */}
          {activeTab === "general" && (
            <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-serif text-[#20352b]">Property Identification</h3>
                <p className="text-xs text-[#77766c]">Basic contact and location parameters</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                    Property Name
                  </label>
                  <input
                    type="text"
                    value={settings.homestay_name || ""}
                    onChange={(e) => setSettingsState({ ...settings, homestay_name: e.target.value })}
                    className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={settings.phone || ""}
                    onChange={(e) => setSettingsState({ ...settings, phone: e.target.value })}
                    className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                  Public Contact Email
                </label>
                <input
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => setSettingsState({ ...settings, email: e.target.value })}
                  className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                  Official Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.instagram || ""}
                  onChange={(e) => setSettingsState({ ...settings, instagram: e.target.value })}
                  placeholder="https://www.instagram.com/..."
                  className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                  Physical Address
                </label>
                <textarea
                  rows={2}
                  value={settings.address || ""}
                  onChange={(e) => setSettingsState({ ...settings, address: e.target.value })}
                  className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>
            </div>
          )}

          {/* Booking Rules */}
          {activeTab === "booking" && (
            <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-serif text-[#20352b]">Stay & Check-in Rules</h3>
                <p className="text-xs text-[#77766c]">Define standard check-in/out times & policies</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                    Standard Check-in Time
                  </label>
                  <input
                    type="time"
                    value={settings.check_in_time || "14:00"}
                    onChange={(e) => setSettingsState({ ...settings, check_in_time: e.target.value })}
                    className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                    Standard Check-out Time
                  </label>
                  <input
                    type="time"
                    value={settings.check_out_time || "11:00"}
                    onChange={(e) => setSettingsState({ ...settings, check_out_time: e.target.value })}
                    className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                  Cancellation Policy Text
                </label>
                <textarea
                  rows={3}
                  value={settings.cancellation_policy || ""}
                  onChange={(e) => setSettingsState({ ...settings, cancellation_policy: e.target.value })}
                  className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>
            </div>
          )}

          {/* Account Profile */}
          {activeTab === "account" && (
            <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-serif text-[#20352b]">Administrator Credentials</h3>
                <p className="text-xs text-[#77766c]">Logged in as administrative manager</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#20352b] text-[#c8a36a] flex items-center justify-center font-serif text-lg font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#20352b]">{currentUser.name}</p>
                  <p className="text-xs text-[#77766c]">{currentUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                  New Admin Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password to update..."
                  className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="button button-dark px-6 py-2.5 text-xs flex items-center gap-2"
            >
              <Save size={15} />
              <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
