import { useEffect, useState } from "react";
import ReceptionLayout from "@/components/reception/ReceptionLayout";
import { Search, Phone, Mail, RefreshCw } from "lucide-react";
import api from "@/api/axios";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  total_bookings: number;
  created_at: string;
}

export default function ReceptionGuests() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const res = await api.get("/customers");
      setCustomers(res.data.customers || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = customers.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <ReceptionLayout
      title="Guest Directory"
      subtitle="All registered guests"
      actions={
        <button onClick={fetchCustomers} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f0e8] border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      }
    >
      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#fbf8f1] border border-[#20352b]/15 rounded-2xl text-sm text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#20352b] transition-all"
        />
      </div>

      {/* Guest Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#77766c] text-sm">Loading guests...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-2xl p-10 text-center">
          <p className="font-serif text-lg text-[#20352b] mb-1">No Guests Found</p>
          <p className="text-xs text-[#77766c]">No guests match your search criteria.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-2xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#20352b] text-[#c8a36a] flex items-center justify-center font-serif text-base font-bold shrink-0">
                  {c.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-semibold text-[#20352b] truncate">{c.name}</h3>
                  <p className="text-[11px] text-[#77766c]">Guest since {new Date(c.created_at).getFullYear()}</p>
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-[11px] text-[#77766c] hover:text-[#20352b] transition-colors">
                  <Mail size={12} /> {c.email}
                </a>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-[11px] text-[#77766c] hover:text-[#20352b] transition-colors">
                    <Phone size={12} /> {c.phone}
                  </a>
                )}
              </div>
              <div className="text-[10px] font-mono uppercase text-[#77766c] bg-[#f5f0e8]/60 rounded-xl px-3 py-2">
                {c.total_bookings || 0} booking{c.total_bookings !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </ReceptionLayout>
  );
}
