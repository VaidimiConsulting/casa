import React, { useEffect, useState } from "react";
import { Eye, User, Calendar, ShoppingBag, CreditCard, Mail, Phone } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import { fetchCustomers, fetchCustomerDetails, Customer, CustomerDetails } from "@/api/customers";
import { toast } from "sonner";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (id: number) => {
    try {
      setIsDetailModalOpen(true);
      setDetailLoading(true);
      const data = await fetchCustomerDetails(id);
      setSelectedCustomer(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch customer profile.");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#20352b] text-[#c8a36a] flex items-center justify-center font-serif text-xs font-semibold shrink-0">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-sm text-[#20352b] block">{c.name}</span>
            <span className="text-[11px] text-[#77766c]">{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (c) => <span className="font-mono text-xs">{c.phone || "—"}</span>,
    },
    {
      key: "total_bookings",
      header: "Bookings",
      render: (c) => (
        <span className="font-mono font-medium text-xs">{c.total_bookings || 0} stay(s)</span>
      ),
    },
    {
      key: "total_orders",
      header: "Food Orders",
      render: (c) => (
        <span className="font-mono font-medium text-xs">{c.total_orders || 0} order(s)</span>
      ),
    },
    {
      key: "total_spent",
      header: "Total Spent",
      render: (c) => (
        <span className="font-mono font-semibold text-sm text-[#20352b]">
          ₹{Number(c.total_spent).toLocaleString()}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Joined Date",
      render: (c) => (
        <span className="text-[11px] text-[#77766c]">
          {new Date(c.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (c) => (
        <button
          onClick={() => handleOpenDetails(c.id)}
          className="button button-light border border-[#20352b]/15 px-3 py-1.5 text-xs flex items-center gap-1.5 ml-auto"
        >
          <Eye size={13} />
          <span>View Profile</span>
        </button>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Customer Management"
      subtitle="View customer directories, stay records, food orders & total spend"
      actions={
        <button
          onClick={loadCustomers}
          className="button button-light border border-[#20352b]/15 px-4 py-2 text-xs"
        >
          Refresh List
        </button>
      }
    >
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          searchPlaceholder="Search customer by name, email or phone..."
          searchKey={(c) => `${c.name} ${c.email} ${c.phone || ""}`}
          emptyMessage="No customer accounts found."
        />
      </div>

      {/* Customer 360 Profile Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedCustomer?.name || "Customer Profile"}
        subtitle="Complete stay, dining, and transaction history"
        maxWidth="2xl"
      >
        {detailLoading ? (
          <div className="py-12 text-center text-xs text-[#77766c]">
            Loading customer history...
          </div>
        ) : selectedCustomer ? (
          <div className="space-y-5 text-xs">
            {/* Top Stat Summary */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10 text-center">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                  Stays Booked
                </span>
                <span className="text-lg font-serif font-bold text-[#20352b]">
                  {selectedCustomer.bookings?.length || 0}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                  Meals Ordered
                </span>
                <span className="text-lg font-serif font-bold text-[#20352b]">
                  {selectedCustomer.orders?.length || 0}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                  Total Spent
                </span>
                <span className="text-lg font-serif font-bold text-[#20352b]">
                  ₹{Number(selectedCustomer.total_spent).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Stay History */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-mono font-semibold text-[#c8a36a] block">
                Homestay Reservations ({selectedCustomer.bookings?.length || 0})
              </span>
              {!selectedCustomer.bookings || selectedCustomer.bookings.length === 0 ? (
                <p className="text-[#77766c] italic">No homestay reservations yet.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedCustomer.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-[#fbf8f1] border border-[#20352b]/8 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-[#20352b]">{b.room_name || "Room Stay"}</p>
                        <p className="text-[11px] text-[#77766c]">
                          {new Date(b.check_in).toLocaleDateString()} – {new Date(b.check_out).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-[#20352b] block">
                          ₹{Number(b.total_amount).toLocaleString()}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
