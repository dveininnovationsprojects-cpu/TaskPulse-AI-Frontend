# TaskPulse AI - Frontend

## Overview

TaskPulse AI Frontend is a modern web application built with React to provide an intuitive interface for managing projects, sprints, tasks, teams, and workforce productivity. It communicates with the Spring Boot backend through REST APIs and presents real-time project data in a clean and responsive user interface.

The frontend is designed to simplify project management by offering dashboards, task tracking, sprint monitoring, workload visualization, and role-based navigation for different types of users.

---

## Features

### Authentication

- Secure Login
- JWT Token Handling
- Protected Routes
- Role-Based Navigation

### Dashboard

- Project Overview
- Sprint Summary
- Team Performance
- Productivity Metrics
- Recent Activities

### Employee Management

- Employee Directory
- Team Information
- Employee Profile
- Reporting Structure

### Project Management

- Project Listing
- Project Details
- Project Timeline
- Project Status

### Sprint Management

- Sprint Overview
- Sprint Progress
- Sprint Goals
- Sprint Timeline

### Task Management

- Task List
- Task Details
- Task Status
- Priority Management
- Task Assignment

### Work Logs

- Daily Work Updates
- Progress Tracking
- Hours Tracking

### Blocker Management

- Report Blockers
- Blocker Status
- Resolution Tracking

### Dashboard & Analytics

- Productivity Charts
- Sprint Health
- Workload Distribution
- KPI Cards
- Trend Analysis

---

## Technology Stack

### Core

- React 19
- Vite
- JavaScript (ES6+)

### Routing

- React Router DOM

### API Integration

- Axios

### State Management

- React Context API

### UI

- HTML5
- CSS3
- Bootstrap / Tailwind CSS
- Material UI (if applicable)

### Charts

- Recharts / Chart.js

### Version Control

- Git
- GitHub

---

## Folder Structure

```text
src/
│
├── assets/
├── components/
├── pages/
├── layouts/
├── routes/
├── services/
├── hooks/
├── context/
├── utils/
├── styles/
├── App.jsx
└── main.jsx
```

---

## Application Flow

1. User Login
2. Authentication
3. Dashboard
4. Project Selection
5. Sprint Management
6. Task Tracking
7. Work Log Updates
8. Dashboard Analytics

---

## API Integration

The frontend communicates with the Spring Boot backend using REST APIs.

Main API modules include:

- Authentication APIs
- Employee APIs
- Project APIs
- Sprint APIs
- Task APIs
- Work Log APIs
- Dashboard APIs

---

## UI Highlights

- Responsive Design
- Clean Dashboard Layout
- Interactive Charts
- Reusable Components
- Modular Architecture
- Easy Navigation
- Role-Based UI
- Real-Time Data Updates

---

## Getting Started

Clone the repository

```bash
git clone <repository-url>
```

Navigate to the project directory

```bash
cd taskpulse-frontend
```

Install dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```

Build for production

```bash
npm run build
```

Preview production build

```bash
npm run preview
```

---

## Environment Variables

Create a `.env` file in the project root.

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## Future Enhancements

- Dark Mode
- Real-Time Notifications
- Advanced Dashboard Filters
- Calendar View
- Mobile Responsive Improvements
- Offline Support

---

## Team

Frontend developed as part of the TaskPulse AI project using React, focusing on building a scalable, responsive, and user-friendly interface for workforce productivity and project management.
