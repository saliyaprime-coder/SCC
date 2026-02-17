# Getting Started with Smart Campus Companion

Quick guide to get your SCC project up and running in 5 minutes!

## ⚡ Quick Start

### 1️⃣ Prerequisites Check
Ensure you have installed:
- Node.js (v18+): `node --version`
- npm: `npm --version`
- MongoDB Atlas account or local MongoDB

### 2️⃣ Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd backend

# Install dependencies (if not already installed)
npm install

# Configure environment
# Edit backend/.env with your MongoDB URI and JWT secret

# Start backend server
npm run dev
```

✅ Backend should be running on http://localhost:5000

### 3️⃣ Frontend Setup (Terminal 2)

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies (if not already installed)
npm install

# Start frontend server
npm run dev
```

✅ Frontend should be running on http://localhost:5173

### 4️⃣ Open Your Browser

Navigate to: http://localhost:5173

## 🎯 First Time User Flow

1. **Landing Page** → Click "Get Started" or "Register"
2. **Register** → Fill in your details:
   ```
   Name: Your Name
   Email: your.email@example.com
   Password: (minimum 6 characters)
   Role: Student/Teacher
   Student ID: (optional for students)
   Department: (optional)
   Year: (optional for students)
   ```
3. **Auto-Login** → After registration, you're automatically logged in
4. **Dashboard** → Explore your personalized dashboard!

## 🔐 Test Credentials

After your first registration, you can login with:
- Email: (your registered email)
- Password: (your password)

## 📡 Verify Everything Works

### Check Backend
```bash
# In terminal, test the API
curl http://localhost:5000
```

Expected response:
```json
{
  "success": true,
  "message": "Smart Campus Companion API",
  "version": "1.0.0"
}
```

### Check Frontend
- Open http://localhost:5173
- You should see the landing page with features

### Check Database
- Login to MongoDB Atlas
- Check "scc" database
- Verify "users" collection is created after registration

### Check Socket.io
- Open browser console (F12)
- After login, you should see: "✅ Socket connected: [socket-id]"

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process if needed (Windows)
taskkill /PID <process-id> /F

# Or change PORT in backend/.env
PORT=5001
```

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Try alternative port
npm run dev -- --port 5174
```

### Database connection fails
1. Check MongoDB URI in `backend/.env`
2. Verify IP is whitelisted in MongoDB Atlas
3. Check network connection
4. Try connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/scc?retryWrites=true&w=majority
   ```

### CORS errors
1. Verify `CLIENT_URL` in backend/.env matches frontend URL
2. Check CORS configuration in `backend/src/server.js`
3. Clear browser cache

## 📝 Environment Variables Checklist

### Backend (.env)
- [x] `PORT=5000`
- [x] `MONGO_URI=your_connection_string`
- [x] `JWT_SECRET=your_secret_key`
- [x] `CLIENT_URL=http://localhost:5173`

### Frontend (.env)
- [x] `VITE_API_URL=http://localhost:5000`
- [x] `VITE_SOCKET_URL=http://localhost:5000`

## 🎨 What You'll See

### Home Page (/)
- Hero section with app description
- Feature showcase grid
- "Get Started" and "Login" buttons

### Register Page (/register)
- Registration form
- Role selection (Student/Teacher)
- Conditional fields based on role
- Password confirmation

### Login Page (/login)
- Email and password fields
- Link to registration
- Error messages if credentials invalid

### Dashboard (/dashboard)
- Welcome banner with user info
- Feature cards (8 modules)
- Profile section
- Logout button

## 🚀 Next Steps

Now that your app is running:

1. **Create a test account** and explore the dashboard
2. **Check the README.md** for detailed documentation
3. **Read the architecture** in the main README
4. **Start building** Phase 2 features!

## 📚 Key Files to Know

```
SCC/
├── backend/
│   ├── src/server.js          # Entry point
│   ├── src/models/User.js     # User schema
│   └── src/routes/authRoutes.js
│
├── frontend/
│   ├── src/App.jsx            # Main component
│   ├── src/pages/Dashboard.jsx
│   └── src/store/store.js     # Redux store
│
└── README.md                  # Full documentation
```

## 💡 Development Tips

1. **Backend changes** → Nodemon auto-restarts
2. **Frontend changes** → Vite hot-reloads automatically
3. **Database changes** → Update models, restart backend
4. **Environment changes** → Restart both servers

## 🎉 Success!

If you've reached here with both servers running and can see the dashboard after login, congratulations! You're ready to start building amazing features for your Smart Campus Companion! 🚀

## 🆘 Still Need Help?

- Check terminal logs for errors
- Review browser console (F12)
- Check MongoDB Atlas logs
- Refer to detailed README.md
- Review backend/frontend specific READMEs

## 📞 Support

Open an issue in the repository or contact the development team.

---

**Happy Coding! 💻**
