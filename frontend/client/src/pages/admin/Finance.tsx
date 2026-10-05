import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import { IndianRupee, TrendingUp, TrendingDown, Wallet, Plus, Trash2 } from "lucide-react";
import { getFinanceSummary, getExpenses, addExpense, deleteExpense, Expense, FinanceSummary } from "@/api/finance";
import { toast } from "sonner";

export default function Finance() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const currentDate = new Date();
  const [day, setDay] = useState<number | "">("");
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "General",
    expense_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    loadData();
  }, [day, month, year]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, expensesData] = await Promise.all([
        getFinanceSummary(month, year, day),
        getExpenses(month, year, day)
      ]);
      setSummary(summaryData.summary);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Failed to load finance data:", error);
      toast.error("Failed to load finance data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.expense_date) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addExpense({
        ...formData,
        amount: Number(formData.amount)
      });
      toast.success("Expense added successfully!");
      setIsModalOpen(false);
      setFormData({
        title: "",
        amount: "",
        category: "General",
        expense_date: new Date().toISOString().split("T")[0],
        description: "",
      });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await deleteExpense(id);
      toast.success("Expense deleted.");
      loadData();
    } catch (error) {
      toast.error("Failed to delete expense.");
    }
  };

  const columns = [
    { key: "expense_date", label: "Date", render: (val: string) => new Date(val).toLocaleDateString() },
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    { key: "amount", label: "Amount", render: (val: number) => `₹${Number(val).toLocaleString()}` },
    { key: "description", label: "Description" },
    { 
      key: "id", 
      label: "Actions", 
      render: (id: number) => (
        <button 
          onClick={() => handleDeleteExpense(id)} 
          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
          title="Delete Expense"
        >
          <Trash2 size={16} />
        </button>
      )
    }
  ];

  const netIncome = summary?.netIncome || 0;
  const isProfitable = netIncome >= 0;

  return (
    <AdminLayout
      title="Finance & Expenses"
      subtitle="Track your monthly income and expenses"
      actions={
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#20352b] text-white rounded-full text-xs font-semibold flex items-center gap-2 hover:bg-[#1a2f23] transition-colors"
        >
          <Plus size={14} /> Add Expense
        </button>
      }
    >
      <div className="space-y-6">
        {/* Month Selector */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-[#20352b]/10">
          <div>
            <label className="block text-xs text-[#50574d] font-semibold mb-1">Day</label>
            <select 
              value={day} 
              onChange={(e) => setDay(e.target.value === "" ? "" : Number(e.target.value))}
              className="px-3 py-2 border rounded-xl bg-gray-50 outline-none focus:ring-1 focus:ring-[#20352b]"
            >
              <option value="">All</option>
              {Array.from({ length: new Date(year, month, 0).getDate() }).map((_, i) => (
                <option key={i+1} value={i+1}>
                  {i+1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#50574d] font-semibold mb-1">Month</label>
            <select 
              value={month} 
              onChange={(e) => { setMonth(Number(e.target.value)); setDay(""); }}
              className="px-3 py-2 border rounded-xl bg-gray-50 outline-none focus:ring-1 focus:ring-[#20352b]"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i+1} value={i+1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#50574d] font-semibold mb-1">Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 border rounded-xl bg-gray-50 outline-none focus:ring-1 focus:ring-[#20352b]"
            >
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Income"
            value={`₹${(summary?.totalIncome || 0).toLocaleString()}`}
            icon={TrendingUp}
            subtitle="From Paid Bookings"
          />
          <StatCard
            title="Total Expenses"
            value={`₹${(summary?.totalExpense || 0).toLocaleString()}`}
            icon={TrendingDown}
            subtitle="Monthly operating costs"
          />
          <StatCard
            title="Net Income"
            value={`₹${Math.abs(netIncome).toLocaleString()}`}
            icon={Wallet}
            subtitle={isProfitable ? "Profit this month" : "Loss this month"}
            highlight={isProfitable}
          />
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#20352b]/10 p-6">
          <h2 className="text-lg font-serif font-bold text-[#1a2f23] mb-4">Expenses List</h2>
          <DataTable 
            data={expenses}
            columns={columns}
            searchPlaceholder="Search expenses..."
            searchKeys={["title", "category"]}
          />
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Expense"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border rounded-xl"
              placeholder="e.g. Groceries, Electricity Bill"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (₹)</label>
              <input 
                type="number" 
                required
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input 
                type="date" 
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2 border rounded-xl"
            >
              <option>General</option>
              <option>Utilities</option>
              <option>Groceries & Food</option>
              <option>Maintenance</option>
              <option>Salary</option>
              <option>Marketing</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-xl"
              rows={3}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#20352b] text-white rounded-xl font-semibold hover:bg-[#1a2f23]"
          >
            {isSubmitting ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
}
