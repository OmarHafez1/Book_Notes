import express from "express";
import session from 'express-session';
import axios from "axios";
import formatDateForInput from "../utils/formatDate.js"; // Using ES module import

const router = express.Router();
const localUrl = process.env.LOCAL_URL || `http://localhost:${process.env.PORT || 3000}`;

  
  // Home Route
  router.get("/", async (req, res) => {
    const selectedUserId = parseInt(req.session.selectedUserId);

    if (!selectedUserId || selectedUserId === -1) {
      return res.redirect("/users");
    }

    try {
      const booksResponse = await axios.get(`${localUrl}/user/books?user_id=${selectedUserId}`);
      const books = booksResponse.data;

      for (const book of books) {
        book.read_date = formatDateForInput(book.read_date);
      }

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

router.get("/books", async (req, res) => {
  const selectedUserId = parseInt(req.session.selectedUserId);
  
  try {
    if(!selectedUserId || selectedUserId === -1) {
      return res.redirect("/users");
    }
    res.render("books.ejs");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch users for users page.")
  }
});

export default router;

