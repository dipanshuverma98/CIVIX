# CIVIX

CIVIX is a comprehensive civic issue reporting and management platform designed to bridge the gap between citizens and municipal authorities. It allows citizens to report local issues (like potholes, water leaks, or broken streetlights) and provides a structured workflow for government workers and administrators to assign, track, and resolve these issues efficiently.

---

##  Features

- **Role-Based Access Control (RBAC):**
  - **Citizens (Users):** Can report new issues, track the status of their reported issues, add comments, upvote issues, and communicate with assigned workers.
  - **Workers:** Receive assigned issues based on their department and location, update the live status of the issue, and communicate with citizens.
  - **Admins:** View issue heatmaps for their district, track worker performance, and oversee all civic problems in their jurisdiction.
  - **Superadmins:** Manage accounts (create/delete) for admins and workers across different districts and states.
- **Interactive Mapping:** Utilizes **React-Leaflet** to plot issues on a map and generate heatmaps to identify problem-heavy areas.
- **Real-Time Communication & Notifications:** Powered by **Socket.IO** for live chat between citizens and workers, and real-time toast notifications when an issue status changes or is assigned.
- **Secure Authentication:** JWT-based authentication with a secure "Forgot Password" flow utilizing Nodemailer and crypto-hashed reset tokens.

---

##  Tech Stack

**Frontend:**
- React 19
- React Router DOM v7
- Axios
- React-Leaflet (Map integration)
- React-Toastify (Notifications)
- React-Icons
- Vanilla CSS

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (Database)
- Socket.IO (Real-time web sockets)
- JWT (JSON Web Tokens) & Bcryptjs (Auth)
- Nodemailer (Email services)
- Multer (File uploads)
- AWS SDK (S3 integrations)

---

##  Project Structure

```text
CIVIX/
├── backend/               # Express/Node.js Server
│   ├── controllers/       # Route controllers (auth, admin, issue, worker, etc.)
│   ├── models/            # Mongoose schemas (User, Issue, Message, Notification)
│   ├── routes/            # Express route definitions
│   ├── utils/             # Utilities (generateToken, sendEmail)
│   ├── server.js          # Entry point for backend and Socket.io setup
│   └── .env               # Backend environment variables
└── frontend/              # React Client App
    ├── public/            # Static files
    ├── src/
    │   ├── components/    # Reusable UI components organized by feature
    │   ├── services/      # Axios API configuration (api.js)
    │   ├── App.js         # React Router setup
    │   └── socket.js      # Socket.io client configuration
    └── .env               # Frontend environment variables
```

---

##  Environment Variables

Before running the project, you need to set up your `.env` files.

**Backend (`backend/.env`):**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
```

**Frontend (`frontend/.env`):**
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

---

##  Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd CIVIX
```

### 2. Install Backend Dependencies & Start
```bash
cd backend
npm install
npm run dev     # (assuming nodemon is set up) or node server.js
```

### 3. Install Frontend Dependencies & Start
```bash
# In a new terminal window
cd frontend
npm install
npm start
```

The application will be running at [http://localhost:3000](http://localhost:3000) and the backend server at `http://localhost:5000`.

---

## Authentication Flows
- Regular users can sign up freely through the application.
- Worker and Admin accounts **cannot** be registered directly by the public. They must be provisioned by a Superadmin.
- Government emails (`@gov.in` or `@nic.in`) are required for elevated roles.
