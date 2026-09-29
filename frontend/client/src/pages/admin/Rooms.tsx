import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  BedDouble,
  Check,
  X,
  Sparkles,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Percent,
  RefreshCw,
  Tag,
  Lock,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable, { Column } from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import { fetchRooms, createRoom, updateRoom, deleteRoom, Room } from "@/api/rooms";
import { uploadRoomImage } from "@/api/upload";
import { toast } from "sonner";

const standardAmenities = [
  "King Bed",
  "Queen Bed",
  "Twin Beds",
  "Wi-Fi",
  "AC",
  "Hot Water",
  "Wardrobe",
  "Work Desk",
  "Garden View",
  "Balcony",
  "Cultural Decor",
  "Breakfast Included",
  "Room Service",
];

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Room>>({
    name: "",
    room_type: "Deluxe",
    description: "",
    price_per_night: 3500,
    capacity: 2,
    amenities: ["King Bed", "Wi-Fi", "AC", "Hot Water"],
    image: "",
    status: "available",
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await fetchRooms();
      const sorted = [...data].sort((a, b) => {
        const numA = parseInt((a.name.match(/\d+/) || ["999"])[0], 10);
        const numB = parseInt((b.name.match(/\d+/) || ["999"])[0], 10);
        return numA - numB;
      });
      setRooms(sorted);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedRoom(null);
    setFormData({
      name: "",
      room_type: "Deluxe",
      description: "",
      price_per_night: 3500,
      capacity: 2,
      amenities: ["King Bed", "Wi-Fi", "AC", "Hot Water"],
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=88",
      status: "available",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      room_type: room.room_type || "Deluxe",
      description: room.description || "",
      price_per_night: Number(room.price_per_night),
      capacity: room.capacity || 2,
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
      image: room.image || "",
      status: room.status,
    });
    setIsModalOpen(true);
  };

  const handleToggleAmenity = (amenity: string) => {
    const current = formData.amenities || [];
    if (current.includes(amenity)) {
      setFormData({ ...formData, amenities: current.filter((a: string) => a !== amenity) });
    } else {
      setFormData({ ...formData, amenities: [...current, amenity] });
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    try {
      setUploadingImage(true);
      const res = await uploadRoomImage(file);
      setFormData((prev) => ({ ...prev, image: res.url }));
      toast.success("Room image uploaded successfully.");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload image. Try typing image URL instead.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedRoom) {
        await updateRoom(selectedRoom.id, formData);
        toast.success("Room updated successfully.");
      } else {
        await createRoom(formData);
        toast.success("New room created successfully.");
      }
      setIsModalOpen(false);
      loadRooms();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save room.");
    }
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;
    try {
      await deleteRoom(roomToDelete.id);
      toast.success("Room deleted successfully.");
      setIsDeleteModalOpen(false);
      loadRooms();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete room.");
    }
  };

  const columns: Column<Room>[] = [
    {
      key: "image",
      header: "Room Photo",
      render: (room) => (
        <div className="w-16 h-12 rounded-xl overflow-hidden bg-[#efe7db] shrink-0 border border-[#20352b]/15 shadow-xs">
          {room.image ? (
            <img
              src={room.image}
              alt={room.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#77766c]">
              <ImageIcon size={18} />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Room Name & Details",
      render: (room) => (
        <div>
          <span className="font-semibold text-sm text-[#20352b] block">{room.name}</span>
          <span className="text-[11px] text-[#77766c]">
            {room.room_type || "Deluxe"} • Max {room.capacity} Guests
          </span>
        </div>
      ),
    },
    {
      key: "price_per_night",
      header: "Fixed Price / Night",
      render: (room) => (
        <div className="space-y-1">
          <span className="font-mono font-bold text-base text-[#20352b] block">
            ₹{Number(room.price_per_night).toLocaleString("en-IN")}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#20352b]/10 text-[#20352b] font-medium">
            <Lock size={10} className="text-[#c8a36a]" /> Fixed Rate
          </span>
        </div>
      ),
    },
    {
      key: "amenities",
      header: "Key Amenities",
      render: (room) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(room.amenities || []).slice(0, 3).map((a, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-md bg-[#f5f0e8] text-[#20352b] border border-[#20352b]/10"
            >
              {a}
            </span>
          ))}
          {(room.amenities || []).length > 3 && (
            <span className="text-[10px] text-[#77766c] self-center">
              +{(room.amenities || []).length - 3} more
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Live Status & Free Date",
      render: (room) => {
        const occ = room.occupancy;
        const isOccupied = occ?.is_occupied;
        return (
          <div className="space-y-1 min-w-[210px]">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isOccupied
                    ? "bg-red-100 text-red-800 border-red-300"
                    : "bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOccupied ? "bg-red-600 animate-pulse" : "bg-emerald-600"
                  }`}
                />
                {isOccupied ? "OCCUPIED" : "VACANT"}
              </span>
            </div>

            {isOccupied ? (
              <div className="text-[11px] text-[#77766c] space-y-0.5">
                <p className="text-[#20352b] font-medium">
                  Free hoga: <strong className="text-red-700 font-mono">{occ?.free_on_date}</strong> (11:00 AM)
                </p>
                {occ?.days_until_free !== undefined && (
                  <span className="text-[10px] font-medium text-red-600 block">
                    Free in {occ.days_until_free} day{occ.days_until_free > 1 ? "s" : ""}
                  </span>
                )}
                {occ?.current_booking && (
                  <p className="text-[10px] text-[#77766c] truncate">
                    Guest: <strong className="text-[#20352b]">{occ.current_booking.guest_name}</strong>
                  </p>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-[#77766c] space-y-0.5">
                <span className="text-emerald-700 font-medium block">Available Now</span>
                {occ?.next_booking ? (
                  <span className="text-[10px] text-[#77766c] block">
                    Next stay: {occ.next_booking.check_in} (Free for {occ.next_booking.days_until_checkin}d)
                  </span>
                ) : (
                  <span className="text-[10px] text-[#77766c] block">No upcoming bookings (Open)</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (room) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(room)}
            className="p-1.5 rounded-lg text-[#20352b] hover:bg-[#20352b]/8 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
            title="Edit room properties"
          >
            <Edit2 size={15} />
            <span className="hidden sm:inline text-[11px]">Edit Details</span>
          </button>
          <button
            onClick={() => {
              setRoomToDelete(room);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Delete room"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Homestay Rooms & Occupancy"
      subtitle="Manage homestay rooms, amenities, photos, live occupancy and guest reservations with fixed standard rates"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadRooms}
            className="p-2 rounded-xl border border-[#20352b]/15 bg-white text-[#20352b] hover:bg-[#fbf8f1] transition-all flex items-center justify-center shadow-xs cursor-pointer"
            title="Refresh Rooms"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#c8a36a]" : ""} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add New Room</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Live Occupancy KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#fbf8f1] border border-[#20352b]/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#77766c] block">Total Rooms</span>
              <strong className="text-base text-[#20352b]">{rooms.length} Homestay Rooms</strong>
            </div>
            <BedDouble size={20} className="text-[#c8a36a]" />
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-emerald-800 font-semibold block">Vacant (Khali)</span>
              <strong className="text-base text-emerald-800 font-mono">
                {rooms.filter((r) => !r.occupancy?.is_occupied).length} Available Now
              </strong>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>

          <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-red-800 font-semibold block">Occupied (Booked)</span>
              <strong className="text-base text-red-800 font-mono">
                {rooms.filter((r) => r.occupancy?.is_occupied).length} In Stay
              </strong>
            </div>
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fbf8f1] border border-[#20352b]/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#77766c] block">Live Occupancy Rate</span>
              <strong className="text-base text-[#20352b]">
                {rooms.length > 0 ? Math.round((rooms.filter((r) => r.occupancy?.is_occupied).length / rooms.length) * 100) : 0}%
              </strong>
            </div>
            <Percent size={18} className="text-[#20352b]" />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rooms}
          loading={loading}
          searchPlaceholder="Search rooms by name or type..."
          searchKey={(r) => `${r.name} ${r.room_type || ""}`}
          filterOptions={[
            { label: "Vacant (Khali) Only", value: "vacant" },
            { label: "Occupied (Booked) Only", value: "occupied" },
          ]}
          filterKey={(r) => r.occupancy?.occupancy_status || "vacant"}
          emptyMessage="No rooms found. Click 'Add New Room' to create one."
        />
      </div>

      {/* Add / Full Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoom ? `Edit Room: ${selectedRoom.name}` : "Create New Room"}
        subtitle="Configure room properties, amenities, and visuals"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Room Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Casa Luz"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Room Type
              </label>
              <select
                value={formData.room_type || "Deluxe"}
                onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                <option value="Deluxe">Deluxe Room</option>
                <option value="Premium Suite">Premium Suite</option>
                <option value="Heritage Suite">Heritage Suite</option>
                <option value="Moonlight Suite">Moonlight Suite</option>
                <option value="Bohemian Studio">Bohemian Studio</option>
                <option value="Standard">Standard Room</option>
              </select>
            </div>
          </div>

          {/* Fixed Room Rate Display (Locked - Policy Fixed) */}
          <div className="p-3.5 rounded-2xl bg-[#efe7db]/50 border border-[#20352b]/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] text-[11px]">
                  Fixed Price / Night
                </label>
                <span className="text-[10px] text-[#77766c]">Standard fixed homestay rate (Locked & Non-Editable)</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#20352b]/10 text-[#20352b] font-semibold border border-[#20352b]/15">
                <Lock size={12} className="text-[#c8a36a]" /> Rate Fixed
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 bg-white/70 px-3.5 py-2 rounded-xl border border-[#20352b]/10">
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-lg font-bold text-[#20352b]">
                  ₹{Number(formData.price_per_night || 3500).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-[#77766c]">/ night</span>
              </div>
              <span className="text-[10px] text-[#77766c] italic">
                🔒 Fixed by Homestay Policy
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Max Capacity (Guests)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.capacity || 2}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Status / Availability
              </label>
              <select
                value={formData.status || "available"}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                <option value="available">Available for Booking</option>
                <option value="unavailable">Unavailable (Under Maintenance)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] text-[11px]">
                Room Photo *
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-[#c8a36a] hover:underline font-medium"
              >
                {showUrlInput ? "Hide URL Input" : "Paste Image URL Instead"}
              </button>
            </div>

            {/* Upload Area */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#f5f0e8]/60 border-2 border-dashed border-[#20352b]/20 hover:border-[#20352b]/40 rounded-2xl p-4 transition-colors">
              {formData.image ? (
                <div className="relative w-28 h-24 rounded-xl overflow-hidden shrink-0 border border-[#20352b]/15 bg-white">
                  <img
                    src={formData.image}
                    alt="Room Preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                    Current
                  </span>
                </div>
              ) : (
                <div className="w-28 h-24 rounded-xl flex flex-col items-center justify-center shrink-0 bg-[#efe7db] text-[#77766c]">
                  <ImageIcon size={28} className="opacity-50" />
                  <span className="text-[10px] mt-1">No Image</span>
                </div>
              )}

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-xs font-semibold text-[#20352b]">
                  Upload room picture from your computer
                </p>
                <p className="text-[11px] text-[#77766c]">
                  Supports JPG, PNG, WEBP up to 10MB
                </p>

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <label
                    htmlFor="room-file-input"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      uploadingImage
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-[#20352b] text-[#fbf8f1] hover:bg-[#2e4c3e]"
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={14} />
                        <span>{formData.image ? "Change / Upload New Photo" : "Choose File from Computer"}</span>
                      </>
                    )}
                  </label>
                  <input
                    id="room-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    disabled={uploadingImage}
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image: "" });
                        toast.success("Room photo removed. You can upload a new photo or save changes.");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {showUrlInput && (
              <div className="pt-1">
                <input
                  type="url"
                  placeholder="Or paste external image URL: https://..."
                  value={formData.image || ""}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Room Description & Story
            </label>
            <textarea
              rows={3}
              placeholder="Describe aesthetics, vibe and comfort..."
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-2">
              Select Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {standardAmenities.map((amenity) => {
                const isSelected = (formData.amenities || []).includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleToggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-[#20352b] text-[#fbf8f1] border-[#20352b]"
                        : "bg-[#f5f0e8] text-[#20352b] border-[#20352b]/15 hover:border-[#20352b]"
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#20352b]/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-6 py-2">
              {selectedRoom ? "Save Changes" : "Create Room"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
        maxWidth="sm"
      >
        <div className="text-xs space-y-4">
          <p className="text-[#666960]">
            Are you sure you want to permanently delete{" "}
            <strong className="text-[#20352b]">{roomToDelete?.name}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#20352b]/10">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer"
            >
              Delete Room
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
