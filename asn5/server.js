const express = require("express");
const bodyParser = require("body-parser");
const nano = require("nano");
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// CouchDB connection
const couchDbUrl = process.env.COUCHDB_URL || "http://admin:password@couchdb:5984";
const dbName = "posts";
const couch = nano(couchDbUrl);

// Initialize the database
(async () => {
    try {
        const dbList = await couch.db.list();
        if (!dbList.includes(dbName)) {
            await couch.db.create(dbName);
            console.log(`Database "${dbName}" created.`);
        }
    } catch (error) {
        console.error("Error connecting to CouchDB:", error);
        process.exit(1);
    }
})();

// Reference the database
const db = couch.db.use(dbName);

// Create a new post
app.post("/submit-post", async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).send("Title and content are required.");
    }

    try {
        const response = await db.insert({ title, content, timestamp: new Date(), responses: [] });
        res.json({ message: "Post created successfully!", id: response.id });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).send("Failed to create post.");
    }
});

// Add a response to a post
app.post("/postresponse", async (req, res) => {
    const { postId, data } = req.body;
    if (!postId || !data) {
        return res.status(400).send("Post ID and response data are required.");
    }

    try {
        const post = await db.get(postId);
        post.responses.push({ data, timestamp: new Date() });
        await db.insert(post);
        res.send("Response added successfully!");
    } catch (error) {
        console.error("Error adding response:", error);
        res.status(500).send("Failed to add response.");
    }
});

// Get all posts with responses
app.get("/alldata", async (req, res) => {
    try {
        const posts = await db.list({ include_docs: true });
        const formattedPosts = posts.rows.map((row) => ({
            id: row.id,
            ...row.doc,
        }));
        res.json(formattedPosts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send("Failed to fetch posts.");
    }
});

// Serve static files from React build folder
app.use(express.static(path.join(__dirname, "my-app", "build")));

// Fallback route to serve React app for unknown routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "my-app", "build", "index.html"));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at: http://localhost:${port}`);
});
