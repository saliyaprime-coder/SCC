# Smart Campus Companion - Backend

Node.js/Express backend with MongoDB, JWT authentication, and Socket.io real-time features.

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   └── authController.js  # Authentication logic
│   ├── middlewares/
│   │   ├── auth.js            # JWT authentication
│   │   └── validation.js      # Input validation
│   ├── models/
│   │   └── User.js            # User schema
│   ├── routes/
│   │   └── authRoutes.js      # Auth endpoints
│   ├── utils/
│   │   └── jwt.js             # JWT utilities
│   └── server.js              # Entry point
├── .env                       # Environment variables
└── package.json
```

## 🔌 API Endpoints

### Public Routes

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student",
  "studentId": "STU001",
  "department": "Computer Science",
  "year": 3
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Protected Routes

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer your_access_token
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "name": "John Updated",
  "department": "Software Engineering",
  "preferences": {
    "theme": "dark"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

## 🔐 Authentication Flow

1. **Register/Login** → Receive `accessToken` & `refreshToken`
2. **API Requests** → Include `Authorization: Bearer accessToken`
3. **Token Expires** → Use `refreshToken` to get new `accessToken`
4. **Logout** → Invalidate refresh token

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ["student", "teacher", "admin"],
  studentId: String (unique, optional),
  department: String,
  year: Number (1-5),
  profilePicture: String,
  isVerified: Boolean,
  refreshTokens: Array,
  googleCalendarConnected: Boolean,
  oneDriveConnected: Boolean,
  preferences: {
    notifications: {
      email: Boolean,
      push: Boolean
    },
    theme: String
  },
  timestamps: true
}
```

## 🔌 Socket.io Events

### Client → Server
- `join-room` - Join personal room
- `join-group` - Join group room
- `leave-group` - Leave group room

### Server → Client
- `connection` - New connection established
- `disconnect` - Connection closed

## 🛡️ Middleware

### Authentication Middleware
```javascript
import { authenticate, authorize } from "./middlewares/auth.js";

// Protect route
router.get("/protected", authenticate, controller);

// Role-based access
router.get("/admin", authenticate, authorize("admin"), controller);
```

### Validation Middleware
```javascript
import { validateRegister, validateLogin } from "./middlewares/validation.js";

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
```

## ⚙️ Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your_super_secret_key

# Email (for future features)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# External APIs (for future features)
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ONEDRIVE_CLIENT_ID=your_onedrive_client_id
ONEDRIVE_CLIENT_SECRET=your_onedrive_client_secret
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test with sample requests
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'
```

## 📝 Scripts

- `npm run dev` - Start with nodemon (auto-reload)
- `npm start` - Start production server
- `npm test` - Run tests

## 🚀 Deployment

### Render
1. Create new Web Service
2. Connect GitHub repository
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables

### Railway
1. Create new project
2. Connect GitHub repository
3. Add environment variables
4. Deploy

## 🔍 Debugging

Enable detailed logging:
```javascript
// In server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

## 📚 Dependencies

### Production
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `socket.io` - Real-time communication
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables

### Development
- `nodemon` - Auto-reload server

## 🐛 Common Issues

**MongoDB Connection Failed:**
- Check MONGO_URI in .env
- Verify network access in MongoDB Atlas
- Check if IP is whitelisted

**JWT Token Invalid:**
- Verify JWT_SECRET is set
- Check token expiration
- Ensure Bearer format: `Bearer token`

**Socket.io Connection Error:**
- Verify CORS configuration
- Check client URL matches
- Ensure Socket.io versions match

## 📖 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Error detail 1", "Error detail 2"]
}
```

## 🔄 Future Endpoints (Planned)

- `/api/schedule` - Academic schedule management
- `/api/assignments` - Assignment tracking
- `/api/groups` - Study group management
- `/api/chat` - Real-time messaging
- `/api/calendar` - Google Calendar integration
- `/api/notes` - Notes sharing
- `/api/polls` - Polling system
- `/api/notifications` - Notification management
