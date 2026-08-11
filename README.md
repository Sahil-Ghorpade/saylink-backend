# 🚀 SayLink Backend API

A high-performance Node.js & Express RESTful API with real-time WebSocket capabilities, powered by MongoDB Atlas Cloud and Cloudinary Media Storage.

[![Live App](https://img.shields.io/badge/Live_App-SayLink-f59e0b?style=for-the-badge&logo=render)](https://saylink.onrender.com)
[![Frontend Repo](https://img.shields.io/badge/Frontend-Repository-141416?style=for-the-badge&logo=github)](https://github.com/Sahil-Ghorpade/saylink-frontend)

---

## 🌟 Key Features

- **🔐 Robust JWT Authentication:** Normalized email/username signup, bcrypt password hashing, 7-day JWT expiration, and automatic input validation.
- **🖼️ Multi-Folder Cloudinary Storage:** Dedicated Cloudinary upload pipelines for posts (`saylink/posts`), auto-cropped avatars (`saylink/profiles`), and stories (`saylink/stories`).
- **⚡ Real-Time Socket.io Engine:** Handshake JWT verification, instant messaging, typing status indicators, message delivery & seen confirmations, and real-time notifications.
- **⏱️ Automated Story Lifecycle:** Background cron job (`node-cron`) automatically pruning expired stories after 24 hours.
- **🛡️ Rate Limiting & Error Handling:** `express-rate-limit` protection, CORS white-listing, central error handler, and 404 API route fallback.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Runtime** | Node.js (v22+) |
| **Framework** | Express.js (v5) |
| **Database** | MongoDB Atlas Cloud (Mongoose ODM) |
| **Media Storage** | Cloudinary API (v2) & Multer |
| **Real-time WebSockets** | Socket.io (v4) |
| **Authentication** | JSON Web Tokens (jsonwebtoken) & bcryptjs |
| **Task Scheduling** | node-cron |

---

## 📡 API Endpoints Overview

### Auth (`/api/auth`)
- `POST /api/auth/signup` - Register a new user account (normalized input, format checks)
- `POST /api/auth/login` - Authenticate user and receive 7-day JWT token

### Posts (`/api/posts`)
- `GET /api/posts/feed` - Get personalized chronological feed
- `POST /api/posts` - Create a new post with Cloudinary image upload
- `GET /api/posts/:id` - Fetch single post with comments
- `DELETE /api/posts/:postId` - Delete post and cleanup Cloudinary image & comments
- `POST /api/posts/:postId/like` - Toggle like status on a post
- `POST /api/posts/:postId/comment` - Add a comment to a post
- `DELETE /api/posts/:postId/comments/:commentId` - Delete a comment

### Stories (`/api/stories`)
- `POST /api/stories` - Upload a 24h story (image or video)
- `GET /api/stories/feed` - Get active story groups from followed & public users
- `GET /api/stories/user/:userId` - Fetch active stories for specific user
- `POST /api/stories/:id/view` - Record story view (unique viewers)
- `POST /api/stories/:id/reply` - Send direct message reply to a story
- `DELETE /api/stories/:id` - Delete story

### Users & Profiles (`/api/users` & `/api/profile`)
- `GET /api/profile/:username` - Get user profile details, posts, and relationship
- `PATCH /api/users/settings` - Update bio, name, privacy, & profile picture
- `GET /api/users/search?q=query` - Search users by `@username` or display `name`

### Follow & Requests (`/api/follow` & `/api/follow-requests`)
- `POST /api/follow/:targetId` - Follow / Unfollow user or send follow request
- `GET /api/follow-requests` - List pending follow requests
- `POST /api/follow-requests/:id/accept` - Accept follow request
- `POST /api/follow-requests/:id/reject` - Reject follow request

### Messages & Chat (`/api/conversations` & `/api/messages`)
- `GET /api/conversations` - List active conversations
- `POST /api/conversations` - Start or request direct message conversation
- `GET /api/messages/:conversationId` - Fetch message history
- `POST /api/messages/:conversationId` - Send a text message
- `POST /api/messages/share` - Share a post inside a conversation

### Notifications (`/api/notifications`)
- `GET /api/notifications` - Get user notifications (likes, comments, follows)
- `PATCH /api/notifications/read` - Mark all notifications as read

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=8080
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/saylink
CLIENT_URL=http://localhost:5173,https://saylink.onrender.com
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm start
```

---

## 🔗 Repository Links

- **Frontend Repo:** [SayLink Frontend](https://github.com/Sahil-Ghorpade/saylink-frontend)
- **Backend Repo:** [SayLink Backend](https://github.com/Sahil-Ghorpade/saylink-backend)
- **Live Deployment:** [SayLink Web App](https://saylink.onrender.com)
