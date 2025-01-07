import express from "express";
import bodyParser from "body-parser";
import { errorHandler } from "./utils/errorHandler.js";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use(errorHandler);

export default app;

