# HUMANEXA: Enterprise Social Impact Platform

An AI-powered platform connecting donors, helpers, and individuals in need with 100% transparency and accountability.

## 🚀 Vision
To eliminate charity fraud and ensure that every contribution reaches its intended destination through AI verification and blockchain-inspired audit logs.

## 🏗️ Architecture Overview
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Redux Toolkit.
- **Backend**: Node.js, Express, TypeScript, MongoDB, Redis, BullMQ.
- **AI Service**: Python, FastAPI, TensorFlow/PyTorch, OpenCV.
- **Infrastructure**: Docker, AWS (S3, SES, SNS), GitHub Actions.

## 📁 Project Structure
- `backend/`: Node.js Express microservice for core business logic.
- `frontend/`: React single-page application.
- `ai_service/`: Python FastAPI service for image verification and fraud detection.
- `infrastructure/`: Nginx and CI/CD configurations.

## 🛠️ Getting Started (Development)

### Prerequisites
- Node.js 20+
- Python 3.10+
- MongoDB (Running locally on port 27017)
- Redis (Running locally on port 6379)

### Step 1: Clone and Setup
```bash
git clone <repo-url>
cd HUMANEXA
```

### Step 2: Startup Manual
**Backend:**
```bash
cd backend
npm install
npm run dev
```

**AI Service:**
```bash
cd ai_service
# Create and activate venv
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🛡️ Security & Compliance
- **JWT + Refresh Tokens**: Secure session management.
- **RBAC**: Role-based access for Donors, Helpers, and Admins.
- **Privacy**: Automated face blurring in help proof images.
- **Audit Logs**: Immutable logs for transaction transparency.
