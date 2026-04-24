# 🚀 CareerCraft

**"Precision Engineering for Your Next Career Move"**

CareerCraft is a premium, AI-powered career development platform designed to bridge the gap between candidate potential and industry expectations. By combining state-of-the-art AI coaching, real-time technical assessments, and a gamified social learning ecosystem, CareerCraft provides an elite preparation experience for job seekers worldwide.

---

## ✨ Key Features

### 🎙️ AI Personal Tutor & Voice Interviews
Experience high-fidelity mock interviews powered by **VAPI** and **Google Gemini**.
- **Real-time Voice Interaction**: Natural, conversational interviews with an AI avatar.
- **Resume Personalization**: Upload your PDF resume to receive questions tailored specifically to your experience, projects, and skills.
- **Detailed AI Feedback**: Receive comprehensive reports on communication, technical accuracy, and problem-solving after every session.

### 💻 Live Coding & Compiler
Prepare for technical loops with an integrated development environment.
- **Interactive Code Editor**: A full-featured IDE within the interview interface.
- **Real-time Code Execution**: Write, compile, and run code in multiple languages (JavaScript, Python, etc.) with immediate AI evaluation.
- **Practical Challenges**: Focus on algorithmic and architectural problem-solving.

### 📄 AI Resume Analysis & ATS Optimization
Pass the initial screen with precision.
- **Resume Scan**: Deep analysis of PDF/DOCX resumes.
- **ATS Compatibility**: Scoring and keyword optimization against industry standards.
- **Actionable Feedback**: Step-by-step suggestions to improve formatting and content impact.

### 🎯 AI Job Recommendations
Stop searching, start matching.
- **Skill Extraction**: Automatic skill parsing from your latest resume.
- **Live Listings**: Real-time job fetching from global sources (FindWork.dev, Jobicy).
- **Match Scoring**: AI-calculated compatibility scores (0-100%) with specific reasoning for every recommendation.

### 🎓 Course Builder & LMS
Learn from the best or become an industry mentor.
- **Advanced Course Builder**: Tutors can create rich, structured courses with chapters and lessons (Text/Video).
- **Community Marketplace**: Browse and enroll in premium courses with seamless **PayHere** integration.
- **Moderation & Reporting**: Community-driven quality control with admin oversight.

### 🎮 Gamified Social Ecosystem
Prep is a marathon, not a sprint. We make it engaging.
- **Career XP & Tiers**: Earn XP for every lesson completed. Progress from **Novice** to **Master**.
- **Digital Badges**: Awarded for course completions and shareable on LinkedIn.
- **Social Hub**: Connect with peers, send friend requests, and exchange real-time direct messages.
- **Friend Suggestions**: AI-driven recommendations based on mutual friends and similar career progress.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js (App Router, Turbopack) |
| **Styling** | Vanilla CSS (Premium Glassmorphism & Micro-animations) |
| **Database** | Firebase Firestore (Real-time synchronization) |
| **Auth** | Firebase Authentication |
| **AI (Logic)** | Google Gemini Pro |
| **AI (Voice)** | VAPI AI Web SDK |
| **Payments** | PayHere Integration |
| **Icons/UI** | Lucide React, Framer Motion |

---

## 🗺️ Site Navigation & Flow

### 🌍 Public Site
- **Home (`/`)**: Platform overview and high-level feature showcase.
- **Community (`/community`)**: Explore shared interviews and public courses.
- **Resume Tool (`/resume`)**: Direct access to the analysis engine.
- **Blog (`/blog`)**: Career advice and industry insights.

### 👨‍🎓 Student Workspace
- **Overview (`/user`)**: Personal stats, XP tracking, and recent activity.
- **Interviews (`/user/interviews`)**: Feedback reports and session history.
- **Friends (`/user/friends`)**: Peer networking and direct messaging.

### 👨‍🏫 Tutor Workspace
- **Tutor Dashboard (`/tutor`)**: Earnings analytics and student performance.
- **Course Manager (`/tutor/courses`)**: Full access to the Course Builder.
- **Financing (`/tutor/earnings`)**: Revenue tracking (LKR) and payout management.

---

## ⚙️ Getting Started

### 1. Installation
```bash
git clone https://github.com/your-username/career-craft.git
cd career-craft
npm install
```

### 2. Environment Configuration
Duplicate `.env.example` to `.env.local` and fill in your keys:
- Firebase Config (Auth, Firestore, Storage)
- Google Gemini API Key
- VAPI Web Token
- PayHere Merchant Details

### 3. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 🛡️ Security & Privacy
CareerCraft implements enterprise-grade security for all personal data.
- **Document Encryption**: Resumes are stored securely in Firebase Storage.
- **Secure Payments**: All transactions are handled via PayHere's encrypted gateway.
- **Data Isolation**: User data is strictly protected via Firestore Security Rules.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ for the next generation of professionals.
