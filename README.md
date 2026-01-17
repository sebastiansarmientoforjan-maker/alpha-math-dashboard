# 🦅 Alpha Math Dashboard

Real-time analytics dashboard for Math Academy student monitoring.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Git installed  
- Firebase account (free tier)
- Vercel account (free tier)
- GitHub account

### 📋 Step-by-Step Setup

#### **STEP 1: Clone & Install** (5 min)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/alpha-math-dashboard.git
cd alpha-math-dashboard

# Install dependencies
npm install
```

#### **STEP 2: Configure Firebase** (10 min)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named `alpha-math-dashboard`
3. Enable Firestore Database (test mode)
4. Enable Authentication → Email/Password
5. Add your email as a user
6. Get your Firebase config from Project Settings

#### **STEP 3: Environment Variables** (5 min)

Create a `.env.local` file in the root directory:

```env
# Math Academy API
NEXT_PUBLIC_MATH_ACADEMY_API_KEY=pk_live_VktTFGM5m8zU7HP5ZPEY5YKTvoGZH4YvT5

# Firebase Config (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### **STEP 4: Run Locally** (2 min)

```bash
npm run dev
```

Open http://localhost:3000

Login with the email/password you created in Firebase.

#### **STEP 5: Deploy to Vercel** (5 min)

1. Push code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Go to [Vercel](https://vercel.com/)
3. Click "New Project"
4. Import your GitHub repository
5. Add all environment variables from `.env.local`
6. Click "Deploy"

**Done!** Your dashboard will be live at `https://your-project.vercel.app`

---

## 📊 Features

### **TIER 1 Indicators** (Implemented)
- ✅ Velocity Score (XP / Goal)
- ✅ Consistency Index (Activity tracking)
- ✅ Stuck Score (High effort + Low progress)
- ✅ Dropout Probability (Risk assessment)
- ✅ Accuracy Rate (Comprehension)

### **Dashboard Components**
- ✅ Real-time student table
- ✅ Status badges (At Risk, Spinning, Progressing, etc.)
- ✅ Cohort metrics overview
- ✅ Alerts system
- ✅ Pattern recognition
- ✅ Filtering & search

### **Security**
- 🔒 Firebase Authentication (Email/Password)
- 🔒 Private dashboard (login required)
- 🔒 Environment variables for API keys
- 🔒 No data in GitHub (all in Firestore)

---

## 🏗️ Architecture

```
Frontend (Next.js)
    ↓
Firebase Auth (Login)
    ↓
Math Academy API (Data fetch)
    ↓
Firestore (Storage)
    ↓
Vercel (Hosting)
```

---

## 💰 Costs

**100% FREE** with these limits:
- Firebase: 50k reads/day (plenty for 57 students)
- Vercel: 100GB bandwidth/month
- GitHub: Unlimited private repos

You will NOT be charged unless you manually upgrade.

---

## 🔄 Auto-Update (Coming Soon)

Currently, data updates when you click "Refresh". 

Next iteration will add:
- Automatic hourly updates via Firebase Functions
- Background sync
- Real-time indicators

---

## 🛠️ Troubleshooting

### "Firebase not initialized"
- Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set correctly
- Restart dev server after adding env variables

### "Unauthorized" error
- Verify your Math Academy API key is correct
- Make sure it starts with `pk_live_`

### Can't login
- Check that you created a user in Firebase Authentication
- Verify email/password are correct

---

## 📞 Support

Created by: Sebastian Sarmiento Forjan  
Email: sebastian.sarmiento.forjan@gmail.com

---

## 🎯 Roadmap

- [x] Phase 1: Basic dashboard with TIER 1 metrics
- [ ] Phase 2: Automated hourly updates
- [ ] Phase 3: Email alerts for at-risk students
- [ ] Phase 4: Historical trend analysis
- [ ] Phase 5: Mobile app

---

**Last Updated:** January 2026  
**Version:** 1.0.0
