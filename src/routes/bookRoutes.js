import express from "express";
import axios from "axios";
import db from "../db/connect.js";

const router = express.Router();
const BASE_URL = "https://openlibrary.org";
const LOCAL_URL = process.env.LOCAL_URL || `http://localhost:${process.env.PORT || 3000}`;

// Get Book Details
router.get("/details/*", async (req, res) => {
    const book_key = req.params[0];
    if (!book_key) return res.status(400).json({ success: false, error: "Book key is required" });

    try {
        const bookResponse = await axios.get(`${BASE_URL}/${book_key}.json`);
        const book = bookResponse.data;

        const authors = book.authors
            ? await Promise.all(
                book.authors.map(async (authorObj) => {
                    try {
                        const authorResponse = await axios.get(`${BASE_URL}${authorObj.author.key}.json`);
                        return authorResponse.data.name;
                    } catch {
                        return null;
                    }
                })
            ).then((results) => results.filter(Boolean))
            : [];

        res.status(200).json({
            success: true,
            data: {
                title: book.title || "Unknown Title",
                authors,
                cover_id: book.covers?.[0] || null,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to fetch book details" });
    }
});

// Add Book and User Book Relationship
router.post("/add", async (req, res) => {
    let { book_key, user_id, rating, note, read_date } = req.body;

    if (!book_key || !user_id) {
        return res.status(400).json({ success: false, error: "Book key and user ID are required" });
    }

    if (book_key && book_key.startsWith('/')) {
        book_key = book_key.substring(1); 
    }

    try {
        const response = await axios.get(`${LOCAL_URL}/book/details/${book_key}`);
        const { title, authors, cover_id } = response.data.data;

        let bookExists = await db.query("SELECT 1 FROM books WHERE key = $1", [book_key]);
        if (bookExists.rowCount === 0) {
            await db.query("INSERT INTO books (key, title, cover_id) VALUES ($1, $2, $3)", [
                book_key,
                title,
                cover_id,
            ]);

            if (authors.length) {
                const authorInsertPromises = authors.map((author) =>
                    db.query("INSERT INTO authors (book_key, name) VALUES ($1, $2)", [book_key, author])
                );
                await Promise.all(authorInsertPromises);
            }
        }

        await db.query(
            "INSERT INTO user_book (user_id, book_key, rating, note, read_date) VALUES ($1, $2, $3, $4, TO_DATE($5, 'YYYY/MM/DD'))",
            [user_id, book_key, rating, note, read_date]
        );

        res.status(201).json({ success: true, message: "Book added successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: "Failed to add book" });
    }
});

router.get("/search", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ success: false, error: "Query parameter is required" });

    try {
        const response = await axios.get(`${BASE_URL}/search.json?q=${encodeURIComponent(query)}`);
        const data = response.data;

        const results = data.docs.map((book) => ({
            book_key: book.key,
            title: book.title,
            authors: book.author_name,
            cover_id: book.cover_i || null,
        }));

        res.status(200).json({ success: true, data: results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to fetch books from API" });
    }
});

export default router;
