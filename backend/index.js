const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Basic route
app.get("/", (req, res) => {
    res.json({ message: "Backend API is running" });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});
