import { Request, Response } from "express";
import pool from "../config/db.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Initialize Library Tables and seed default books if empty
export async function initLibraryTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        genre VARCHAR(100) DEFAULT 'General',
        isbn VARCHAR(50) DEFAULT '',
        cover_image TEXT NULL,
        description TEXT,
        total_copies INT DEFAULT 1,
        available_copies INT DEFAULT 1,
        location VARCHAR(100) DEFAULT 'Main Lounge Shelf',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_loans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        book_id INT NOT NULL,
        user_id INT NULL,
        guest_name VARCHAR(255) NOT NULL,
        room_number VARCHAR(50) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP NOT NULL,
        return_date TIMESTAMP NULL,
        status ENUM('active', 'returned', 'overdue') DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES library_books(id) ON DELETE CASCADE
      )
    `);

    // Check if books table is empty, seed cozy homestay books
    const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM library_books");
    if (rows[0].count === 0) {
      const initialBooks = [
        {
          title: "Banaras: City of Light",
          author: "Diana L. Eck",
          genre: "Travel & Culture",
          cover_image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
          description: "An illuminating account of Varanasi, one of the oldest living cities in the world, exploring its sacred topography, ghats, and deep spiritual heritage.",
          total_copies: 2,
          available_copies: 2,
          location: "Lounge Shelf A1"
        },
        {
          title: "The Room on the Roof",
          author: "Ruskin Bond",
          genre: "Fiction",
          cover_image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
          description: "A heartwarming coming-of-age story of Rusty, an orphaned Anglo-Indian boy who discovers friendship and freedom in the foothills of the Himalayas.",
          total_copies: 3,
          available_copies: 3,
          location: "Lounge Shelf A2"
        },
        {
          title: "Autobiography of a Yogi",
          author: "Paramahansa Yogananda",
          genre: "Spiritual",
          cover_image: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd7?auto=format&fit=crop&w=600&q=80",
          description: "A timeless spiritual classic detailing the extraordinary life and encounters with great saints of modern India.",
          total_copies: 2,
          available_copies: 2,
          location: "Spiritual Corner B1"
        },
        {
          title: "The Alchemist",
          author: "Paulo Coelho",
          genre: "Fiction",
          cover_image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80",
          description: "An inspiring fable about following your dreams, listening to your heart, and reading the omens strewn along life's path.",
          total_copies: 3,
          available_copies: 3,
          location: "Lounge Shelf A3"
        },
        {
          title: "Shantaram",
          author: "Gregory David Roberts",
          genre: "Novel",
          cover_image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
          description: "A gripping epic novel set in the underworld of contemporary Bombay, celebrating resilience, love, and redemption.",
          total_copies: 2,
          available_copies: 2,
          location: "Fiction Section C1"
        },
        {
          title: "Gitanjali",
          author: "Rabindranath Tagore",
          genre: "Poetry",
          cover_image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80",
          description: "Nobel prize-winning collection of devotional and lyrical poems celebrating divine grace, nature, and humanity.",
          total_copies: 2,
          available_copies: 2,
          location: "Poetry & Classics D1"
        }
      ];

      for (const b of initialBooks) {
        await pool.query(
          `INSERT INTO library_books (title, author, genre, cover_image, description, total_copies, available_copies, location)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [b.title, b.author, b.genre, b.cover_image, b.description, b.total_copies, b.available_copies, b.location]
        );
      }
      console.log("📚 Seeded initial library books for Casa Nest.");
    }
  } catch (error) {
    console.error("Failed to initialize library tables:", error);
  }
}

// GET /api/library/books
export async function getBooks(req: Request, res: Response): Promise<void> {
  try {
    const { genre, search, all } = req.query;
    let sql = "SELECT * FROM library_books WHERE 1=1";
    const params: any[] = [];

    if (!all || all === "false") {
      sql += " AND is_active = 1";
    }

    if (genre && genre !== "All") {
      sql += " AND genre = ?";
      params.push(genre);
    }

    if (search) {
      sql += " AND (title LIKE ? OR author LIKE ? OR description LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += " ORDER BY id DESC";

    const [rows] = await pool.query(sql, params);
    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows,
    });
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch library books." });
  }
}

// GET /api/library/books/:id
export async function getBookById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM library_books WHERE id = ?", [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Book not found." });
      return;
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Get book by id error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch book." });
  }
}

