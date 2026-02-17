# Smart Campus Companion - Complete Project Structure

## 📁 Full Directory Tree

```
SCC/
│
├── backend/                          # Node.js Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # MongoDB connection configuration
│   │   │
│   │   ├── controllers/
│   │   │   └── authController.js    # Authentication business logic
│   │   │                            # (register, login, logout, refresh, profile)
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.js              # JWT authentication & authorization
│   │   │   └── validation.js        # Input validation middleware
│   │   │
│   │   ├── models/
│   │   │   └── User.js              # Mongoose User schema
│   │   │                            # (name, email, password, role, etc.)
│   │   │
│   │   ├── routes/
│   │   │   └── authRoutes.js        # Authentication API routes
│   │   │                            # (/register, /login, /logout, /me, etc.)
│   │   │
│   │   ├── utils/
│   │   │   └── jwt.js               # JWT token generation & verification
│   │   │
│   │   └── server.js                # Express server entry point
│   │                                # (middleware, routes, socket.io setup)
│   │
│   ├── node_modules/                # Backend dependencies
│   ├── .env                         # Environment variables (NOT in git)
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Backend dependencies & scripts
│   ├── package-lock.json            # Locked dependency versions
│   └── README.md                    # Backend documentation
│
├── frontend/                        # React Frontend
│   ├── public/                      # Static assets
│   │   └── vite.svg                 # Default Vite icon
│   │
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx  # Route protection HOC
│   │   │
│   │   ├── features/
│   │   │   └── auth/
│   │   │       └── authSlice.js    # Redux Toolkit auth slice
│   │   │                           # (state, actions, thunks)
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page (/)
│   │   │   ├── Login.jsx           # Login page (/login)
│   │   │   ├── Register.jsx        # Registration page (/register)
│   │   │   └── Dashboard.jsx       # Main dashboard (/dashboard)
│   │   │
│   │   ├── services/
│   │   │   ├── api.js              # Axios instance with interceptors
│   │   │   └── authService.js      # Auth API service functions
│   │   │
│   │   ├── socket/
│   │   │   └── socket.js           # Socket.io client setup
│   │   │
│   │   ├── store/
│   │   │   └── store.js            # Redux store configuration
│   │   │
│   │   ├── App.css                 # Main application styles
│   │   ├── App.jsx                 # Main App component with routing
│   │   ├── index.css               # Global base styles
│   │   └── main.jsx                # React entry point
│   │
│   ├── node_modules/               # Frontend dependencies
│   ├── .env                        # Environment variables (NOT in git)
│   ├── .eslintrc.cjs               # ESLint configuration
│   ├── .gitignore                  # Git ignore rules
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Frontend dependencies & scripts
│   ├── package-lock.json           # Locked dependency versions
│   ├── vite.config.js              # Vite configuration
│   └── README.md                   # Frontend documentation
│
├── .gitignore                      # Root gitignore
├── GETTING_STARTED.md              # Quick start guide
├── PROJECT_STRUCTURE.md            # This file
└── README.md                       # Main project documentation
```

## 🔍 File Descriptions

### Backend Core Files

#### `server.js`
- Express app initialization
- Middleware setup (CORS, JSON parsing)
- Route mounting
- Socket.io server setup
- MongoDB connection
- Error handling

#### `models/User.js`
- User schema definition
- Password hashing (bcrypt)
- Password comparison method
- Token storage
- Profile management
- Timestamps

#### `controllers/authController.js`
- `register()` - Create new user account
- `login()` - Authenticate user
- `logout()` - Invalidate refresh token
- `refreshAccessToken()` - Generate new access token
- `getMe()` - Get current user profile
- `updateProfile()` - Update user information

#### `middlewares/auth.js`
- `authenticate()` - Verify JWT token
- `authorize()` - Role-based access control
- `optionalAuth()` - Optional authentication

#### `routes/authRoutes.js`
- API endpoint definitions
- Middleware chaining
- Route protection

#### `utils/jwt.js`
- Token generation functions
- Token verification
- Expiration handling

### Frontend Core Files

#### `App.jsx`
- Main component
- Router setup
- Redux Provider
- Route definitions

#### `pages/Home.jsx`
- Landing page
- Feature showcase
- Call-to-action buttons

#### `pages/Login.jsx`
- Login form
- Form validation
- Redux dispatch
- Auto-redirect on success

#### `pages/Register.jsx`
- Registration form
- Role-based fields
- Password confirmation
- Form validation

#### `pages/Dashboard.jsx`
- Protected route
- User welcome
- Feature cards
- Profile display
- Logout functionality

#### `features/auth/authSlice.js`
- Redux state management
- Async thunks (register, login, logout)
- LocalStorage sync
- Socket initialization

#### `services/api.js`
- Axios configuration
- Request interceptors (token attachment)
- Response interceptors (auto-refresh)
- Error handling

