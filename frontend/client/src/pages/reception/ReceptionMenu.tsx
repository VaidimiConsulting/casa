import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  UtensilsCrossed,
  Leaf,
  Flame,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  IndianRupee,
} from "lucide-react";
import ReceptionLayout from "@/components/reception/ReceptionLayout";
import Modal from "@/components/admin/Modal";
import {
  fetchCategories,
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleMenuAvailability,
  deleteMenuItem,
  Category,
  MenuItem,
} from "@/api/menu";
import { toast } from "sonner";

export default function ReceptionMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: "",
    category_id: 1,
    description: "",
    price: 250,
    is_veg: 1,
    spicy_level: "mild",
    is_available: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, items] = await Promise.all([
        fetchCategories(),
        fetchMenuItems(),
      ]);
      setCategories(cats);
      setMenuItems(items);
      if (cats.length > 0 && !formData.category_id) {
        setFormData((prev) => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (err) {
      console.error("Failed to load menu data:", err);
      toast.error("Failed to load restaurant menu.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStock = async (item: MenuItem) => {
    const newStatus = item.is_available === 1 ? 0 : 1;
    try {
      await toggleMenuAvailability(item.id, Boolean(newStatus));
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, is_available: newStatus } : m))
      );
      toast.success(
        newStatus === 1
          ? `"${item.name}" marked In Stock`
          : `"${item.name}" marked Sold Out`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update item availability.");
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category_id: categories[0]?.id || 1,
      description: "",
      price: 250,
      is_veg: 1,
      spicy_level: "mild",
      is_available: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category_id: item.category_id,
      description: item.description || "",
      price: Number(item.price),
      is_veg: item.is_veg,
      spicy_level: item.spicy_level,
      is_available: item.is_available,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error("Item name is required.");
      return;
    }

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, formData);
        toast.success("Menu dish updated successfully.");
      } else {
        await createMenuItem(formData);
        toast.success("New dish added to menu.");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save menu item.");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the menu?`)) {
      return;
    }
    try {
      await deleteMenuItem(id);
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
      toast.success("Dish removed from menu.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete dish.");
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === "all" || item.category_id === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    const matchAvailable = !onlyAvailable || item.is_available === 1;
    return matchCat && matchSearch && matchAvailable;
  });

  const totalInStock = menuItems.filter((m) => m.is_available === 1).length;
  const totalOutOfStock = menuItems.length - totalInStock;

  return (
    <ReceptionLayout
      title="Restaurant Menu & Kitchen Inventory"
      subtitle="Manage dining dishes, room service items, and toggle real-time availability"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f0e8] border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#c8a36a] text-[#20352b] text-xs font-semibold hover:bg-[#b59259] transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>Add Menu Item</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-1">Total Dishes</span>
            <span className="text-2xl font-serif font-bold text-[#20352b]">{menuItems.length}</span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-emerald-700 block mb-1">In Stock (Ready)</span>
            <span className="text-2xl font-serif font-bold text-emerald-800">{totalInStock}</span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-amber-700 block mb-1">Sold Out</span>
            <span className="text-2xl font-serif font-bold text-amber-800">{totalOutOfStock}</span>
          </div>
          <div className="bg-[#fbf8f1] border border-[#20352b]/12 p-4 rounded-2xl">
            <span className="text-[10px] uppercase font-mono text-[#77766c] block mb-1">Categories</span>
            <span className="text-2xl font-serif font-bold text-[#20352b]">{categories.length}</span>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-[#fbf8f1] border border-[#20352b]/12 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]" />
              <input
                type="text"
                placeholder="Search dish or ingredients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-2xl text-xs text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#20352b]"
              />
            </div>

            {/* Quick in-stock filter */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-[#20352b]">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded text-[#c8a36a] focus:ring-[#c8a36a]"
              />
              <span>Show Available Only</span>
            </label>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
                selectedCategory === "all"
                  ? "bg-[#20352b] text-[#fbf8f1]"
                  : "bg-[#f5f0e8] text-[#77766c] hover:text-[#20352b]"
              }`}
            >
              All Dishes ({menuItems.length})
            </button>
            {categories.map((cat) => {
              const count = menuItems.filter((m) => m.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
                    selectedCategory === cat.id
                      ? "bg-[#20352b] text-[#fbf8f1]"
                      : "bg-[#f5f0e8] text-[#77766c] hover:text-[#20352b]"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-[#77766c]">Loading menu catalog...</div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-[#fbf8f1] border border-[#20352b]/10 rounded-3xl p-12 text-center">
            <UtensilsCrossed size={36} className="mx-auto text-[#77766c] mb-3 opacity-40" />
            <h3 className="font-serif text-lg text-[#20352b] mb-1">No Menu Dishes Found</h3>
            <p className="text-xs text-[#77766c] mb-4">Try clearing your filters or search query.</p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-full bg-[#20352b] text-[#fbf8f1] text-xs font-semibold"
            >
              Add First Dish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-[#fbf8f1] border rounded-3xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                  item.is_available === 1
                    ? "border-[#20352b]/12"
                    : "border-amber-300/80 bg-amber-50/20 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${
                          item.is_veg === 1
                            ? "border-emerald-600 bg-emerald-50"
                            : "border-rose-600 bg-rose-50"
                        }`}
                        title={item.is_veg === 1 ? "Vegetarian" : "Non-Vegetarian"}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.is_veg === 1 ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                        />
                      </span>
                      <h4 className="font-serif text-base font-semibold text-[#20352b]">
                        {item.name}
                      </h4>
                    </div>

                    <span className="font-mono text-sm font-bold text-[#20352b] shrink-0">
                      ₹{Number(item.price).toLocaleString()}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-[#77766c] line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 rounded-md bg-[#20352b]/6 text-[10px] font-mono text-[#20352b]">
                      {item.category_name || "Kitchen Item"}
                    </span>
                    {item.spicy_level && item.spicy_level !== "mild" && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-mono">
                        <Flame size={11} />
                        {item.spicy_level}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Availability Toggle & Edit */}
                <div className="pt-3 border-t border-[#20352b]/8 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStock(item)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      item.is_available === 1
                        ? "bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    }`}
                  >
                    {item.is_available === 1 ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>In Stock</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} />
                        <span>Sold Out</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-[#77766c] hover:text-[#20352b] hover:bg-[#20352b]/5 rounded-lg transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 text-[#77766c] hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dish Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Menu Dish" : "Add New Dish to Kitchen"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#20352b] mb-1">Dish Name *</label>
            <input
              type="text"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              placeholder="e.g. Masala Dosa, Cold Coffee, Paneer Tikka"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Category *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#20352b] mb-1">Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#20352b] mb-1">Description / Ingredients</label>
            <textarea
              rows={2}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              placeholder="Brief description for guests..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#20352b] mb-1">Dietary Type</label>
              <select
                value={formData.is_veg}
                onChange={(e) => setFormData({ ...formData, is_veg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              >
                <option value={1}>🟢 Vegetarian</option>
                <option value={0}>🔴 Non-Vegetarian</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#20352b] mb-1">Spice Level</label>
              <select
                value={formData.spicy_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    spicy_level: e.target.value as "mild" | "medium" | "spicy",
                  })
                }
                className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
              >
                <option value="mild">Mild (Non-spicy)</option>
                <option value="medium">Medium</option>
                <option value="spicy">Spicy 🔥</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#20352b] mb-1">Availability</label>
            <select
              value={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#f5f0e8] border border-[#20352b]/15 rounded-xl text-xs text-[#20352b]"
            >
              <option value={1}>In Stock (Ready to prepare)</option>
              <option value={0}>Sold Out (Temporarily unavailable)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-5 py-2">
              {editingItem ? "Update Dish" : "Save Dish"}
            </button>
          </div>
        </form>
      </Modal>
    </ReceptionLayout>
  );
}