// POST /api/library/books (Admin)
export async function addBook(req: Request, res: Response): Promise<void> {
  try {
    const { title, author, genre, isbn, cover_image, description, total_copies, location } = req.body;

    if (!title || !author) {
      res.status(400).json({ success: false, message: "Title and author are required." });
      return;
    }

    const copies = parseInt(total_copies) || 1;
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO library_books (title, author, genre, isbn, cover_image, description, total_copies, available_copies, location, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        title.trim(),
        author.trim(),
        genre ? genre.trim() : "General",
        isbn ? isbn.trim() : "",
        cover_image ? cover_image.trim() : "",
        description ? description.trim() : "",
        copies,
        copies,
        location ? location.trim() : "Main Lounge Shelf",
      ]
    );

    const [newBook] = await pool.query<RowDataPacket[]>("SELECT * FROM library_books WHERE id = ?", [result.insertId]);

    res.status(201).json({
      success: true,
      message: "Book added to library successfully.",
      data: newBook[0],
    });
  } catch (error) {
    console.error("Add book error:", error);
    res.status(500).json({ success: false, message: "Failed to add book." });
  }
}

// PUT /api/library/books/:id (Admin)
export async function updateBook(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, author, genre, isbn, cover_image, description, total_copies, available_copies, location, is_active } = req.body;

    const [existing] = await pool.query<RowDataPacket[]>("SELECT * FROM library_books WHERE id = ?", [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: "Book not found." });
      return;
    }

    const current = existing[0];
    const newTotal = total_copies !== undefined ? parseInt(total_copies) : current.total_copies;
    let newAvailable = available_copies !== undefined ? parseInt(available_copies) : current.available_copies;

    if (total_copies !== undefined && available_copies === undefined) {
      const diff = newTotal - current.total_copies;
      newAvailable = Math.max(0, current.available_copies + diff);
    }

    await pool.query(
      `UPDATE library_books
       SET title = ?, author = ?, genre = ?, isbn = ?, cover_image = ?, description = ?, total_copies = ?, available_copies = ?, location = ?, is_active = ?
       WHERE id = ?`,
      [
        title !== undefined ? title.trim() : current.title,
        author !== undefined ? author.trim() : current.author,
        genre !== undefined ? genre.trim() : current.genre,
        isbn !== undefined ? isbn.trim() : current.isbn,
        cover_image !== undefined ? cover_image.trim() : current.cover_image,
        description !== undefined ? description.trim() : current.description,
        newTotal,
        newAvailable,
        location !== undefined ? location.trim() : current.location,
        is_active !== undefined ? is_active : current.is_active,
        id,
      ]
    );

    const [updated] = await pool.query<RowDataPacket[]>("SELECT * FROM library_books WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Book updated successfully.",
      data: updated[0],
    });
  } catch (error) {
    console.error("Update book error:", error);
    res.status(500).json({ success: false, message: "Failed to update book." });
  }
}

// DELETE /api/library/books/:id (Admin)
export async function deleteBook(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const [result] = await pool.query<ResultSetHeader>("DELETE FROM library_books WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: "Book not found." });
      return;
    }

    res.json({
      success: true,
      message: "Book removed from library.",
    });
  } catch (error) {
    console.error("Delete book error:", error);
    res.status(500).json({ success: false, message: "Failed to delete book." });
  }
}