#### `socket/socket.js`
- Socket.io client
- Connection management
- Room joining/leaving
- Event handlers

#### `components/ProtectedRoute.jsx`
- Route protection logic
- Authentication check
- Redirect to login

## 📦 Dependencies Overview

### Backend Dependencies
```json
{
  "express": "Web framework",
  "mongoose": "MongoDB ODM",
  "bcryptjs": "Password hashing",
  "jsonwebtoken": "JWT authentication",
  "socket.io": "Real-time communication",
  "cors": "Cross-origin requests",
  "dotenv": "Environment variables",
  "axios": "HTTP client",
  "nodemailer": "Email sending (future)"
}
```

### Frontend Dependencies
```json
{
  "react": "UI library",
  "react-dom": "React rendering",
  "react-router-dom": "Routing",
  "@reduxjs/toolkit": "State management",
  "react-redux": "Redux bindings",
  "axios": "HTTP client",
  "socket.io-client": "Real-time client"
}
```

## 🔄 Data Flow

### Authentication Flow
```
User Input (Login/Register)
    ↓
Frontend Form Validation
    ↓
Redux Action Dispatch
    ↓
API Service Call (axios)
    ↓
Backend Route
    ↓
Middleware (validation)
    ↓
Controller Logic
    ↓
Database Operation (Mongoose)
    ↓
Response with Tokens
    ↓
Redux State Update
    ↓
LocalStorage Update
    ↓
Socket.io Connection
    ↓
Redirect to Dashboard
```

### Protected Route Access
```
Route Request
    ↓
ProtectedRoute Component
    ↓
Check isAuthenticated (Redux)
    ↓
If YES → Render Component
    ↓
If NO → Redirect to Login
```

### Token Refresh Flow
```
API Request with Expired Token
    ↓
Response: 401 Unauthorized
    ↓
Axios Interceptor Catches Error
    ↓
Send Refresh Token to /api/auth/refresh
    ↓
Receive New Access Token
    ↓
Update LocalStorage
    ↓
Retry Original Request
    ↓
Success
```

## 🎯 Module Relationships

```
Frontend                Backend
--------                -------
App.jsx         →       server.js
  ↓                       ↓
Router          →       Routes
  ↓                       ↓
Pages           →       Controllers
  ↓                       ↓
Redux Store     →       Models
  ↓                       ↓
Services        →       Database
  ↓                       ↓
Socket Client   ←→      Socket Server
```

## 🚀 Startup Sequence

### Backend Startup
1. Load environment variables (.env)
2. Import dependencies
3. Create Express app
4. Setup middleware (CORS, JSON)
5. Mount routes
6. Initialize Socket.io server
7. Connect to MongoDB
8. Start HTTP server on port

### Frontend Startup
1. Load HTML template (index.html)
2. Load main.jsx
3. Initialize React
4. Load App.jsx
5. Setup Redux store
6. Initialize Router
7. Render initial route
8. Check authentication state
9. Redirect based on auth status

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum),
  studentId: String (unique, optional),
  department: String,
  year: Number,
  profilePicture: String,
  isVerified: Boolean,
  refreshTokens: Array,
  googleCalendarConnected: Boolean,
  googleRefreshToken: String,
  oneDriveConnected: Boolean,
  oneDriveRefreshToken: String,
  preferences: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Layers

1. **Password Security**
   - Bcrypt hashing
   - Salt rounds: 10

2. **Token Security**
   - JWT Access Token (15 min)
   - JWT Refresh Token (7 days)
   - Stored in localStorage

3. **API Security**
   - JWT verification
   - Role-based access
   - Input validation
   - CORS configuration

4. **Database Security**
   - Mongoose schema validation
   - Unique constraints
   - Select excludes for sensitive data

## 📝 Configuration Files

- `.env` - Environment variables
- `.gitignore` - Files to ignore in git
- `package.json` - Project metadata & dependencies
- `vite.config.js` - Frontend build configuration
- `README.md` - Documentation

## 🎨 Styling Architecture

```
index.css                # Base/reset styles
    ↓
App.css                  # Main application styles
    ↓
Component Styles         # Inline component styles
```

CSS Variables (App.css):
- Color palette
- Typography
- Spacing
- Shadows
- Breakpoints

## 🔮 Future Expansion Points

Ready for these modules:
- `/backend/src/controllers/scheduleController.js`
- `/backend/src/controllers/assignmentController.js`
- `/backend/src/controllers/groupController.js`
- `/backend/src/models/Schedule.js`
- `/backend/src/models/Assignment.js`
- `/backend/src/models/Group.js`
- `/frontend/src/pages/Schedule.jsx`
- `/frontend/src/pages/Assignments.jsx`
- `/frontend/src/pages/Groups.jsx`

---

**This structure follows:**
- MVC architecture (Backend)
- Component-based architecture (Frontend)
- Separation of concerns
- Scalable folder structure
- Clean code principles
