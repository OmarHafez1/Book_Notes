import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import homeRoutes from "./routes/homeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// View Engine
app.set("view engine", "ejs");

// Routes
app.use("/", homeRoutes);
app.use("/user", userRoutes);
app.use("/book", bookRoutes); 

// Start the Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
