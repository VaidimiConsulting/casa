import React, { useEffect, useState, useRef } from "react";
import {
  Plus,
  Image as ImageIcon,
  Trash2,
  Eye,
  CheckCircle2,
  RefreshCcw,
  Sparkles,
  UploadCloud,
  X,
  AlertCircle,
  Filter,
  ShieldCheck,
  Check,
  Edit2,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Modal from "@/components/admin/Modal";
import {
  fetchGallery,
  uploadGalleryPhoto,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  toggleGalleryStatus,
  GalleryItem,
} from "@/api/gallery";
import { toast } from "sonner";

const CATEGORIES = [
  "Rooms & Suites",
  "Terrace & Patio",
  "Lounge & Ambiance",
  "Dining & Cafe",
  "Exterior & Balcony",
  "General",
];

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Rooms & Suites");
  const [manualUrl, setManualUrl] = useState("");

  // Edit Modal State (Full CRUD Update)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Rooms & Suites");

  const [editManualUrl, setEditManualUrl] = useState("");
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Preview / Lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const data = await fetchGallery(true); // get all including inactive
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error("Gallery photos load nahi ho payi.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGallery();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setManualUrl("");
      if (!title) {
        // Auto fill title from filename without extension
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleOpenUpload = () => {
    setTitle("");
    setCategory("Homestay & Rooms");
    setSelectedFile(null);
    setPreviewUrl("");
    setManualUrl("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Kripya image ka title dalein.");
      return;
    }

    if (!selectedFile && !manualUrl.trim()) {
      toast.error("Kripya photo select karein ya image URL dalein.");
      return;
    }

    try {
      setUploading(true);
      let finalImageUrl = manualUrl.trim();

      // If file chosen, upload to server
      if (selectedFile) {
        const uploadRes = await uploadGalleryPhoto(selectedFile);
        finalImageUrl = uploadRes.url;
      }

      await createGalleryItem({
        title: title.trim(),
        category,
        image_url: finalImageUrl,
        alt_text: title.trim(),
      });

      toast.success("Photo gallery me successfully add ho gayi!");
      setIsModalOpen(false);
      loadGallery();
    } catch (error) {
      console.error(error);
      toast.error("Photo upload karne me error aaya.");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category || "Homestay & Rooms");
    setEditManualUrl(item.image_url);
    setEditPreviewUrl(item.image_url);
    setEditSelectedFile(null);
    setEditActive(Boolean(item.is_active));
    setIsEditModalOpen(true);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditSelectedFile(file);
      const url = URL.createObjectURL(file);
      setEditPreviewUrl(url);
      setEditManualUrl("");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editTitle.trim()) {
      toast.error("Kripya photo ka title dalein.");
      return;
    }

    if (!editSelectedFile && !editManualUrl.trim()) {
      toast.error("Photo URL ya file hona anivarya hai.");
      return;
    }

    try {
      setIsUpdating(true);
      let finalImageUrl = editManualUrl.trim();

      // If replacement file chosen, upload it
      if (editSelectedFile) {
        const uploadRes = await uploadGalleryPhoto(editSelectedFile);
        finalImageUrl = uploadRes.url;
      }

      await updateGalleryItem(editingItem.id, {
        title: editTitle.trim(),
        category: editCategory,
        image_url: finalImageUrl,
        alt_text: editTitle.trim(),
        is_active: editActive ? 1 : 0,
      });

      toast.success("Gallery photo details successfully update ho gayi!");
      setIsEditModalOpen(false);
      setEditingItem(null);
      loadGallery();
    } catch (error) {
      console.error(error);
      toast.error("Photo update karne me error aaya.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number, itemTitle: string) => {
    if (!window.confirm(`Kya aap "${itemTitle}" photo ko gallery se hatana chahte hain?`)) {
      return;
    }

    try {
      await deleteGalleryItem(id);
      toast.success("Photo gallery se delete ho gayi.");
      setItems(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Photo delete karne me error aaya.");
    }
  };

  const handleToggleStatus = async (item: GalleryItem) => {
    const newStatus = !item.is_active;
    try {
      await toggleGalleryStatus(item.id, newStatus);
      toast.success(newStatus ? "Photo website par live hai" : "Photo website se hide kar di gayi");
      setItems(
        items.map((i) => (i.id === item.id ? { ...i, is_active: newStatus ? 1 : 0 } : i))
      );
    } catch (error) {
      console.error(error);
      toast.error("Status update nahi ho paya.");
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory === "All") return true;
    return item.category === selectedCategory;
  });

  const activeCount = items.filter((i) => Boolean(i.is_active)).length;

  return (
    <AdminLayout
      title="Website Gallery Management"
      subtitle="Upload photos for the website gallery. Uploaded photos appear strictly in the Gallery section."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="button button-light border border-[#20352b]/15 px-3 py-2 text-xs flex items-center gap-1.5"
            title="Refresh Photos"
          >
            <RefreshCcw size={14} className={isRefreshing ? "animate-spin text-[#20352b]" : ""} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenUpload}
            className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Upload Photo</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Safety Guarantee Info Banner */}
        <div className="p-4 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/15 text-[#20352b] flex items-start gap-3">
          <ShieldCheck size={20} className="text-[#c8a36a] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <strong className="font-semibold block text-sm">
              Structured & Safe Gallery Integration
            </strong>
            <p className="text-[#77766c] leading-relaxed">
              Yahan upload ki gayi koi bhi image <strong>sirf aur sirf website ke #gallery section</strong> me hi show hogi. Website ke design me structured aspect-ratio aur automatic grid system laga hua hai, jisse chahe kisi bhi size ya dimension ki photo ho, website ka design <strong>hamesha symmetrical, clean aur professional</strong> rahega.
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs">
            <span className="text-[11px] uppercase font-mono tracking-wider font-bold text-[#77766c] block">
              Total Uploaded Photos
            </span>
            <div className="text-2xl font-serif font-bold text-[#20352b] mt-1">
              {items.length} Photos
            </div>
            <span className="text-[11px] text-[#77766c] mt-0.5 block">Stored in gallery database</span>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 shadow-xs">
            <span className="text-[11px] uppercase font-mono tracking-wider font-bold text-emerald-800 block">
              Active on Website
            </span>
            <div className="text-2xl font-serif font-bold text-emerald-950 mt-1">
              {activeCount} Live Photos
            </div>
            <span className="text-[11px] text-emerald-700 mt-0.5 block">Visible to homepage visitors</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs">
            <span className="text-[11px] uppercase font-mono tracking-wider font-bold text-[#77766c] block">
              Active Categories
            </span>
            <div className="text-2xl font-serif font-bold text-[#20352b] mt-1">
              {CATEGORIES.length} Categories
            </div>
            <span className="text-[11px] text-[#77766c] mt-0.5 block">Rooms, Ghats, Culture & Moments</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-3.5 rounded-2xl border border-[#20352b]/10">
          <span className="text-xs font-semibold text-[#77766c] flex items-center gap-1.5 mr-2">
            <Filter size={13} /> Filter:
          </span>
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedCategory === "All"
                ? "bg-[#20352b] text-white shadow-xs"
                : "bg-[#f5f0e8] text-[#20352b] hover:bg-[#eae4d8]"
            }`}
          >
            All Photos ({items.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-[#20352b] text-white shadow-xs"
                    : "bg-[#f5f0e8] text-[#20352b] hover:bg-[#eae4d8]"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Photos Grid */}
        {loading ? (
          <div className="py-20 text-center text-[#77766c]">
            <RefreshCcw size={24} className="animate-spin mx-auto mb-2 text-[#20352b]" />
            <span className="text-xs">Gallery photos load ho rahi hain...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-[#20352b]/10 p-8 space-y-3">
            <ImageIcon size={36} className="mx-auto text-[#c8a36a]" />
            <h3 className="font-serif text-lg text-[#20352b]">Abhi koi photo add nahi ki gayi hai</h3>
            <p className="text-xs text-[#77766c] max-w-sm mx-auto">
              Aap &quot;Upload Photo&quot; button par click karke homestay, rooms ya ghats ki photos website gallery me add kar sakte hain.
            </p>
            <button onClick={handleOpenUpload} className="button button-dark px-4 py-2 text-xs mt-2">
              <Plus size={14} className="inline mr-1" />
              Upload First Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const isActive = Boolean(item.is_active);
              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl border border-[#20352b]/10 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-all"
                >
                  {/* Image Container with strict fixed aspect ratio */}
                  <div className="relative aspect-[4/3] bg-[#20352b]/5 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewImage(item.image_url)}
                        className="w-8 h-8 rounded-full bg-white text-[#20352b] flex items-center justify-center hover:bg-white/90 transition-colors shadow-sm"
                        title="Full Screen Preview"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-colors shadow-sm"
                        title="Edit Photo Details"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm"
                        title="Delete Photo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Category Tag */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#fbf8f1]/95 backdrop-blur-xs text-[10px] font-mono uppercase tracking-wider font-semibold text-[#20352b] border border-[#20352b]/15 shadow-2xs">
                      {item.category}
                    </span>

                    {/* Status Dot */}
                    <span
                      className={`absolute top-2.5 right-2.5 w-3 h-3 rounded-full border-2 border-white ${
                        isActive ? "bg-emerald-500 shadow-xs" : "bg-zinc-400"
                      }`}
                      title={isActive ? "Live on Website" : "Hidden from Website"}
                    />
                  </div>

                  {/* Info Bar */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-serif font-semibold text-sm text-[#20352b] line-clamp-1">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-[#77766c] block mt-0.5">
                        Added: {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Quick Toggle & Actions */}
                    <div className="pt-2 border-t border-[#20352b]/10 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`text-[11px] font-semibold flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
                          isActive 
                            ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" 
                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                        }`}
                      >
                        <CheckCircle2 size={13} className={isActive ? "text-emerald-600" : "text-zinc-400"} />
                        <span>{isActive ? "Live on Site" : "Hidden"}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold text-[#20352b] bg-[#f5f0e8] hover:bg-[#eae4d8] transition-colors flex items-center gap-1"
                          title="Edit photo details"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-1 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Photo Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Gallery Photo"
        subtitle="Website ke Gallery section me photo add karein"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* File Picker / Drag & Drop Area */}
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1.5">
              Select Photo from Device *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#20352b]/20 hover:border-[#20352b]/50 rounded-2xl p-6 text-center cursor-pointer bg-[#f5f0e8]/40 hover:bg-[#f5f0e8]/70 transition-all flex flex-col items-center justify-center gap-2"
            >
              {previewUrl ? (
                <div className="relative w-full max-h-48 rounded-xl overflow-hidden shadow-xs border border-[#20352b]/15">
                  <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                  <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/70 text-white text-[10px] font-mono">
                    Click to change photo
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-[#20352b]/10 text-[#20352b] flex items-center justify-center">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <strong className="text-xs text-[#20352b] block">
                      Click to choose image file
                    </strong>
                    <span className="text-[11px] text-[#77766c]">
                      Supports JPG, PNG, WEBP (Up to 15MB)
                    </span>
                  </div>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Or Image URL input */}
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Ya Direct Image URL paste karein
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or web URL"
              value={manualUrl}
              onChange={(e) => {
                setManualUrl(e.target.value);
                if (e.target.value) {
                  setPreviewUrl(e.target.value);
                  setSelectedFile(null);
                }
              }}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          {/* Photo Title */}
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Photo Title / Caption *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Peaceful Sunlit Courtyard or Evening Ganga Aarti"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Gallery Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="button button-dark px-5 py-2 flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <RefreshCcw size={14} className="animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save to Gallery</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Photo Details Modal (Full CRUD Update) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        title="Edit Gallery Photo"
        subtitle="Gallery image ka title, category ya photo update karein"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
          {/* Current / New Image Preview */}
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1.5">
              Photo Preview & Replacement
            </label>
            <div
              onClick={() => editFileInputRef.current?.click()}
              className="border-2 border-dashed border-[#20352b]/20 hover:border-[#20352b]/50 rounded-2xl p-4 text-center cursor-pointer bg-[#f5f0e8]/40 hover:bg-[#f5f0e8]/70 transition-all flex flex-col items-center justify-center gap-2"
            >
              {editPreviewUrl ? (
                <div className="relative w-full max-h-48 rounded-xl overflow-hidden shadow-xs border border-[#20352b]/15">
                  <img src={editPreviewUrl} alt="Edit Preview" className="w-full h-44 object-cover" />
                  <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/75 text-white text-[10px] font-mono">
                    Click to replace photo from device
                  </span>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <UploadCloud size={24} className="mx-auto text-[#20352b] mb-1" />
                  <span className="text-xs text-[#20352b] font-medium block">
                    Click to upload replacement image
                  </span>
                </div>
              )}
              <input
                type="file"
                ref={editFileInputRef}
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleEditFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Or Change Image URL */}
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Ya Direct Image URL edit karein
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or web URL"
              value={editManualUrl}
              onChange={(e) => {
                setEditManualUrl(e.target.value);
                if (e.target.value) {
                  setEditPreviewUrl(e.target.value);
                  setEditSelectedFile(null);
                }
              }}
              className="w-full bg-white border border-[#20352b]/20 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          {/* Photo Title */}
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Photo Title / Caption *
            </label>
            <input
              type="text"
              required
              placeholder="Photo title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-white border border-[#20352b]/20 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Gallery Category *
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full bg-white border border-[#20352b]/20 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Checkbox */}
          <div className="p-3 rounded-xl bg-[#f5f0e8] border border-[#20352b]/10 flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#20352b] block">Website Live Status</span>
              <span className="text-[11px] text-[#77766c]">
                {editActive ? "Yeh photo homepage gallery me dikhegi" : "Yeh photo homepage se chhipayi jayegi"}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingItem(null);
              }}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="button button-dark px-5 py-2 flex items-center gap-1.5"
            >
              {isUpdating ? (
                <>
                  <RefreshCcw size={14} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Update Photo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[88vh] rounded-2xl overflow-hidden shadow-2xl">
            <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
