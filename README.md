# HomeTrace 🏠

A modern real estate platform built with Next.js, featuring advanced appointment management, property listings, and role-based admin panel.

## ✨ Key Features

### 🎯 **Advanced Appointment Management**

- **Google Calendar-style Interface**: Drag-and-drop appointment scheduling with half-hour time slots
- **Smart Workflow**: Customer submits preferred times → Agent schedules → Email notifications → Customer confirms
- **Real-time Updates**: Live calendar view with overlapping appointment support
- **Email Integration**: Automated notifications for appointment requests and confirmations

### 🏘️ **Property Management**

- **Smart Search**: Location-based search (postcode, suburb, state) with real-time filtering
- **Image Galleries**: Multiple property images with professional display
- **Advanced Filtering**: Property type, price range, bedrooms, bathrooms
- **Infinite Scroll**: Seamless pagination with 9 properties per page

### 👥 **Role-Based Access Control**

- **Admin Panel**: Full system management with shadcn/ui components
- **Agent Dashboard**: Manage own properties and appointments
- **Customer Portal**: Browse properties and book appointments

### 🔧 **Technical Highlights**

- **Modern Stack**: Next.js 15, React 19, TypeScript, MongoDB
- **Authentication**: NextAuth.js with role-based permissions
- **UI/UX**: shadcn/ui components with Tailwind CSS
- **Form Validation**: Zod schemas with React Hook Form
- **Database**: Mongoose ODM with optimized queries

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js with credentials provider
- **Forms**: React Hook Form, Zod validation
- **Calendar**: Custom drag-and-drop implementation with date-fns
- **Email**: Nodemailer for automated notifications
- **Deployment**: Vercel-ready configuration

## 📋 Prerequisites

- **Node.js**: 18.0 or higher
- **pnpm**: 8.0 or higher (recommended) or npm/yarn
- **MongoDB**: Local instance or MongoDB Atlas
- **SMTP Server**: For email notifications (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd hometrace
pnpm install
```

### 2. Environment Setup

Create `.env.local` file:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/hometrace

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@hometrace.com

# Seeding
SEED_SECRET=your-seed-secret
```

### 3. Database Setup

```bash
# Start MongoDB (if using Docker)
docker-compose up -d

# Or start local MongoDB service
mongod
```

### 4. Seed Database

```bash
# Start development server
pnpm dev

# Visit seeding endpoint (replace 'your-seed-secret' with your SEED_SECRET)
curl "http://localhost:3000/api/seed?secret=your-seed-secret"
```

### 5. Access the Application

- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Default Admin**: admin@hometrace.com / H0metrace

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── properties/        # Property pages
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── AppointmentCalendar.tsx
├── lib/                   # Utilities and configurations
├── models/               # MongoDB schemas
└── scripts/              # Database seeding
```

## 🎮 Usage Guide

### For Customers

1. Browse properties with advanced search filters
2. View detailed property information and image galleries
3. Book appointments by selecting up to 3 preferred times
4. Receive email confirmations when agents schedule appointments

### For Agents

1. Log in to admin panel to manage your properties
2. View and respond to appointment requests
3. Use calendar view to schedule and manage appointments
4. Create and edit property listings

### For Administrators

1. Full access to all system features
2. Manage users, properties, and appointments
3. Configure system settings
4. View dashboard analytics

## 🔧 Development

### Available Scripts

```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Key Development Features

- **Hot Reload**: Turbopack for fast development
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint + Prettier configuration
- **Component Library**: shadcn/ui for consistent design

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hometrace
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
SMTP_FROM=noreply@your-domain.com
SEED_SECRET=your-production-seed-secret
```

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## ⚠️ Known Limitations & Incomplete Features

### 🔧 **Admin Settings Page**

- **Status**: UI Complete, Backend Incomplete
- **Description**: Settings page has full UI but lacks backend implementation
- **Missing**: SMTP configuration, security settings, system maintenance functions
- **Location**: `/admin/settings`

### 👤 **User Profile Management**

- **Status**: Partially Implemented
- **Description**: Basic user creation exists but lacks profile editing
- **Missing**: Password reset, profile picture upload, user preferences
- **Location**: User management in admin panel

### 📧 **Email Verification**

- **Status**: Not Implemented
- **Description**: Email verification toggle exists in settings but not functional
- **Missing**: Email verification workflow, verification templates

### 🔐 **Advanced Security Features**

- **Status**: Basic Implementation
- **Description**: Basic authentication works but lacks advanced security
- **Missing**: Two-factor authentication, session management, audit logs

### 📊 **Dashboard Analytics**

- **Status**: UI Placeholder
- **Description**: Dashboard shows basic stats but lacks comprehensive analytics
- **Missing**: Property performance metrics, appointment analytics, revenue tracking

### 🔍 **Advanced Search Features**

- **Status**: Basic Implementation
- **Description**: Location-based search works but could be enhanced
- **Missing**: Saved searches, search alerts, map integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Review the code comments for implementation details

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Next.js** team for the amazing framework
- **Vercel** for seamless deployment platform
- **MongoDB** for the flexible database solution
