# Smart Notification Scheduler

A full-stack, cloud-hosted smart notification scheduler application. This app allows users to create, manage, and receive scheduled push notifications directly to their browsers, complete with timezone handling, recurrence patterns, and a comprehensive history ledger.

## 🚀 Tech Stack

**Frontend:**
- React 18 (Vite)
- React Router v6
- Axios (for API communication)
- Firebase JS SDK (for Firebase Cloud Messaging Push Notifications)
- CSS (Custom dark theme, responsive)
- Day.js (for timezone and date parsing)

**Backend:**
- Python 3.11+
- Flask & Flask-RESTful
- Flask-JWT-Extended (for Authentication)
- APScheduler (for reliable background job scheduling)
- PyMongo / Motor (for MongoDB interactions)
- Firebase Admin SDK (for sending push notifications)

**Database:**
- MongoDB Atlas (Cloud)

---

## 📂 Project Structure

```text
smart-notifier/
│
├── backend/                  # Python Flask API & Scheduler
│   ├── app/                  # Application factory and modules
│   │   ├── models/           # MongoDB database interactions
│   │   ├── routes/           # API Endpoints (auth, reminders, settings)
│   │   ├── services/         # FCM push logic and APScheduler logic
│   │   ├── utils/            # Validators and helpers
│   │   ├── config.py         # Environment variables config
│   │   ├── extensions.py     # MongoDB, JWT, and Scheduler initialization
│   │   └── __init__.py       # Flask app factory
│   ├── logs/                 # Backend error and info logs
│   ├── run.py                # Backend entry point
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Backend credentials (MongoDB, Firebase, JWT)
│
└── frontend/                 # React Vite App
    ├── public/               
    │   └── firebase-messaging-sw.js # Service Worker for background notifications
    ├── src/
    │   ├── api/              # Axios instance with interceptors
    │   ├── components/       # Reusable UI components (Cards, Badges, Tables)
    │   ├── context/          # Auth Context (Login, Logout, FCM Registration)
    │   ├── pages/            # View components (Dashboard, SetReminder, Auth)
    │   ├── styles/           # Global CSS and layout styling
    │   ├── App.jsx           # App Routes
    │   ├── firebase.js       # Firebase SDK initialization
    │   └── main.jsx          # React DOM entry
    ├── package.json          # Node dependencies
    └── .env                  # Frontend credentials (Vite Firebase config)
```

---

## 🛠️ Prerequisites

Before running this project, ensure you have the following installed:
1. **Node.js** (v16+ recommended)
2. **Python** (v3.11+ recommended)
3. A **MongoDB Atlas** account and cluster URI.
4. A **Firebase** project with Cloud Messaging enabled (both a Service Account JSON for the backend, and Web Push certificates for the frontend).

---

## ⚙️ Environment Setup

You need to create a `.env` file in **both** the `backend/` and `frontend/` folders.

### 1. Backend `.env` (`backend/.env`)
Create a `.env` file in the `backend/` directory with the following variables:
```env
# Flask configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your_secure_flask_secret_key_here

# JWT configuration
JWT_SECRET_KEY=your_secure_jwt_secret_key_here
JWT_ACCESS_TOKEN_EXPIRES=3600    # 1 hour
JWT_REFRESH_TOKEN_EXPIRES=604800 # 7 days

# MongoDB configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smart_notifier?retryWrites=true&w=majority

# Firebase Admin configuration
FIREBASE_SERVICE_ACCOUNT_JSON=./smart-scheduler.json # Path to your Firebase service account JSON file

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```
*Note: Ensure your `smart-scheduler.json` Firebase service account file is placed inside the `backend/` directory.*

### 2. Frontend `.env` (`frontend/.env`)
Create a `.env` file in the `frontend/` directory with the following variables:
```env
VITE_API_BASE_URL=http://localhost:5000/api

# Firebase Project Configuration (found in Firebase Console -> Project Settings)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Web Push Certificate (VAPID Key)
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

---

## 🏃‍♂️ How to Run the App

### 1. Start the Backend
Open a terminal and navigate to the `backend/` folder:

```bash
# Navigate to backend
cd backend/

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python run.py
```
*The backend will run on `http://127.0.0.1:5000`.*

### 2. Start the Frontend
Open a **new** terminal window and navigate to the `frontend/` folder:

```bash
# Navigate to frontend
cd frontend/

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
*The React app will run on `http://localhost:5173`.*

---

## 🔔 Important Note on Push Notifications
To successfully receive push notifications:
1. Ensure your browser allows notifications from `localhost:5173`.
2. Ensure your Windows/macOS "Do Not Disturb" or "Focus Assist" is turned **OFF**. If it is turned on, the OS will silently swallow the notifications.
3. If the browser window is closed or minimized, the robust Service Worker (`firebase-messaging-sw.js`) will catch the background message and display the popup natively on your desktop.

---
*Built with ❤️ from scratch.*
