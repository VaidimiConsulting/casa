import React, { useEffect, useState } from "react";
import { Eye, Mail, Trash2, Send, Phone, CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import {
  getContactMessages,
  updateContactStatus,
  deleteContactMessage,
  ContactMessage,
} from "@/api/contact";
import { toast } from "sonner";

export default function Messages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getContactMessages();
      setMessages(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load contact messages.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplyText(msg.reply || "");
    setIsDetailModalOpen(true);

    if (msg.status === "unread") {
      try {
        await updateContactStatus(msg.id, { status: "read" });
        loadMessages();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;

    try {
      await updateContactStatus(selectedMessage.id, {
        status: "replied",
        reply: replyText,
      });
      toast.success("Message marked as replied.");
      setIsDetailModalOpen(false);
      loadMessages();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this enquiry?")) return;
    try {
      await deleteContactMessage(id);
      toast.success("Message removed.");
      loadMessages();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete message.");
    }
  };

  const columns: Column<ContactMessage>[] = [
    {
      key: "name",
      header: "Guest Name",
      render: (m) => (
        <div>
          <span className="font-semibold text-sm text-[#20352b] block">{m.name}</span>
          <span className="text-[11px] text-[#77766c]">{m.email}</span>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject & Enquiry",
      render: (m) => (
        <div>
          <span className="font-medium text-[#20352b] block">{m.subject || "General Enquiry"}</span>
          <span className="text-[11px] text-[#77766c] line-clamp-1 max-w-sm">{m.message}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (m) => <span className="font-mono text-xs">{m.phone || "—"}</span>,
    },
    {
      key: "created_at",
      header: "Received",
      render: (m) => (
        <span className="font-mono text-[11px] text-[#77766c]">
          {new Date(m.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenDetails(m)}
            className="p-1.5 rounded-lg text-[#20352b] hover:bg-[#20352b]/8 transition-colors"
            title="Read Message"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleDelete(m.id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Message"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Contact Inbox"
      subtitle="Manage guest enquiries, special requests & feedback messages"
      actions={
        <button
          onClick={loadMessages}
          className="button button-light border border-[#20352b]/15 px-4 py-2 text-xs"
        >
          Refresh Inbox
        </button>
      }
    >
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={messages}
          loading={loading}
          searchPlaceholder="Search messages by name, email, or subject..."
          searchKey={(m) => `${m.name} ${m.email} ${m.subject || ""} ${m.message}`}
          filterOptions={[
            { label: "Unread", value: "unread" },
            { label: "Read", value: "read" },
            { label: "Replied", value: "replied" },
          ]}
          filterKey={(m) => m.status}
          emptyMessage="Inbox is empty. No contact messages received."
        />
      </div>

      {/* Message Reader & Reply Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedMessage?.subject || "Guest Enquiry"}
        subtitle={`From ${selectedMessage?.name || ""} on ${
          selectedMessage?.created_at
            ? new Date(selectedMessage.created_at).toLocaleDateString()
            : ""
        }`}
        maxWidth="md"
      >
        {selectedMessage && (
          <div className="space-y-4 text-xs">
            {/* Guest Details */}
            <div className="p-3.5 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/10 space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#c8a36a] block">
                Sender Information
              </span>
              <p className="font-semibold text-sm text-[#20352b]">{selectedMessage.name}</p>
              <div className="flex flex-wrap gap-4 text-[#77766c] pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail size={12} /> {selectedMessage.email}
                </span>
                {selectedMessage.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} /> {selectedMessage.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Message Body */}
            <div className="p-4 rounded-2xl bg-[#fbf8f1] border border-[#20352b]/10 space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#77766c] block">
                Message Content:
              </span>
              <p className="text-sm text-[#20352b] leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </p>
            </div>

            {/* Reply / Status Form */}
            <form onSubmit={handleSaveReply} className="space-y-3 pt-2">
              <div>
                <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                  Reply Notes / Follow-up Status
                </label>
                <textarea
                  rows={3}
                  placeholder="Record response sent via email/phone..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>

              <div className="pt-2 border-t border-[#20352b]/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="button button-light border border-[#20352b]/15 px-4 py-2"
                >
                  Close
                </button>
                <button type="submit" className="button button-dark px-5 py-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Mark as Replied</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