// GET /api/library/loans (Admin)
export async function getLoans(req: Request, res: Response): Promise<void> {
  try {
    const { status, room, search } = req.query;
    let sql = `
      SELECT l.*, b.title as book_title, b.author as book_author, b.cover_image as book_cover, b.genre as book_genre
      FROM library_loans l
      LEFT JOIN library_books b ON l.book_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== "all") {
      sql += " AND l.status = ?";
      params.push(status);
    }

    if (room) {
      sql += " AND l.room_number LIKE ?";
      params.push(`%${room}%`);
    }

    if (search) {
      sql += " AND (l.guest_name LIKE ? OR l.room_number LIKE ? OR b.title LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += " ORDER BY l.id DESC";

    const [rows] = await pool.query(sql, params);
    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows,
    });
  } catch (error) {
    console.error("Get loans error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch book loans." });
  }
}

// POST /api/library/loans (Admin - Issue Book)
export async function issueBook(req: Request, res: Response): Promise<void> {
  try {
    const { book_id, user_id, guest_name, room_number, phone, due_date, notes } = req.body;

    if (!book_id || !guest_name || !room_number || !due_date) {
      res.status(400).json({ success: false, message: "Book, guest name, room number, and due date are required." });
      return;
    }

    // Check book availability
    const [bookRows] = await pool.query<RowDataPacket[]>("SELECT * FROM library_books WHERE id = ?", [book_id]);
    if (bookRows.length === 0) {
      res.status(404).json({ success: false, message: "Book not found." });
      return;
    }

    const book = bookRows[0];
    if (book.available_copies <= 0) {
      res.status(400).json({ success: false, message: "No available copies of this book currently." });
      return;
    }

    // If user_id is not passed, check if there is a registered user with this phone or name
    let assignedUserId = user_id || null;
    if (!assignedUserId && phone) {
      const [userMatch] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE phone = ? LIMIT 1", [phone]);
      if (userMatch.length > 0) {
        assignedUserId = userMatch[0].id;
      }
    }

    // Insert loan
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO library_loans (book_id, user_id, guest_name, room_number, phone, due_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [book_id, assignedUserId, guest_name.trim(), room_number.trim(), phone ? phone.trim() : "", due_date, notes ? notes.trim() : ""]
    );

    // Decrement available copies
    await pool.query("UPDATE library_books SET available_copies = available_copies - 1 WHERE id = ?", [book_id]);

    const [newLoan] = await pool.query<RowDataPacket[]>(
      `SELECT l.*, b.title as book_title, b.author as book_author, b.cover_image as book_cover
       FROM library_loans l
       LEFT JOIN library_books b ON l.book_id = b.id
       WHERE l.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: `Book "${book.title}" issued to Room ${room_number} (${guest_name}).`,
      data: newLoan[0],
    });
  } catch (error) {
    console.error("Issue book error:", error);
    res.status(500).json({ success: false, message: "Failed to issue book." });
  }
}

// PUT /api/library/loans/:id/return (Admin - Mark Returned)
export async function returnBook(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const [loanRows] = await pool.query<RowDataPacket[]>("SELECT * FROM library_loans WHERE id = ?", [id]);
    if (loanRows.length === 0) {
      res.status(404).json({ success: false, message: "Loan record not found." });
      return;
    }

    const loan = loanRows[0];
    if (loan.status === "returned") {
      res.status(400).json({ success: false, message: "Book is already marked as returned." });
      return;
    }

    // Update loan record
    await pool.query(
      "UPDATE library_loans SET status = 'returned', return_date = NOW() WHERE id = ?",
      [id]
    );

    // Increment available copies on the book
    await pool.query("UPDATE library_books SET available_copies = available_copies + 1 WHERE id = ?", [loan.book_id]);

    const [updatedLoan] = await pool.query<RowDataPacket[]>(
      `SELECT l.*, b.title as book_title, b.author as book_author, b.cover_image as book_cover
       FROM library_loans l
       LEFT JOIN library_books b ON l.book_id = b.id
       WHERE l.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Book returned and inventory updated successfully.",
      data: updatedLoan[0],
    });
  } catch (error) {
    console.error("Return book error:", error);
    res.status(500).json({ success: false, message: "Failed to return book." });
  }
}

// GET /api/library/my-loans (User)
export async function getUserLoans(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      res.status(401).json({ success: false, message: "User not authenticated." });
      return;
    }

    // Find loans either by user_id OR matching user's phone or email
    const [userRows] = await pool.query<RowDataPacket[]>("SELECT phone, name, email FROM users WHERE id = ?", [user.id]);
    const userPhone = userRows.length > 0 ? userRows[0].phone : "";
    const userName = userRows.length > 0 ? userRows[0].name : "";


    let sql = `
      SELECT l.*, b.title as book_title, b.author as book_author, b.cover_image as book_cover, b.genre as book_genre, b.location as book_location
      FROM library_loans l
      LEFT JOIN library_books b ON l.book_id = b.id
      WHERE l.user_id = ?
    `;
    const params: any[] = [user.id];

    if (userPhone) {
      sql += " OR (l.phone = ? AND l.phone != '')";
      params.push(userPhone);
    }

    if (userName) {
      sql += " OR l.guest_name LIKE ?";
      params.push(`%${userName}%`);
    }

    sql += " ORDER BY l.id DESC";

    const [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      count: (rows as any[]).length,
      data: rows,
    });
  } catch (error) {
    console.error("Get user loans error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your library loans." });
  }
}
