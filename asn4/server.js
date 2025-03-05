const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path'); // Required for file paths
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'test',
  waitForConnections: true,
  connectionLimit: 10,  // Set how many concurrent connections can be open at once
  queueLimit: 0         // No limit on how many waiting queries can be queued
});

// Connect to the database once when the server starts
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1); // Exit the process if connection fails
  } else {
    console.log('Connected to MySQL database.');
    connection.release(); // Release the connection back to the pool

    // Create the `posts` table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    connection.query(createTableQuery, (err, result) => {
      if (err) {
        console.error('Error creating posts table:', err);
      } else {
        console.log('Posts table is ready.');
      }
    });
    
    // Create the `responses` table if it doesn't exist
    const createResponsesTableQuery = `
      CREATE TABLE IF NOT EXISTS responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT,
        data TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id)
      );
    `;
    connection.query(createResponsesTableQuery, (err, result) => {
      if (err) {
        console.error('Error creating responses table:', err);
      } else {
        console.log('Responses table is ready.');
      }
    });
  }
});

// Endpoint to handle form submissions (creating a post)
app.post('/submit-post', (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).send('Title and content are required.');
  }

  const query = 'INSERT INTO posts (title, content) VALUES (?, ?)';
  
  pool.query(query, [title, content], (err, result) => {
    if (err) {
      console.error('Error inserting post:', err);
      return res.status(500).send('Failed to save post.');
    }

    res.send('Post submitted successfully!');
  });
});

// Endpoint to handle response submission
app.post('/postresponse', (req, res) => {
  const { postId, data } = req.body;

  if (!postId || !data) {
    return res.status(400).send('Post ID and response data are required.');
  }

  const query = 'INSERT INTO responses (post_id, data) VALUES (?, ?)';

  pool.query(query, [postId, data], (err, result) => {
    if (err) {
      console.error('Error inserting response:', err);
      return res.status(500).send('Failed to save response.');
    }

    res.send('Response submitted successfully!');
  });
});

// Endpoint to fetch all posts with responses
app.get('/alldata', (req, res) => {
  const query = `
    SELECT posts.id, posts.title, posts.content, posts.timestamp,
           IFNULL(responses.data, '') AS response_data,
           IFNULL(responses.timestamp, '') AS response_timestamp
    FROM posts
    LEFT JOIN responses ON posts.id = responses.post_id
    ORDER BY posts.timestamp DESC
  `;
  
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching posts:', err);
      return res.status(500).send('Error fetching posts.');
    }

    // Grouping responses by post ID
    const posts = results.reduce((acc, row) => {
      const { id, title, content, timestamp, response_data, response_timestamp } = row;

      // Find or create the post entry
      let post = acc.find(post => post.id === id);
      if (!post) {
        post = { id, title, content, timestamp, responses: [] };
        acc.push(post);
      }

      // Add response if it exists
      if (response_data) {
        post.responses.push({
          data: response_data,
          timestamp: response_timestamp
        });
      }

      return acc;
    }, []);

    res.json(posts);
  });
});

// Serve your HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'posting.html'));
});

app.listen(port, () => {
  console.log(`Server running at: http://localhost:${port}`);
});
