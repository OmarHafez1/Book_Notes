import express from "express";
import bodyParser from "body-parser";
import bookRoutes from "./routes/bookRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./utils/errorHandler.js";

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static Files
app.use(express.static("public"));

// Error Handling Middleware
app.use(errorHandler);

export default app;
