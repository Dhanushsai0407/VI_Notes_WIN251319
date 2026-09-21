const express = require("express");
const mongoose = require("mongoose");
const sessionRoutes = require("./routes/sessionRoutes");
const cors = require("cors");
require("dotenv").config();

const noteRoutes = require("./routes/noteRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/sessions",sessionRoutes);
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

app.use("/api/notes", noteRoutes);

app.get("/", (req, res) => {
    res.send("Backend Running");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});