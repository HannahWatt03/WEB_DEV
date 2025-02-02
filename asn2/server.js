const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Serve Static Files
app.use(express.static(path.join(__dirname)));

// Serve HTML for the root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "posting.html"));
});

// POST Endpoint to Add a Post
app.post("/postmessage", (req, res) => {
  const { topic, data } = req.body;

  if (!topic || !data) {
    return res.status(400).send({ error: "Both topic and data are required" });
  }

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const postEntry = `Topic: ${topic}\nData: ${data}\nTimestamp: ${timestamp}\n\n`;

  const filePath = path.join(__dirname, "posts.txt");

  fs.appendFile(filePath, postEntry, (err) => {
    if (err) {
      return res.status(500).send({ error: "Failed to save the post" });
    }
    res.status(200).send({ message: "Post saved successfully" });
  });
});

// GET Endpoint to Retrieve All Posts
app.get("/getposts", (req, res) => {
  const filePath = path.join(__dirname, "posts.txt");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(200).send({ posts: "" }); // No posts.txt yet
      }
      return res.status(500).send({ error: "Failed to read posts" });
    }
    res.status(200).send({ posts: data });
  });
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

