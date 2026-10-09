import "dotenv/config";
import pool from "./config/db.js";

async function clearDummyData() {
  const conn = await pool.getConnection();
  try {
    console.log("Starting to clear dummy data...");
    
    // Disable foreign key checks to allow truncating/deleting
    await conn.query("SET FOREIGN_KEY_CHECKS = 0;");

    const tablesToClear = [
      "bookings",
      "patio_bookings",
      "payments",
      "food_orders",
      "food_order_items",
      "contact_messages",
      "expenses",
      "notifications",
      "reviews"
    ];

    for (const table of tablesToClear) {
      try {
        await conn.query(`TRUNCATE TABLE ${table};`);
        console.log(`✅ Cleared ${table}`);
      } catch (e) {
        const err = e as any;
        // Table might not exist yet, that's fine
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`⏭️ Skipped ${table} (Does not exist)`);
        } else {
          console.log(`❌ Error clearing ${table}:`, err.message || err);
        }
      }
    }

    // Clear users who are not admin
    try {
      const [result] = await conn.query("DELETE FROM users WHERE role != 'admin'");
      console.log(`✅ Cleared non-admin users. Rows affected: ${(result as any).affectedRows}`);
    } catch (e) {
      const err = e as any;
      console.log(`❌ Error clearing users:`, err.message || err);
    }
    
    console.log("🎉 All dummy transaction data has been cleared!");
  } catch (error) {
    console.error("Error clearing data:", error);
  } finally {
    // Re-enable foreign key checks safely in finally block
    await conn.query("SET FOREIGN_KEY_CHECKS = 1;");
    conn.release();
    process.exit(0);
  }
}

clearDummyData();
