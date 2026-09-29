-- ============================================================
-- Casa Nest Homestay & Restaurant – MySQL Schema
-- Database: casa_nest
-- Run this in phpMyAdmin or MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS casa_nest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE casa_nest;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  phone         VARCHAR(20)   DEFAULT NULL,
  password      VARCHAR(255)  NOT NULL,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: rooms
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  description     TEXT          DEFAULT NULL,
  room_type       VARCHAR(80)   DEFAULT NULL,
  price_per_night DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  capacity        TINYINT UNSIGNED NOT NULL DEFAULT 2,
  amenities       TEXT          DEFAULT NULL,  -- JSON array string e.g. ["King Bed","Wi-Fi","AC"]
  image           VARCHAR(500)  DEFAULT NULL,
  status          ENUM('available', 'unavailable') NOT NULL DEFAULT 'available',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED  DEFAULT NULL,
  room_id         INT UNSIGNED  DEFAULT NULL,
  guest_name      VARCHAR(100)  NOT NULL,
  guest_email     VARCHAR(150)  NOT NULL,
  guest_phone     VARCHAR(20)   DEFAULT NULL,
  check_in        DATE          NOT NULL,
  check_out       DATE          NOT NULL,
  guests          TINYINT UNSIGNED NOT NULL DEFAULT 1,
  total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status          ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  payment_status  ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  notes           TEXT          DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: contact_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  phone       VARCHAR(20)   DEFAULT NULL,
  subject     VARCHAR(200)  DEFAULT NULL,
  message     TEXT          NOT NULL,
  status      ENUM('unread','read','replied') NOT NULL DEFAULT 'unread',
  reply       TEXT          DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id      INT UNSIGNED  DEFAULT NULL,
  customer_name   VARCHAR(100)  DEFAULT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  payment_method  VARCHAR(60)   DEFAULT 'Cash',
  transaction_id  VARCHAR(200)  DEFAULT NULL,
  status          ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: restaurant_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_categories (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  slug          VARCHAR(100)  NOT NULL UNIQUE,
  description   VARCHAR(255)  DEFAULT NULL,
  image         VARCHAR(500)  DEFAULT NULL,
  display_order INT           DEFAULT 0,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: menu_items
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id   INT UNSIGNED  NOT NULL,
  name          VARCHAR(150)  NOT NULL,
  description   TEXT          DEFAULT NULL,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  image         VARCHAR(500)  DEFAULT NULL,
  is_veg        TINYINT(1)    NOT NULL DEFAULT 1,
  spicy_level   ENUM('mild', 'medium', 'spicy') NOT NULL DEFAULT 'mild',
  is_available  TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_menu_category FOREIGN KEY (category_id) REFERENCES restaurant_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: food_orders
-- ============================================================
CREATE TABLE IF NOT EXISTS food_orders (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number    VARCHAR(50)   NOT NULL UNIQUE,
  user_id         INT UNSIGNED  DEFAULT NULL,
  customer_name   VARCHAR(100)  NOT NULL,
  customer_email  VARCHAR(150)  DEFAULT NULL,
  customer_phone  VARCHAR(20)   NOT NULL,
  room_number     VARCHAR(50)   DEFAULT NULL,
  total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status          ENUM('new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'new',
  payment_status  ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
  payment_method  VARCHAR(50)   DEFAULT 'Cash / Pay at Room',
  notes           TEXT          DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: food_order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS food_order_items (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id      INT UNSIGNED  NOT NULL,
  menu_item_id  INT UNSIGNED  DEFAULT NULL,
  item_name     VARCHAR(150)  NOT NULL,
  quantity      INT UNSIGNED  NOT NULL DEFAULT 1,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES food_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_item_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED  DEFAULT NULL,
  customer_name   VARCHAR(100)  NOT NULL,
  customer_email  VARCHAR(150)  DEFAULT NULL,
  rating          TINYINT UNSIGNED NOT NULL DEFAULT 5,
  review          TEXT          NOT NULL,
  room_id         INT UNSIGNED  DEFAULT NULL,
  is_approved     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_review_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: coupons
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(50)   NOT NULL UNIQUE,
  description     VARCHAR(255)  DEFAULT NULL,
  discount_type   ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  discount_value  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_discount    DECIMAL(10,2) DEFAULT NULL,
  start_date      DATE          NOT NULL,
  end_date        DATE          NOT NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  times_used      INT UNSIGNED  NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: staff
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  phone         VARCHAR(20)   DEFAULT NULL,
  role          ENUM('admin', 'manager', 'receptionist', 'restaurant_staff') NOT NULL DEFAULT 'receptionist',
  status        ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: settings
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_name    VARCHAR(50)   NOT NULL DEFAULT 'general',
  setting_key   VARCHAR(100)  NOT NULL UNIQUE,
  setting_value TEXT          NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type        VARCHAR(50)   NOT NULL DEFAULT 'info',
  title       VARCHAR(150)  NOT NULL,
  message     TEXT          NOT NULL,
  is_read     TINYINT(1)    NOT NULL DEFAULT 0,
  link        VARCHAR(255)  DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SAMPLE DATA: rooms
-- ============================================================
INSERT INTO rooms (name, description, room_type, price_per_night, capacity, amenities, image, status) VALUES
(
  'The European Room',
  'Minimal, elegant and timeless. A beautifully designed room inspired by European aesthetics with clean lines, neutral tones, and a calm atmosphere perfect for unwinding.',
  'Deluxe',
  8500.00,
  2,
  '["King Bed","Wi-Fi","AC","Hot Water","Wardrobe","Work Desk"]',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=88',
  'available'
),
(
  'The Kerala Room',
  'A touch of nature, a lot of peace. Inspired by Kerala''s lush green landscapes and warm wooden interiors, this room brings the tropics to Kashi.',
  'Premium',
  9200.00,
  2,
  '["King Bed","Wi-Fi","AC","Hot Water","Garden View","Wardrobe"]',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=88',
  'available'
),
(
  'The Heritage Room',
  'Feel the culture, love the comfort. A room that celebrates India''s rich heritage with carefully curated artefacts and warm, earthy tones. Best suited for families.',
  'Suite',
  10500.00,
  3,
  '["Queen Bed","Wi-Fi","AC","Hot Water","Extra Bed Available","Cultural Decor"]',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=88',
  'available'
) ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================================
-- SAMPLE DATA: restaurant_categories
-- ============================================================
INSERT INTO restaurant_categories (name, slug, description, image, display_order, is_active) VALUES
('Breakfast Specials', 'breakfast', 'Fresh morning delights & artisan bakes', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80', 1, 1),
('Traditional Mains', 'mains', 'Authentic Banarasi and Kerala culinary specialties', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80', 2, 1),
('Light Bites & Starters', 'starters', 'Crisp savory treats for your evening tea', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', 3, 1),
('Beverages & Chai', 'beverages', 'Filter coffee, special masala tea & fresh coolers', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80', 4, 1),
('Desserts', 'desserts', 'Artisanal sweets and handcrafted desserts', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80', 5, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================================
-- SAMPLE DATA: menu_items
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, image, is_veg, spicy_level, is_available) VALUES
(1, 'Casa Special European Breakfast', 'Sourdough toast, poached eggs, grilled tomatoes, butter & artisanal jam with French press coffee', 450.00, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', 0, 'mild', 1),
(1, 'Kerala Appam with Vegetable Stew', 'Soft lace hoppers served with coconut milk aromatic vegetable stew', 380.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80', 1, 'mild', 1),
(2, 'Banarasi Dum Aloo with Poori', 'Slow-cooked spiced baby potatoes served with hot crisp wheat pooris', 420.00, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80', 1, 'medium', 1),
(2, 'Malabar Coconut Curry & Steamed Rice', 'Traditional clay-pot coconut curry infused with curry leaves and mustard seeds', 520.00, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80', 1, 'medium', 1),
(3, 'Paneer Tikka Cigars', 'Smoked cottage cheese wrapped in crisp crust with mint chutney', 320.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80', 1, 'medium', 1),
(4, 'Banarasi Kulhad Masala Chai', 'Rich, cardamom & ginger steeped tea served in traditional terracotta cups', 120.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', 1, 'mild', 1),
(4, 'Authentic Kerala Filter Coffee', 'Freshly brewed dark roasted chicory blend with frothy whole milk', 140.00, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', 1, 'mild', 1),
(5, 'Saffron Malaiyyo', 'Varanasi seasonal winter milk foam infused with saffron and pistachios', 240.00, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80', 1, 'mild', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================================
-- SAMPLE DATA: coupons
-- ============================================================
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, start_date, end_date, is_active) VALUES
('WELCOME10', '10% off for first time guests', 'percentage', 10.00, 3000.00, 1500.00, '2026-01-01', '2026-12-31', 1),
('KASHISTAY', 'Flat ₹1,000 off on 2+ nights', 'fixed', 1000.00, 15000.00, 1000.00, '2026-01-01', '2026-12-31', 1),
('FOODFEST', '15% discount on restaurant dining', 'percentage', 15.00, 800.00, 400.00, '2026-01-01', '2026-12-31', 1)
ON DUPLICATE KEY UPDATE code=VALUES(code);

-- ============================================================
-- SAMPLE DATA: staff
-- ============================================================
INSERT INTO staff (name, email, phone, role, status) VALUES
('Vikramaditya Sharma', 'vikram@casanest.com', '+91 98765 43210', 'admin', 'active'),
('Devika Menon', 'devika@casanest.com', '+91 98765 43211', 'manager', 'active'),
('Rohit Gupta', 'rohit@casanest.com', '+91 98765 43212', 'receptionist', 'active'),
('Chef Sajan', 'sajan@casanest.com', '+91 98765 43213', 'restaurant_staff', 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================================
-- SAMPLE DATA: settings
-- ============================================================
INSERT INTO settings (group_name, setting_key, setting_value) VALUES
('general', 'homestay_name', 'Casa Nest Homestay & Restaurant'),
('general', 'phone', '+91 84000 95434, +91 93369 41261'),
('general', 'email', 'Info@casanesthomestay.in'),
('general', 'instagram', 'https://www.instagram.com/casa_nest__?stkn=eWU0M3Ryb3lvZjkx&utm_source=qr'),
('general', 'address', 'B23/33 Plot 58, Gurudham Colony, Near PMO Office, Varanasi, Uttar Pradesh 221005'),
('booking', 'check_in_time', '14:00'),
('booking', 'check_out_time', '11:00'),
('booking', 'cancellation_policy', 'Free cancellation up to 48 hours before check-in.'),
('restaurant', 'restaurant_open_time', '07:30'),
('restaurant', 'restaurant_close_time', '22:30'),
('restaurant', 'orders_enabled', 'true')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- ============================================================
-- SAMPLE DATA: reviews
-- ============================================================
INSERT INTO reviews (customer_name, customer_email, rating, review, room_id, is_approved) VALUES
('Riya Sharma', 'riya@example.com', 5, 'Felt like home from the very first moment. Beautiful ambience and amazing hospitality! The Kerala vibe inside Kashi is just magical.', 1, 1),
('Amit Verma', 'amit@example.com', 5, 'The food and peaceful rooms are unmatched in Varanasi. Quiet, safe and so well maintained. Best location near the ghats.', 2, 1),
('Sneha Iyer', 'sneha@example.com', 5, 'Perfect blend of comfort, culture and calm. The European room was spotless with soothing aesthetics. Highly recommended!', 3, 1)
ON DUPLICATE KEY UPDATE customer_name=VALUES(customer_name);
