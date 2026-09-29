import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Check, X, UtensilsCrossed, Leaf, Flame, Sparkles } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import DataTable, { Column } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Modal from "@/components/admin/Modal";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleMenuAvailability,
  deleteMenuItem,
  Category,
  MenuItem,
} from "@/api/menu";
import { toast } from "sonner";

export default function RestaurantMenu() {
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);

  // Item Form State
  const [itemForm, setItemForm] = useState<Partial<MenuItem>>({
    name: "",
    category_id: 1,
    description: "",
    price: 350,
    image: "",
    is_veg: 1,
    spicy_level: "mild",
    is_available: 1,
  });

  // Category Form State
  const [catForm, setCatForm] = useState<Partial<Category>>({
    name: "",
    slug: "",
    description: "",
    image: "",
    display_order: 1,
    is_active: 1,
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [cats, items] = await Promise.all([fetchCategories(), fetchMenuItems()]);
      setCategories(cats);
      setMenuItems(items);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load restaurant data.");
    } finally {
      setLoading(false);
    }
  };

  // Menu Item Handlers
  const handleOpenAddItem = () => {
    setSelectedItem(null);
    setItemForm({
      name: "",
      category_id: categories[0]?.id || 1,
      description: "",
      price: 350,
      image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
      is_veg: 1,
      spicy_level: "mild",
      is_available: 1,
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      category_id: item.category_id,
      description: item.description || "",
      price: Number(item.price),
      image: item.image || "",
      is_veg: item.is_veg,
      spicy_level: item.spicy_level,
      is_available: item.is_available,
    });
    setIsItemModalOpen(true);
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.category_id || itemForm.price === undefined) {
      toast.error("Please fill required fields.");
      return;
    }

    try {
      if (selectedItem) {
        await updateMenuItem(selectedItem.id, itemForm);
        toast.success("Menu item updated.");
      } else {
        await createMenuItem(itemForm);
        toast.success("Menu item created.");
      }
      setIsItemModalOpen(false);
      loadAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save menu item.");
    }
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      const nextVal = item.is_available ? false : true;
      await toggleMenuAvailability(item.id, nextVal);
      toast.success("Availability updated.");
      loadAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update availability.");
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await deleteMenuItem(id);
      toast.success("Menu item deleted.");
      loadAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete menu item.");
    }
  };

  // Category Handlers
  const handleOpenAddCat = () => {
    setSelectedCat(null);
    setCatForm({
      name: "",
      slug: "",
      description: "",
      image: "",
      display_order: categories.length + 1,
      is_active: 1,
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setSelectedCat(cat);
    setCatForm(cat);
    setIsCatModalOpen(true);
  };

  const handleSubmitCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !catForm.slug) {
      toast.error("Name and slug are required.");
      return;
    }

    try {
      if (selectedCat) {
        await updateCategory(selectedCat.id, catForm);
        toast.success("Category updated.");
      } else {
        await createCategory(catForm);
        toast.success("Category created.");
      }
      setIsCatModalOpen(false);
      loadAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save category.");
    }
  };

  const handleDeleteCat = async (id: number) => {
    if (!confirm("Deleting this category will remove or unassign items within it. Proceed?")) return;
    try {
      await deleteCategory(id);
      toast.success("Category deleted.");
      loadAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete category.");
    }
  };

  const itemColumns: Column<MenuItem>[] = [
    {
      key: "image",
      header: "Photo",
      render: (item) => (
        <img
          src={item.image || "/manus-storage/file_000000004e48820b83c012adca2d5a50_522e5d98.png"}
          alt={item.name}
          className="w-12 h-12 object-cover rounded-xl border border-[#20352b]/10"
        />
      ),
    },
    {
      key: "name",
      header: "Item Name",
      render: (item) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                item.is_veg ? "bg-emerald-600" : "bg-red-600"
              }`}
              title={item.is_veg ? "Vegetarian" : "Non-Vegetarian"}
            />
            <span className="font-semibold text-sm text-[#20352b]">{item.name}</span>
          </div>
          <p className="text-[11px] text-[#77766c] line-clamp-1 max-w-sm mt-0.5">
            {item.description || "No description provided."}
          </p>
        </div>
      ),
    },
    {
      key: "category_name",
      header: "Category",
      render: (item) => (
        <span className="px-2.5 py-0.5 rounded-full bg-[#f5f0e8] text-[11px] font-medium text-[#20352b] border border-[#20352b]/10">
          {item.category_name || "Mains"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (item) => (
        <span className="font-mono font-semibold text-sm text-[#20352b]">
          ₹{Number(item.price).toLocaleString()}
        </span>
      ),
    },
    {
      key: "spicy_level",
      header: "Spice Level",
      render: (item) => (
        <span className="text-[10px] uppercase font-mono font-semibold text-[#77766c]">
          {item.spicy_level}
        </span>
      ),
    },
    {
      key: "is_available",
      header: "Status",
      render: (item) => (
        <button
          onClick={() => handleToggleItemAvailability(item)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <StatusBadge status={item.is_available ? "available" : "unavailable"} />
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEditItem(item)}
            className="p-1.5 rounded-lg text-[#20352b] hover:bg-[#20352b]/8 transition-colors"
            title="Edit item"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => handleDeleteItem(item.id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Delete item"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const catColumns: Column<Category>[] = [
    {
      key: "name",
      header: "Category Name",
      render: (cat) => (
        <div>
          <span className="font-semibold text-sm text-[#20352b] block">{cat.name}</span>
          <span className="text-[11px] text-[#77766c] font-mono">slug: {cat.slug}</span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (cat) => (
        <span className="text-xs text-[#77766c] line-clamp-1">{cat.description || "—"}</span>
      ),
    },
    {
      key: "display_order",
      header: "Sort Order",
      render: (cat) => <span className="font-mono text-xs">{cat.display_order}</span>,
    },
    {
      key: "is_active",
      header: "Status",
      render: (cat) => <StatusBadge status={cat.is_active ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (cat) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEditCat(cat)}
            className="p-1.5 rounded-lg text-[#20352b] hover:bg-[#20352b]/8 transition-colors"
            title="Edit category"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => handleDeleteCat(cat.id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Delete category"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title="Restaurant & Menu Management"
      subtitle="Manage dining categories, kitchen dishes, pricing & availability"
      actions={
        <div className="flex items-center gap-2">
          {activeTab === "items" ? (
            <button
              onClick={handleOpenAddItem}
              className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Add Menu Item</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddCat}
              className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Add Category</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Module Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-[#20352b]/10 pb-3">
          <button
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === "items"
                ? "bg-[#20352b] text-[#fbf8f1] shadow-xs"
                : "text-[#666960] hover:text-[#20352b] bg-[#fbf8f1]"
            }`}
          >
            Menu Items ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === "categories"
                ? "bg-[#20352b] text-[#fbf8f1] shadow-xs"
                : "text-[#666960] hover:text-[#20352b] bg-[#fbf8f1]"
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {activeTab === "items" ? (
          <DataTable
            columns={itemColumns}
            data={menuItems}
            loading={loading}
            searchPlaceholder="Search menu items by dish name..."
            searchKey={(item) => `${item.name} ${item.category_name || ""}`}
            emptyMessage="No menu items found. Click 'Add Menu Item' to create one."
          />
        ) : (
          <DataTable
            columns={catColumns}
            data={categories}
            loading={loading}
            searchPlaceholder="Search categories..."
            searchKey={(cat) => `${cat.name} ${cat.slug}`}
            emptyMessage="No categories found. Click 'Add Category' to create one."
          />
        )}
      </div>

      {/* Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={selectedItem ? "Edit Menu Item" : "New Menu Dish"}
        subtitle="Configure dish details, category, pricing & spicy level"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitItem} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Dish Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Banarasi Dum Aloo"
                value={itemForm.name || ""}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Category *
              </label>
              <select
                value={itemForm.category_id || categories[0]?.id || 1}
                onChange={(e) => setItemForm({ ...itemForm, category_id: Number(e.target.value) })}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                value={itemForm.price || ""}
                onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                required
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Dietary
              </label>
              <select
                value={itemForm.is_veg ? 1 : 0}
                onChange={(e) => setItemForm({ ...itemForm, is_veg: Number(e.target.value) })}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                <option value={1}>🌱 Pure Vegetarian</option>
                <option value={0}>🍗 Non-Vegetarian</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
                Spicy Level
              </label>
              <select
                value={itemForm.spicy_level || "mild"}
                onChange={(e) => setItemForm({ ...itemForm, spicy_level: e.target.value as any })}
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
              >
                <option value="mild">Mild</option>
                <option value="medium">Medium Spice</option>
                <option value="spicy">Hot & Spicy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Image URL
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={itemForm.image || ""}
              onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Description / Ingredients
            </label>
            <textarea
              rows={3}
              placeholder="Freshly prepared with authentic Indian spices..."
              value={itemForm.description || ""}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsItemModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-5 py-2">
              Save Dish
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={selectedCat ? "Edit Category" : "New Menu Category"}
        subtitle="Group dishes under a culinary classification"
        maxWidth="sm"
      >
        <form onSubmit={handleSubmitCat} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Category Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Traditional Mains"
              value={catForm.name || ""}
              onChange={(e) => {
                const name = e.target.value;
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                setCatForm({ ...catForm, name, slug });
              }}
              required
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Slug (URL Key) *
            </label>
            <input
              type="text"
              value={catForm.slug || ""}
              onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
              required
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-1">
              Sort Order
            </label>
            <input
              type="number"
              value={catForm.display_order || 1}
              onChange={(e) => setCatForm({ ...catForm, display_order: Number(e.target.value) })}
              className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
            />
          </div>

          <div className="pt-3 border-t border-[#20352b]/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="button button-light border border-[#20352b]/15 px-4 py-2"
            >
              Cancel
            </button>
            <button type="submit" className="button button-dark px-5 py-2">
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
