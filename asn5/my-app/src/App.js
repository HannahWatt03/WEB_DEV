import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({ title: "", content: "" });

    // Fetch posts from the server
    const loadPosts = async () => {
        const response = await fetch("/alldata");
        const data = await response.json();
        setPosts(data);
    };

    useEffect(() => {
        loadPosts();
    }, []);

    // Handle post submission
    const handlePostSubmit = async () => {
        if (!newPost.title || !newPost.content) {
            alert("Please fill in both fields!");
            return;
        }

        await fetch("/submit-post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPost),
        });
        setNewPost({ title: "", content: "" });
        loadPosts();
    };

    // Handle response submission
    const handleAddResponse = async (postId) => {
        const responseData = prompt("Enter your response:");
        if (!responseData) return;

        await fetch("/postresponse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, data: responseData }),
        });
        loadPosts();
    };

    return (
        <div>
            <button id="createPostBtn" onClick={() => handlePostSubmit()}>
                Create New Post
            </button>
            <input
                type="text"
                placeholder="Topic"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            />
            <textarea
                placeholder="Post Data"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            ></textarea>

            <div id="postsContainer">
                {posts.map((post) => (
                    <div key={post.id} className="post post-barrier">
                        <h3>{post.title}</h3>
                        <p>{post.content}</p>
                        <div className="timestamp">
                            Posted at: {new Date(post.timestamp).toLocaleString()}
                        </div>
                        <button
                            className="addResponseBtn"
                            onClick={() => handleAddResponse(post.id)}
                        >
                            Add Response
                        </button>
                        <div className="responses">
                            {post.responses.map((response, index) => (
                                <div key={index} className="response">
                                    <p>{response.data}</p>
                                    <div className="timestamp">
                                        Responded at:{" "}
                                        {new Date(response.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;
