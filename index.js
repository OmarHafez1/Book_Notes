import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Database Connection
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book_notes",
  password: "2231253",
  port: 5432,
});

db.connect((err) => {
  if (err) {
    console.error("Failed to connect to the database", err);
    process.exit(1);
  } else {
    console.log("Connected to the database");
  }
});

// Constants
const BASE_URL = "https://openlibrary.org";
const LOCAL_URL = process.env.LOCAL_URL || `http://localhost:${port}`;
var user_id = 4;

// Routes

// Home Route
app.get("/", async (req, res) => {
  const books = (await axios.get(`${LOCAL_URL}/api/user_books?user_id=${user_id}`)).data;
  res.render('index.ejs', {
    books: books,
  });
});

// Add User
app.post("/add_user", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: "Name is required" });

  try {
    await db.query("INSERT INTO users(name) VALUES($1)", [name]);
    res.status(201).json({ success: true, message: "User added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to add user" });
  }
});

// Search Books
app.get("/api/search-books", async (req, res) => {
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

// Get Book Details
app.get("/api/book-details/*", async (req, res) => {
  const book_key = req.params[0];
  if (!book_key) return res.status(400).json({ success: false, error: "Book key is required" });

  try {
    const bookResponse = await axios.get(`${BASE_URL}/${book_key}.json`);
    const book = bookResponse.data;

    const authors = book.authors
      ? await Promise.all(
          book.authors.map(async (authorObj) => {
            try {
              // Fetch detailed author info using author.key
              const authorResponse = await axios.get(`${BASE_URL}${authorObj.author.key}.json`);
              return authorResponse.data.name; // Extract the name of the author
            } catch (err) {
              console.error(`Failed to fetch author details for key: ${authorObj.author.key}`, err);
              return null; // Return null if fetching fails
            }
          })
        ).then((results) => results.filter((authorName) => authorName)) // Remove null values
      : [];

    const result = {
      title: book.title || "Unknown Title",
      authors,
      cover_id: book.covers ? book.covers[0] : null,
    };

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch book details" });
  }
});


// Add Book and User Book Relationship
app.post("/api/add-book", async (req, res) => {
  const { book_key, user_id, rating, note, read_date } = req.body;

  if (!book_key || !user_id) {
    return res.status(400).json({ success: false, error: "Book key and user ID are required" });
  }

  try {
    const response = await axios.get(`${LOCAL_URL}/api/book-details/${book_key}`);
    const { title, authors, cover_id } = response.data.data;

    let bookResult = await db.query("SELECT * FROM books WHERE key = $1", [book_key]);
    if (bookResult.rows.length === 0) {
      await db.query("INSERT INTO books (key, title, cover_id) VALUES ($1, $2, $3)", [
        book_key,
        title,
        cover_id,
      ]);

      if (authors && authors.length > 0) {
        const authorInsertPromises = authors.map((author) =>
          db.query("INSERT INTO authors (book_key, name) VALUES ($1, $2)", [book_key, author])
        );
        await Promise.all(authorInsertPromises);
      }
    }

    await db.query(
      "INSERT INTO user_book (user_id, book_key, rating, note, read_date) VALUES ($1, $2, $3, $4, TO_DATE($5, 'DD/MM/YYYY'))",
      [user_id, book_key, rating, note, read_date]
    );

    res.status(201).json({ success: true, message: "Book added successfully" });
  } catch (err) {
    if (err.code === "23505") {
      res.status(409).json({ success: false, error: "This book has already been added by the user." });
    } else {
      console.error(err);
      res.status(500).json({ success: false, error: "Failed to add book" });
    }
  }
});

// Get Books for a Specific User
app.get("/api/user_books", async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "User ID is required" });

  try {
    const result = await db.query(
      `SELECT ub.book_key, ub.rating, ub.note, TO_CHAR(ub.read_date, 'DD/MM/YYYY') AS read_date, 
              b.title, b.cover_id, 
              ARRAY(SELECT a.name FROM authors a WHERE a.book_key = b.key) AS authors 
       FROM user_book ub 
       JOIN books b ON ub.book_key = b.key 
       WHERE ub.user_id = $1`,
      [user_id]
    );
    res.status(200).json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user books" });
  }
});

// Start the Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

