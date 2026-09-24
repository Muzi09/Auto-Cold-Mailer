# AI-Powered Cold Email Job Application Platform

An enterprise-grade, scalable full-stack web application designed to automate personalized cold email job applications using **OpenAI**, **FastAPI**, **MongoDB**, and **React 19 + TypeScript + Vite**.

Featuring an **Apple Human Interface** aesthetic with frosted glass elements, smooth micro-animations, real-time WebSocket progress updates, browser-side Excel parsing, and resilient SMTP sending queues with exponential retries.

---

## Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** with glassmorphism design tokens
- **Framer Motion**: Micro-interactions & animations
- **XLSX (SheetJS)**: In-browser client-side Excel parser & validator
- **React Dropzone**: Drag-and-drop file upload
- **Zustand**: Global application state manager
- **TanStack React Query**: Server state caching
- **Lucide Icons**: Modern SVG icon set

### Backend
- **Python 3.14+** & **FastAPI**
- **Motor / pymongo**: Async MongoDB driver
- **AsyncIO Queue**: Sequential non-blocking background queue worker
- **OpenAI API**: Custom personalized subject & email body generator
- **aiosmtplib**: Async SMTP mailer with retry backoff & PDF attachment support
- **WebSockets**: Real-time progress broadcasting (`/ws/progress`)

---

## Getting Started

### 1. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Copy environment variables template
cp .env.example .env

# Run FastAPI backend server
python -m uvicorn app.main:app --reload --port 8000
```

Backend will run on: `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Run Vite development server
npm run dev
```

Frontend will run on: `http://localhost:3000` (Proxying API requests to `:8000`).

---

## Excel Application Format

The uploaded Excel sheet must contain these required columns:

| Column Name | Example Value |
| --- | --- |
| `ID` | `1` |
| `Company Name` | `Google` |
| `Job Title` | `Software Engineer` |
| `Skills` | `React, Python, AWS` |
| `Contact Email` | `jobs@google.com` |
| `Job Description` | `We are looking for a Software Engineer to scale our cloud services...` |

> Click the **"Sample Excel"** button in the header bar to download a pre-formatted template instantly.

---

## Running Verification & Tests

```bash
# Run Backend pytest suite
cd backend
python -m pytest

# Run Frontend build check
cd frontend
npm run build
```
