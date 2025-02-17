const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "database.db");
let db = null;
const JWT_SECRET = "3b691a3a51cac81629fb4f98c342285e41d5772b7ed04160dd8dc349d0d8a33b";

const initializeDbAndServer = async () => {
    try {
        db = await open({ filename: dbPath, driver: sqlite3.Database });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT DEFAULT 'Personal',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

    app.listen(PORT, '0.0.0.0', () => console.log(`Server running at http://0.0.0.0:${PORT}/`));
    } catch (error) {
        console.error("DB Error:", error.message);
        process.exit(1);
    }
};
initializeDbAndServer();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    console.log("Auth Header:", authHeader); 

    if (!authHeader) return res.status(401).json({ error: "Token not provided" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({ error: "Invalid or expired token" });
        req.userId = payload.userId;
        next();
    });
};


app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword]);
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(400).json({ error: "User already exists or invalid data" });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "720h" });
    res.json({ jwtToken: token });
});

app.get("/notes", authenticateToken, async (req, res) => {
    const notes = await db.all("SELECT * FROM notes WHERE user_id = ?", [req.userId]);
    res.json(notes);
});

app.get("/notes/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const note = await db.get("SELECT * FROM notes WHERE id = ? AND user_id = ?", [id, req.userId]);
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
});

app.post("/notes", authenticateToken, async (req, res) => {
    console.log("Request Body:", req.body); 
    console.log("User ID:", req.userId);

    const { title, content, category } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
    }

    try {
        const { lastID } = await db.run(
            `INSERT INTO notes (title, content, category, created_at, updated_at, user_id) 
             VALUES (?, ?, ?, datetime('now'), datetime('now'), ?)`,
            [title, content, category || "Personal", req.userId]
        );

        const newNote = await db.get("SELECT * FROM notes WHERE id = ?", [lastID]);
        res.status(201).json(newNote);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error" });
    }
});


app.put("/notes/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const updatedAt = new Date().toISOString();

    await db.run(
        "UPDATE notes SET title = ?, content = ?, category = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        [title, content, category, updatedAt, id, req.userId]
    );

    const updatedNote = await db.get("SELECT * FROM notes WHERE id = ? AND user_id = ?", [id, req.userId]);
    res.json(updatedNote);
});

app.delete("/notes/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    await db.run("DELETE FROM notes WHERE id = ? AND user_id = ?", [id, req.userId]);
    res.json({ message: "Note deleted successfully" });
});

app.patch("/notes/:id/pin", authenticateToken, async (req, res) => {
    const { id } = req.params;
    await db.run("UPDATE notes SET category = 'Pinned' WHERE id = ? AND user_id = ?", [id, req.userId]);
    res.json({ message: "Note pinned successfully" });
});

app.patch("/notes/:id/archive", authenticateToken, async (req, res) => {
    const { id } = req.params;
    await db.run("UPDATE notes SET category = 'Archived' WHERE id = ? AND user_id = ?", [id, req.userId]);
    res.json({ message: "Note archived successfully" });
});

module.exports = app;
