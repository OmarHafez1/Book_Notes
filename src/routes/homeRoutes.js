import express from "express";
import session from 'express-session';
import axios from "axios";

const router = express.Router();
const localUrl = process.env.LOCAL_URL || `http://localhost:${process.env.PORT || 3000}`;

// Home Route
router.get("/", async (req, res) => {
  const selectedUserId = parseInt(req.session.selectedUserId);
  
  try {
    if(!selectedUserId) {
      return res.redirect("/users");
    }
    const booksResponse = await axios.get(`${localUrl}/user/books?user_id=${selectedUserId}`);
    const books = booksResponse.data;

    res.render("index.ejs", { books });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch books for homepage.");
  }
});

router.get("/users", async (req, res) => {
  try {
    const usersResponse = await axios.get(`${localUrl}/user/users-list`);
    const users = usersResponse.data;
   
    res.render("users.ejs", { users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch users for users page.")
  }
});

export default router;

