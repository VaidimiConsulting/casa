import { useEffect, useState } from "react";
import ReceptionLayout from "@/components/reception/ReceptionLayout";
import { RefreshCw, Search, MailOpen } from "lucide-react";
import api from "@/api/axios";

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-red-100 text-red-700",
  read: "bg-blue-100 text-blue-700",
  replied: "bg-green-100 text-green-700",
};

export default function ReceptionMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => { fetchMessages(); }, []);

  async function fetchMessages() {
    try {
      setLoading(true);
      const res = await api.get("/contact");
      setMessages(res.data.messages || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markAs(id: number, status: string) {
    setUpdating(id);
    try {
      await api.put(`/contact/${id}`, { status });
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = messages.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  return (
    <ReceptionLayout
      title="Messages"
      subtitle={`${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`}
      actions={
        <button onClick={fetchMessages} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f0e8] border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      }
    >
      <div className="grid lg:grid-cols-2 gap-5">
        {/* List */}
        <div>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
            <input
              type="text"
              placeholder="Search by name, email or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#fbf8f1] border border-[#20352b]/15 rounded-2xl text-sm text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#20352b] transition-all"
            />
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-2xl overflow-hidden divide-y divide-[#20352b]/6">
            {loading ? (
              <div className="py-10 text-center text-xs text-[#77766c]">Loading messages...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#77766c]">No messages found.</div>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelected(m); if (m.status === "unread") markAs(m.id, "read"); }}
                  className={`w-full text-left px-4 py-3.5 hover:bg-[#f5f0e8]/60 transition-colors ${selected?.id === m.id ? "bg-[#f5f0e8]/80" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${m.status === "unread" ? "font-semibold text-[#20352b]" : "text-[#20352b]"}`}>
                        {m.name}
                      </p>
                      <p className="text-[11px] text-[#77766c] truncate">{m.subject || "No subject"}</p>
                      <p className="text-[10px] text-[#77766c]/60 mt-0.5">{new Date(m.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold shrink-0 ${STATUS_COLORS[m.status] || "bg-gray-100 text-gray-600"}`}>
                      {m.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div>
          {selected ? (
            <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-2xl p-5 h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-serif text-lg text-[#20352b]">{selected.name}</h2>
                  <a href={`mailto:${selected.email}`} className="text-xs text-[#c8a36a] hover:underline">{selected.email}</a>
                  {selected.phone && <p className="text-xs text-[#77766c] mt-0.5">{selected.phone}</p>}
                </div>
                <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[selected.status] || "bg-gray-100 text-gray-600"}`}>
                  {selected.status}
                </span>
              </div>
              {selected.subject && (
                <div className="mb-3 bg-[#f5f0e8]/60 rounded-xl p-3">
                  <p className="text-[10px] font-mono uppercase text-[#77766c] mb-1">Subject</p>
                  <p className="text-sm font-medium text-[#20352b]">{selected.subject}</p>
                </div>
              )}
              <div className="mb-5 bg-[#f5f0e8]/60 rounded-xl p-3">
                <p className="text-[10px] font-mono uppercase text-[#77766c] mb-1">Message</p>
                <p className="text-sm text-[#20352b] leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${selected.subject || "Your message to Casa Nest"}`}
                  onClick={() => markAs(selected.id, "replied")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#20352b] hover:bg-[#2a4535] transition-colors"
                >
                  <MailOpen size={13} /> Reply via Email
                </a>
                {selected.status !== "replied" && (
                  <button
                    onClick={() => markAs(selected.id, "replied")}
                    disabled={updating === selected.id}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    Mark as Replied
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center">
              <MailOpen size={32} className="text-[#20352b]/20 mb-3" />
              <p className="font-serif text-base text-[#20352b]/50">Select a message to read</p>
            </div>
          )}
        </div>
      </div>
    </ReceptionLayout>
  );
}
