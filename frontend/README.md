# Smart Campus Companion - Frontend

React.js frontend with Redux Toolkit, React Router, and Socket.io client.

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx  # Route protection
│   ├── features/
│   │   └── auth/
│   │       └── authSlice.js    # Redux auth slice
│   ├── pages/
│   │   ├── Home.jsx            # Landing page
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   └── Dashboard.jsx       # Main dashboard
│   ├── services/
│   │   ├── api.js              # Axios instance
│   │   └── authService.js      # Auth API calls
│   ├── socket/
│   │   └── socket.js           # Socket.io client
│   ├── store/
│   │   └── store.js            # Redux store
│   ├── App.jsx                 # Main component
│   ├── App.css                 # Main styles
│   ├── main.jsx                # Entry point
│   └── index.css               # Base styles
├── .env                        # Environment variables
└── package.json
```

## 🎨 Pages & Routes

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | Home | Public | Landing page with features |
| `/login` | Login | Public | User login |
| `/register` | Register | Public | User registration |
| `/dashboard` | Dashboard | Protected | Main dashboard |

## 🔐 Authentication Flow

### Registration
1. User fills registration form
2. Form validates input
3. Dispatches `register` action
4. Stores tokens in localStorage
5. Initializes Socket.io connection
6. Redirects to dashboard

### Login
1. User enters credentials
2. Dispatches `login` action
3. Stores tokens in localStorage
4. Initializes Socket.io connection
5. Redirects to dashboard

### Token Refresh
- Automatic refresh when token expires
- Uses axios interceptor
- Seamless user experience

### Logout
- Clears localStorage
- Disconnects Socket.io
- Redirects to login

## 🔌 API Integration

### Axios Configuration
```javascript
// Configured in src/services/api.js
- Base URL from environment
- Auto token attachment
- Auto token refresh
- Error handling
```

### Making API Calls
```javascript
import * as authService from "../services/authService";

// Login
const response = await authService.login({ email, password });

// Get profile
const user = await authService.getMe();

// Update profile
const updated = await authService.updateProfile({ name: "New Name" });
```

## 📡 Socket.io Integration

### Initialize Connection
```javascript
import { initSocket } from "./socket/socket";

// After login
initSocket(userId);
```

### Join Rooms
```javascript
import { joinGroup, leaveGroup } from "./socket/socket";

// Join group
joinGroup("group-123");

// Leave group
leaveGroup("group-123");
```

### Listen to Events
```javascript
import { getSocket } from "./socket/socket";

const socket = getSocket();
socket.on("notification", (data) => {
  console.log("New notification:", data);
});
```

## 🎯 Redux Store

### State Structure
```javascript
{
  auth: {
    user: Object | null,
    accessToken: String | null,
    refreshToken: String | null,
    isAuthenticated: Boolean,
    isLoading: Boolean,
    error: String | null
  }
}
```

### Dispatching Actions
```javascript
import { useDispatch } from "react-redux";
import { login, logout, register } from "./features/auth/authSlice";

const dispatch = useDispatch();

// Login
dispatch(login({ email, password }));

// Register
dispatch(register({ name, email, password, role }));

// Logout
dispatch(logout());
```

### Selecting State
```javascript
import { useSelector } from "react-redux";

const { user, isLoading, error } = useSelector((state) => state.auth);
```

## ⚙️ Environment Variables

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Access in code:
```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

## 🎨 Styling

### CSS Variables
```css
--primary-color: #4f46e5
--primary-dark: #4338ca
--secondary-color: #64748b
--success-color: #10b981
--error-color: #ef4444
```

### Responsive Design
- Mobile-first approach
- Breakpoint: 768px
- Grid layouts adapt automatically

## 🧩 Components

### ProtectedRoute
```jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Form Validation
- Client-side validation
- Real-time error display
- Backend validation sync

## 📦 Dependencies

### Production
- `react` - UI library
- `react-dom` - React DOM rendering
- `react-router-dom` - Routing
- `@reduxjs/toolkit` - State management
- `react-redux` - React Redux bindings
- `axios` - HTTP client
- `socket.io-client` - Real-time communication

### Development
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect GitHub repository on Vercel dashboard.

### Build Settings
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Environment Variables
Add in Vercel dashboard:
- `VITE_API_URL` - Your backend URL
- `VITE_SOCKET_URL` - Your Socket.io URL

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm test -- --coverage
```

## 🔍 Debugging

### Redux DevTools
- Install Redux DevTools extension
- Automatically enabled in development

### React DevTools
- Install React DevTools extension
- Inspect component tree and state

### Console Logging
```javascript
// API calls
console.log("API Request:", config);

// Socket events
console.log("Socket Event:", eventName, data);

// State changes
console.log("State:", getState());
```

## 🎯 Features

### Current
- ✅ User authentication
- ✅ Protected routes
- ✅ Profile management
- ✅ Real-time socket connection
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states

### Upcoming
- 📚 Academic schedule view
- 📝 Assignment tracker
- 🤖 AI timetable generator
- 👥 Study groups
- 💬 Real-time chat
- 📅 Calendar integration
- 📄 Notes sharing
- 🔔 Notifications

## 🐛 Common Issues

**API Connection Failed:**
- Check VITE_API_URL in .env
- Verify backend is running
- Check CORS settings

**Socket Connection Error:**
- Verify VITE_SOCKET_URL
- Check backend Socket.io server
- Inspect browser console

**Build Fails:**
- Clear node_modules: `rm -rf node_modules`
- Reinstall: `npm install`
- Clear cache: `npm cache clean --force`

**Routing Issues:**
- Check BrowserRouter setup
- Verify route paths
- Check ProtectedRoute logic

## 📱 Progressive Web App (Future)

The app is ready to be converted to a PWA:
1. Add service worker
2. Add manifest.json
3. Configure caching strategy
4. Add offline support

## 🎨 Customization

### Theme Colors
Edit `src/App.css`:
```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
```

### Logo & Branding
- Replace favicon in `public/`
- Update app name in `index.html`
- Customize header text

## 📚 Learning Resources

- [React Documentation](https://react.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [React Router](https://reactrouter.com)
- [Vite Documentation](https://vitejs.dev)
- [Socket.io Client](https://socket.io/docs/v4/client-api)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 File Size Guidelines

Keep components under 300 lines. Split larger components into smaller ones:
```
components/
├── Dashboard/
│   ├── DashboardHeader.jsx
│   ├── DashboardGrid.jsx
│   └── ProfileSection.jsx
```
