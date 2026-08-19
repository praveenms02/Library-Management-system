# Library Management System

A full-stack library management application that allows librarians and users to manage books, issue books to users, and track returns. Built with Node.js/Express backend and React/TypeScript frontend with modern UI components.

## Live Demo
*Coming soon - Deploy on Render*

## Features

### Book Management
- View all books with details (title, author, ISBN, category, available copies)
- Add new books to the library
- Edit existing book information
- Delete books from the system
- Track available copies for each book

### User Management
- Register and log in with hashed passwords
- Store user information with admin, user, and student roles
- Persist JWT sessions for seven days

### Issue/Return System
- Issue books to users with issue date tracking
- Track return dates for issued books
- Monitor book status (issued/returned)
- Prevent over-issuing when copies unavailable
- View issue history

### Technical Features
- RESTful API backend
- JSON Web Token (JWT) authentication
- Password encryption with bcryptjs
- CORS-enabled for frontend integration
- Modern React UI with TypeScript
- Responsive Shadcn UI components with TailwindCSS

## Tech Stack

### Backend
- **Runtime:** Node.js v24+
- **Framework:** Express.js 5.2
- **Database:** MongoDB (local)
- **Authentication:** JWT, bcryptjs
- **Server Rendering:** EJS
- **Tools:** Nodemon, Cors, Dotenv

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **UI Framework:** Shadcn UI + Radix UI
- **Styling:** TailwindCSS
- **State Management:** React Query (@tanstack/react-query)
- **Form Handling:** React Hook Form
- **Validation:** Zod

## Folder Structure

```bash
Library management System/
│
├── backend/
│   ├── models/
│   │   ├── Book.js          # Book schema
│   │   ├── Issue.js         # Issue/Return schema
│   │   └── User.js          # User schema
│   ├── routes/
│   │   ├── bookRoutes.js    # Book CRUD endpoints
│   │   └── issueRoutes.js   # Issue/Return endpoints
│   ├── views/               # EJS templates
│   │   ├── Books/
│   │   └── issues/
│   ├── init/
│   │   ├── data.js          # Database seed data
│   │   └── index.js
│   ├── public/              # Static files
│   ├── index.js             # Main server file
│   └── package.json
│
├── library-dashboard/       # Frontend React app
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service calls
│   │   ├── context/         # React context
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utility functions
│   │   ├── App.jsx          # Main App component
│   │   └── main.jsx         # Entry point
│   ├── public/
│   ├── tailwind.config.ts   # TailwindCSS config
│   ├── vite.config.ts       # Vite config
│   └── package.json
│
└── README.md
```

## Installation and Setup

### Prerequisites
- Node.js v24+
- MongoDB (running on localhost:27017)
- npm or yarn

### 1. Clone/Setup Repository
```bash
cd "Library management System"
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Start MongoDB locally (in a separate terminal)
mongod

# Run backend server (development mode)
npm run dev
```

Backend runs on: `http://localhost:8080`

### 3. Frontend Setup
```bash
cd library-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

## Running the Project

### Terminal 1: Start MongoDB
```bash
mongod
```

### Terminal 2: Start Backend
```bash
cd backend
npm run dev
```

You should see:
```
database connected
Server is running on port 8080
```

### Terminal 3: Start Frontend
```bash
cd library-dashboard
npm run dev
```

Open browser: `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /auth/register` - Register a regular user
- `POST /auth/login` - Log in and receive a seven-day JWT

### Books
- `GET /books` - Get all books
- `POST /books` - Create new book
- `GET /books/:id` - Get book by ID
- `GET /books/:id/edit` - Get book for editing
- `PUT /books/:id` - Update book
- `DELETE /books/:id` - Delete book

### Issues (Book Issuing/Returning)
- `GET /issues/new` - Get issue form with books and users
- `POST /issues` - Issue a book to user
- `PUT /issues/:id` - Update issue status
- `DELETE /issues/:id` - Delete issue record
- `GET /issues/overdue` - List currently overdue issues (admin only)

## Environment Variables

Backend uses MongoDB connection string:
```
mongodb://127.0.0.1:27017/Library
```

Create `backend/.env` with:
```
JWT_SECRET=replace-this-with-a-long-random-secret
FINE_PER_DAY=1
FINE_CURRENCY=USD
```

The seed script creates `admin@library.local` with password `admin123`. Change this in a real deployment.

## Build for Production

### Backend
Backend is already production-ready with Node.js

### Frontend
```bash
cd library-dashboard
npm run build
```

Creates optimized build in `dist/` folder

## Testing

Run frontend tests:
```bash
cd library-dashboard
npm run test          # Run tests once
npm run test:watch   # Watch mode
```

## Future Improvements
- Book search and filter functionality
- Due date reminders for overdue books
- Book categories and filtering
- Email notifications for issue/return
- Deployment on Render or Vercel
- Unit and integration tests
- API documentation with Swagger/OpenAPI

## Project Structure Overview

This is an **MVC-style full-stack application** with:
- **Separation of Concerns:** Backend handles data/logic, Frontend handles UI
- **RESTful API:** Clean API endpoints for CRUD operations
- **Modern Frontend:** React with TypeScript and component-based architecture
- **Database-Driven:** MongoDB for persistent data storage
- **Responsive Design:** Mobile-friendly UI with TailwindCSS
