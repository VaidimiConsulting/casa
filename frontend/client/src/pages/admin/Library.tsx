import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  RefreshCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Edit2,
  BookmarkPlus,
  BookCopy,
  Users,
  MapPin,
  Calendar,
  X,
  Sparkles,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Modal from "@/components/admin/Modal";
import {
  fetchBooks,
  addBook,
  updateBook,
  deleteBook,
  fetchLoans,
  issueBook,
  returnBook,
  LibraryBook,
  LibraryLoan,
} from "@/api/library";
import { toast } from "sonner";

const GENRES = [
  "All",
  "Fiction",
  "Novel",
  "Spiritual",
  "Travel & Culture",
  "Poetry",
  "Self-Help",
  "General",
];

export default function Library() {
  const [activeTab, setActiveTab] = useState<"catalog" | "loans">("catalog");
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loans, setLoans] = useState<LibraryLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [loanStatusFilter, setLoanStatusFilter] = useState("all");

  // Add / Edit Book Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookGenre, setBookGenre] = useState("Fiction");
  const [bookIsbn, setBookIsbn] = useState("");
  const [bookCover, setBookCover] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  const [bookTotalCopies, setBookTotalCopies] = useState("1");
  const [bookLocation, setBookLocation] = useState("Main Lounge Shelf");
  const [submittingBook, setSubmittingBook] = useState(false);

  // Issue Book Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedBookForLoan, setSelectedBookForLoan] = useState<number | "">("");
  const [loanGuestName, setLoanGuestName] = useState("");
  const [loanRoomNumber, setLoanRoomNumber] = useState("");
  const [loanPhone, setLoanPhone] = useState("");
  const [loanDueDate, setLoanDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [loanNotes, setLoanNotes] = useState("");
  const [submittingLoan, setSubmittingLoan] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksData, loansData] = await Promise.all([
        fetchBooks({ all: true }),
        fetchLoans(),
      ]);
      setBooks(booksData);
      setLoans(loansData);
    } catch (error) {
      console.error(error);
      toast.error("Library data load failed.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Open Book Modal (Add or Edit)
  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookTitle("");
    setBookAuthor("");
    setBookGenre("Fiction");
    setBookIsbn("");
    setBookCover("");
    setBookDescription("");
    setBookTotalCopies("1");
    setBookLocation("Main Lounge Shelf");
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (book: LibraryBook) => {
    setEditingBook(book);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookGenre(book.genre || "General");
    setBookIsbn(book.isbn || "");
    setBookCover(book.cover_image || "");
    setBookDescription(book.description || "");
    setBookTotalCopies(book.total_copies.toString());
    setBookLocation(book.location || "Main Lounge Shelf");
    setIsBookModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) {
      toast.error("Title and author are required.");
      return;
    }

    try {
      setSubmittingBook(true);
      const payload = {
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        genre: bookGenre,
        isbn: bookIsbn.trim(),
        cover_image: bookCover.trim() || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
        description: bookDescription.trim(),
        total_copies: parseInt(bookTotalCopies) || 1,
        location: bookLocation.trim() || "Main Lounge Shelf",
      };

      if (editingBook) {
        await updateBook(editingBook.id, payload);
        toast.success(`"${payload.title}" updated successfully!`);
      } else {
        await addBook(payload);
        toast.success(`"${payload.title}" added to library catalog!`);
      }

      setIsBookModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save book.");
    } finally {
      setSubmittingBook(false);
    }
  };

  const handleDeleteBook = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from the library?`)) {
      return;
    }
    try {
      await deleteBook(id);
      toast.success(`"${title}" deleted.`);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete book.");
    }
  };

  // Open Issue Book Modal
  const handleOpenIssueModal = (bookId?: number) => {
    if (bookId) {
      setSelectedBookForLoan(bookId);
    } else {
      const firstAvailable = books.find((b) => b.available_copies > 0);
      setSelectedBookForLoan(firstAvailable ? firstAvailable.id : "");
    }
    setLoanGuestName("");
    setLoanRoomNumber("");
    setLoanPhone("");
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setLoanDueDate(d.toISOString().split("T")[0]);
    setLoanNotes("");
    setIsIssueModalOpen(true);
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForLoan || !loanGuestName.trim() || !loanRoomNumber.trim() || !loanDueDate) {
      toast.error("Please fill all required loan fields.");
      return;
    }

    try {
      setSubmittingLoan(true);
      await issueBook({
        book_id: Number(selectedBookForLoan),
        guest_name: loanGuestName.trim(),
        room_number: loanRoomNumber.trim(),
        phone: loanPhone.trim(),
        due_date: new Date(loanDueDate).toISOString(),
        notes: loanNotes.trim(),
      });
      toast.success(`Book issued to Room ${loanRoomNumber} (${loanGuestName})!`);
      setIsIssueModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to issue book.");
    } finally {
      setSubmittingLoan(false);
    }
  };

  const handleReturnBook = async (loanId: number, title: string) => {
    try {
      await returnBook(loanId);
      toast.success(`"${title}" marked as returned. Available inventory updated!`);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark book returned.");
    }
  };

  // Computed Stats
  const totalBooksCount = books.length;
  const totalAvailableCopies = books.reduce((acc, b) => acc + (b.available_copies || 0), 0);
  const activeLoansCount = loans.filter((l) => l.status === "active").length;
  const overdueLoansCount = loans.filter((l) => {
    if (l.status === "returned") return false;
    return new Date(l.due_date) < new Date();
  }).length;

  // Filtered Books
  const filteredBooks = books.filter((b) => {
    const matchesGenre = selectedGenre === "All" || b.genre === selectedGenre;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.location && b.location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGenre && matchesSearch;
  });

  // Filtered Loans
  const filteredLoans = loans.filter((l) => {
    const isOverdue = l.status !== "returned" && new Date(l.due_date) < new Date();
    const effectiveStatus = isOverdue ? "overdue" : l.status;

    const matchesStatus =
      loanStatusFilter === "all" ||
      effectiveStatus === loanStatusFilter ||
      (loanStatusFilter === "active" && l.status === "active" && !isOverdue);

    const matchesSearch =
      (l.book_title && l.book_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      l.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.room_number.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout title="Homestay Library & Reading Lounge">
      <div className="space-y-8 pb-12">
        {/* Header Actions & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif text-[#20352b] font-bold">
              Library & Book Lending Hub
            </h2>
            <p className="text-sm text-[#20352b]/70 font-sans">
              Manage cozy homestay novels, spiritual classics, and track guest book loans per room.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-[#20352b]/15 bg-white text-[#20352b] hover:bg-[#fbf8f1] transition-all flex items-center justify-center shadow-sm"
              title="Refresh Data"
            >
              <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#c8a36a]" : ""}`} />
            </button>

            <button
              onClick={() => handleOpenIssueModal()}
              className="px-4 py-2.5 rounded-xl bg-[#20352b] text-white font-medium text-sm flex items-center gap-2 shadow-md hover:bg-[#20352b]/90 transition-all cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4 text-[#c8a36a]" />
              Issue Book to Guest
            </button>

            <button
              onClick={handleOpenAddBook}
              className="px-4 py-2.5 rounded-xl bg-[#c8a36a] text-[#20352b] font-semibold text-sm flex items-center gap-2 shadow-md hover:bg-[#b8935a] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Book
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#20352b]/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#c8a36a]/15 flex items-center justify-center text-[#c8a36a]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#20352b]/60">Total Titles</p>
              <p className="text-2xl font-bold text-[#20352b] font-serif">{totalBooksCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#20352b]/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <BookCopy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#20352b]/60">Available Copies</p>
              <p className="text-2xl font-bold text-emerald-800 font-serif">{totalAvailableCopies}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#20352b]/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#20352b]/60">Active Loans</p>
              <p className="text-2xl font-bold text-amber-800 font-serif">{activeLoansCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#20352b]/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#20352b]/60">Overdue Returns</p>
              <p className="text-2xl font-bold text-rose-700 font-serif">{overdueLoansCount}</p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#20352b]/10">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`pb-4 px-6 text-base font-medium flex items-center gap-2 transition-colors relative ${
              activeTab === "catalog"
                ? "text-[#20352b] font-bold"
                : "text-[#20352b]/60 hover:text-[#20352b]"
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#c8a36a]" />
            Books Catalog ({books.length})
            {activeTab === "catalog" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#c8a36a]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("loans")}
            className={`pb-4 px-6 text-base font-medium flex items-center gap-2 transition-colors relative ${
              activeTab === "loans"
                ? "text-[#20352b] font-bold"
                : "text-[#20352b]/60 hover:text-[#20352b]"
            }`}
          >
            <Users className="w-4 h-4 text-[#c8a36a]" />
            Guest Loans & Tracking ({loans.length})
            {overdueLoansCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
                {overdueLoansCount} overdue
              </span>
            )}
            {activeTab === "loans" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#c8a36a]" />
            )}
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-[#20352b]/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#20352b]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === "catalog" ? "Search books by title, author..." : "Search by guest, room, or book..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#fbf8f1] border border-[#20352b]/15 rounded-xl text-[#20352b] placeholder-[#20352b]/40 focus:outline-none focus:ring-2 focus:ring-[#c8a36a]/50"
            />
          </div>

          {activeTab === "catalog" ? (
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#20352b]/60 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#c8a36a]" /> Genre:
              </span>
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                    selectedGenre === g
                      ? "bg-[#20352b] text-white shadow-sm"
                      : "bg-[#fbf8f1] text-[#20352b]/70 hover:bg-[#20352b]/10"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#20352b]/60 flex items-center gap-1 shrink-0">
                Status:
              </span>
              {[
                { id: "all", label: "All Loans" },
                { id: "active", label: "Active" },
                { id: "overdue", label: "Overdue" },
                { id: "returned", label: "Returned" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setLoanStatusFilter(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                    loanStatusFilter === s.id
                      ? "bg-[#20352b] text-white shadow-sm"
                      : "bg-[#fbf8f1] text-[#20352b]/70 hover:bg-[#20352b]/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Books Catalog */}
        {activeTab === "catalog" && (
          <div>
            {loading ? (
              <div className="py-16 text-center text-[#20352b]/60 font-sans">
                <RefreshCcw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#c8a36a]" />
                Loading homestay library collection...
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#20352b]/10 text-center">
                <BookOpen className="w-12 h-12 text-[#c8a36a]/50 mx-auto mb-3" />
                <h3 className="text-lg font-serif font-bold text-[#20352b]">No Books Found</h3>
                <p className="text-sm text-[#20352b]/60 max-w-md mx-auto mt-1 mb-6">
                  {searchQuery || selectedGenre !== "All"
                    ? "Try adjusting your search or genre filter."
                    : "Your library catalog is empty. Add some relaxing reads for your guests!"}
                </p>
                <button
                  onClick={handleOpenAddBook}
                  className="px-5 py-2.5 rounded-xl bg-[#c8a36a] text-[#20352b] font-semibold text-sm inline-flex items-center gap-2 shadow-md hover:bg-[#b8935a] transition-all"
                >
                  <Plus className="w-4 h-4" /> Add First Book
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    className="bg-white rounded-2xl border border-[#20352b]/10 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-[#c8a36a]/40 transition-all duration-300 group"
                  >
                    {/* Cover Image */}
                    <div className="relative h-48 bg-[#f5f0e8] overflow-hidden">
                      <img
                        src={book.cover_image || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-[#20352b]/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                        {book.genre || "General"}
                      </div>
                      <div
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm ${
                          book.available_copies > 0
                            ? "bg-emerald-600 text-white"
                            : "bg-rose-600 text-white"
                        }`}
                      >
                        {book.available_copies > 0
                          ? `${book.available_copies} / ${book.total_copies} Available`
                          : "All Borrowed"}
                      </div>
                    </div>

                    {/* Book Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-serif font-bold text-lg text-[#20352b] line-clamp-1 group-hover:text-[#c8a36a] transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-xs font-medium text-[#20352b]/70 mb-2">
                          by <span className="text-[#20352b] font-semibold">{book.author}</span>
                        </p>

                        {book.description && (
                          <p className="text-xs text-[#20352b]/65 line-clamp-2 mb-3 leading-relaxed">
                            {book.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-[#20352b]/60 font-sans mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#c8a36a]" />
                          <span>{book.location || "Main Lounge Shelf"}</span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-4 mt-4 border-t border-[#20352b]/10 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenIssueModal(book.id)}
                          disabled={book.available_copies <= 0}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            book.available_copies > 0
                              ? "bg-[#20352b] text-white hover:bg-[#20352b]/90 shadow-sm cursor-pointer"
                              : "bg-[#20352b]/10 text-[#20352b]/40 cursor-not-allowed"
                          }`}
                        >
                          <BookmarkPlus className="w-3.5 h-3.5 text-[#c8a36a]" />
                          Issue to Room
                        </button>

                        <button
                          onClick={() => handleOpenEditBook(book)}
                          className="p-2 rounded-xl bg-[#fbf8f1] border border-[#20352b]/15 text-[#20352b] hover:bg-[#c8a36a]/20 hover:border-[#c8a36a] transition-all"
                          title="Edit Book Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          className="p-2 rounded-xl bg-[#fbf8f1] border border-[#20352b]/15 text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all"
                          title="Delete Book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Guest Loans & Tracking */}
        {activeTab === "loans" && (
          <div>
            {loading ? (
              <div className="py-16 text-center text-[#20352b]/60 font-sans">
                <RefreshCcw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#c8a36a]" />
                Loading loan history...
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#20352b]/10 text-center">
                <Users className="w-12 h-12 text-[#c8a36a]/50 mx-auto mb-3" />
                <h3 className="text-lg font-serif font-bold text-[#20352b]">No Active or Past Loans Found</h3>
                <p className="text-sm text-[#20352b]/60 max-w-md mx-auto mt-1 mb-6">
                  {searchQuery || loanStatusFilter !== "all"
                    ? "Try adjusting your search query or filter."
                    : "No books are currently issued. Use 'Issue Book to Guest' to lend a book."}
                </p>
                <button
                  onClick={() => handleOpenIssueModal()}
                  className="px-5 py-2.5 rounded-xl bg-[#20352b] text-white font-medium text-sm inline-flex items-center gap-2 shadow-md hover:bg-[#20352b]/90 transition-all"
                >
                  <BookmarkPlus className="w-4 h-4 text-[#c8a36a]" />
                  Issue a Book Now
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#20352b]/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f5f0e8]/70 border-b border-[#20352b]/10 text-[#20352b] text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Book Title</th>
                        <th className="py-3.5 px-4">Guest & Room</th>
                        <th className="py-3.5 px-4">Borrow Date</th>
                        <th className="py-3.5 px-4">Due Date</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#20352b]/10 text-sm">
                      {filteredLoans.map((loan) => {
                        const isOverdue =
                          loan.status !== "returned" && new Date(loan.due_date) < new Date();

                        return (
                          <tr
                            key={loan.id}
                            className={`hover:bg-[#fbf8f1]/80 transition-colors ${
                              isOverdue ? "bg-rose-50/40" : ""
                            }`}
                          >
                            {/* Book Info */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={loan.book_cover || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"}
                                  alt={loan.book_title || "Book"}
                                  className="w-10 h-14 object-cover rounded-md shadow-xs border border-[#20352b]/15 shrink-0"
                                />
                                <div>
                                  <p className="font-serif font-bold text-[#20352b] line-clamp-1">
                                    {loan.book_title || `Book #${loan.book_id}`}
                                  </p>
                                  <p className="text-xs text-[#20352b]/60">
                                    {loan.book_author || "Casa Nest Library"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Guest & Room */}
                            <td className="py-4 px-4">
                              <div className="font-medium text-[#20352b]">{loan.guest_name}</div>
                              <div className="flex items-center gap-1.5 text-xs text-[#c8a36a] font-semibold mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-[#c8a36a]" />
                                Room {loan.room_number}
                              </div>
                              {loan.phone && (
                                <div className="text-xs text-[#20352b]/50">{loan.phone}</div>
                              )}
                            </td>

                            {/* Borrow Date */}
                            <td className="py-4 px-4 text-xs text-[#20352b]/70">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#20352b]/40" />
                                {new Date(loan.borrow_date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </td>

                            {/* Due Date */}
                            <td className="py-4 px-4 text-xs">
                              <div
                                className={`flex items-center gap-1 font-medium ${
                                  isOverdue ? "text-rose-600 font-bold" : "text-[#20352b]/80"
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(loan.due_date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              {loan.return_date && (
                                <div className="text-[11px] text-emerald-700 mt-0.5">
                                  Returned on{" "}
                                  {new Date(loan.return_date).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4">
                              {loan.status === "returned" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Returned
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                  <Clock className="w-3.5 h-3.5" /> Reading / Active
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right">
                              {loan.status !== "returned" ? (
                                <button
                                  onClick={() =>
                                    handleReturnBook(loan.id, loan.book_title || "Book")
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Mark Returned
                                </button>
                              ) : (
                                <span className="text-xs text-[#20352b]/40 italic">Completed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add / Edit Book Modal */}
        <Modal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          title={editingBook ? "Edit Book Details" : "Add New Book to Library"}
          subtitle="Keep your homestay reading collection organized and fresh"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveBook} className="p-6 space-y-4 font-sans">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                Book Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Banaras: City of Light"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diana L. Eck"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                  Genre
                </label>
                <select
                  value={bookGenre}
                  onChange={(e) => setBookGenre(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
                >
                  {GENRES.filter((g) => g !== "All").map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                  Total Copies
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={bookTotalCopies}
                  onChange={(e) => setBookTotalCopies(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                  Shelf / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lounge Shelf A2"
                  value={bookLocation}
                  onChange={(e) => setBookLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={bookCover}
                onChange={(e) => setBookCover(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                Book Summary / Description
              </label>
              <textarea
                rows={3}
                placeholder="A brief blurb about the book..."
                value={bookDescription}
                onChange={(e) => setBookDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#20352b]/10">
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#20352b]/20 text-sm font-medium text-[#20352b] hover:bg-[#20352b]/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingBook}
                className="px-5 py-2.5 rounded-xl bg-[#c8a36a] text-[#20352b] text-sm font-bold shadow-md hover:bg-[#b8935a] transition-all disabled:opacity-50"
              >
                {submittingBook ? "Saving..." : editingBook ? "Update Book" : "Add to Library"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Issue Book to Guest Modal */}
        <Modal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          title="Issue Book to Guest"
          subtitle="Assign a homestay book to a guest's room with return tracking"
          maxWidth="md"
        >
          <form onSubmit={handleIssueBook} className="p-6 space-y-4 font-sans">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                Select Book *
              </label>
              <select
                required
                value={selectedBookForLoan}
                onChange={(e) => setSelectedBookForLoan(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
              >
                <option value="" disabled>
                  -- Choose an available book --
                </option>
                {books.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    disabled={b.available_copies <= 0}
                  >
                    {b.title} by {b.author} ({b.available_copies} available)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={loanGuestName}
                  onChange={(e) => setLoanGuestName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                  Room Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 102 / Casa Luna"
                  value={loanRoomNumber}
                  onChange={(e) => setLoanRoomNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={loanPhone}
                  onChange={(e) => setLoanPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                  Due Return Date *
                </label>
                <input
                  type="date"
                  required
                  value={loanDueDate}
                  onChange={(e) => setLoanDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#20352b] mb-1">
                Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Any special remarks or guest requests..."
                value={loanNotes}
                onChange={(e) => setLoanNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#20352b]/20 rounded-xl text-sm text-[#20352b] focus:ring-2 focus:ring-[#c8a36a]/50 focus:outline-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#20352b]/10">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#20352b]/20 text-sm font-medium text-[#20352b] hover:bg-[#20352b]/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingLoan}
                className="px-5 py-2.5 rounded-xl bg-[#20352b] text-white text-sm font-semibold shadow-md hover:bg-[#20352b]/90 transition-all disabled:opacity-50"
              >
                {submittingLoan ? "Issuing..." : "Confirm & Issue Book"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
