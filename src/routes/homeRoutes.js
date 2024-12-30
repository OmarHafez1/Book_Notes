import express from "express";
import axios from "axios";

const router = express.Router();
const LOCAL_URL = process.env.LOCAL_URL || `http://localhost:${process.env.PORT || 3000}`;
const DEFAULT_USER_ID = 4; // Replace with dynamic logic if needed

// Home Route
router.get("/", async (req, res) => {
  try {
    const booksResponse = await axios.get(`${LOCAL_URL}/user/books?user_id=${DEFAULT_USER_ID}`);
    const books = booksResponse.data;

    res.render("index.ejs", { books });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch books for homepage.");
  }
});

router.get("/users", async (req, res) => {
  try {
    const usersResponse = await axios.get(`${LOCAL_URL}/user/users-list`);
    const users = usersResponse.data;
   
    res.render("users.ejs", { users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch users for users page.")
  }
});


export default router;
