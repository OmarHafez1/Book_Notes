import express from "express";
import db from "../db/connect.js";

const router = express.Router();

// Add User
router.post("/add", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: "Name is required" });
  }

  try {
    const result = await db.query("INSERT INTO users(name) VALUES($1) RETURNING id, name", [name]);
    const newUser = result.rows[0]; 
    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to add user" });
  }
});

// Delete User
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, error: "User ID is required" });

  try {
    const result = await db.query("DELETE FROM users WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});

// Fetch Users List
router.get("/users-list", async (req, res) => {
  try {
    const result = await db.query("SELECT id, name FROM users");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users list" });
  }
});

// Fetch Books by User
router.get("/books", async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "User ID is required" });
  if (isNaN(user_id)) return res.status(400).json({ error: "User ID must be a number" });

  try {
    const result = await db.query(
      `SELECT ub.book_key, ub.rating, ub.note, TO_CHAR(ub.read_date, 'DD/MM/YYYY') AS read_date, 
              b.title, b.cover_id, 
              ARRAY(SELECT a.name FROM authors a WHERE a.book_key = b.key) AS authors 
       FROM user_book ub 
       JOIN books b ON ub.book_key = b.key 
       WHERE ub.user_id = $1
       ORDER BY b.title ASC`,
      [user_id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user books" });
  }
});

// Set Selected User
router.post('/set-user/:user_id', (req, res) => {
  const { user_id } = req.params;
  if (!user_id) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }

  if (!req.session) {
    return res.status(500).json({ success: false, error: 'Session not initialized' });
  }

  req.session.selectedUserId = parseInt(user_id, 10);
  res.status(200).json({ success: true, message: `User with ID ${user_id} selected` });
});

export default router;



