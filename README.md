# MediMeet - Doctor Appointment Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.10.1-green)](https://www.prisma.io/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-orange)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn-ui-blueviolet)](https://ui.shadcn.com/)

A modern, full-stack telemedicine platform that connects patients with verified healthcare providers through secure video consultations. Built with Next.js 15, React 19, TypeScript and Shadcn for a seamless healthcare experience.

---

## 📋 Table of Contents

- [🌟 Features](#-features)
  - [For Patients](#for-patients)
  - [For Doctors](#for-doctors)
  - [For Administrators](#for-administrators)
- [🏗️ Architecture](#️-architecture)
  - [Tech Stack](#tech-stack)
  - [Database Schema](#database-schema)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Docker Setup](#docker-setup)
- [📁 Project Structure](#-project-structure)
- [🔧 Available Scripts](#-available-scripts)
- [🔐 Authentication & Authorization](#-authentication--authorization)
- [💳 Credit System](#-credit-system)
- [🎥 Video Consultation](#-video-consultation)
- [🎨 UI/UX Features](#-uiux-features)
- [📝 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

---

## 🌟 Features

### For Patients

- **User Registration & Profile Management** - Secure authentication with Clerk
- **Doctor Discovery** - Browse verified doctors by specialty
- **Appointment Booking** - Real-time slot availability and booking system
- **Video Consultations** - High-quality video calls powered by Vonage/TokBox
- **Credit System** - Transparent pricing with consultation credits
- **Appointment Management** - View, cancel, and track appointment history
- **Medical Documentation** - Access appointment notes and recommendations

### For Doctors

- **Professional Profile** - Create detailed profiles with specialties and experience
- **Verification System** - Submit credentials for admin verification
- **Availability Management** - Set and manage consultation time slots
- **Patient Dashboard** - View upcoming appointments and patient details
- **Video Consultation Tools** - Integrated video calling with controls
- **Appointment Notes** - Add and manage patient consultation notes
- **Earnings Tracking** - Monitor consultation credits and earnings

### For Administrators

- **Doctor Verification** - Review and approve doctor applications
- **User Management** - Oversee platform users and their roles
- **Platform Monitoring** - Track appointments and system usage

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4.0, Shadcn components
- **Authentication**: Clerk (OAuth, user management)
- **Database**: Neon PostgreSQL (cloud-hosted) with Prisma ORM
- **Video Calling**: Vonage/TokBox API
- **Payment**: Clerk Billing integration
- **Deployment**: Vercel-ready configuration

### Database Schema

- **Users**: Multi-role system (Patient, Doctor, Admin)
- **Appointments**: Scheduling and status management
- **Availability**: Doctor time slot management
- **Credit Transactions**: Financial tracking system
- **Verification**: Doctor credential verification workflow

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Neon PostgreSQL database (cloud-hosted)
- Clerk account for authentication
- Vonage account for video calling

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Santos2175/doctors-appointment-app.git
   cd doctors-appointment-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with the following variables:

   ```env
   # Database (Neon PostgreSQL)
   DATABASE_URL=your_database_url

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Vonage Video API
   NEXT_PUBLIC_VONAGE_APPLICATION_ID=your_vonage_app_id
   VONAGE_API_SECRET=your_vonage_api_secret

   # Next.js
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
   ```

4. **Database Setup (Neon PostgreSQL)**

   **Setting up Neon Database:**

   1. Create a free account at [neon.tech](https://neon.tech)
   2. Create a new project
   3. Copy the connection string from your project dashboard
   4. Update your `.env` with the Neon connection string

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma db push

   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

### Docker Setup

For containerized development and deployment:

1. **Development with Docker Compose**

   ```bash
   # Start development container
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Stop container
   docker-compose down
   ```

2. **Build and run standalone**

   ```bash
   # Build image
   docker build -t medimeet .

   # Run container
   docker run -p 3000:3000 --env-file .env.local medimeet
   ```

**Note**: This setup uses Neon PostgreSQL (cloud database). Make sure your `DATABASE_URL` in `.env` points to your Neon database instance.

---

## 📁 Project Structure

```
doctors-appointment/
├── actions/                 # Server actions for data operations
│   ├── admin.ts            # Admin-specific actions
│   ├── appointment.ts      # Appointment management
│   ├── credits.ts          # Credit system operations
│   ├── doctor.ts           # Doctor-specific actions
│   ├── onboarding.ts       # User onboarding flow
│   └── patient.ts          # Patient-specific actions
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication routes
│   ├── (main)/             # Main application routes
│   │   ├── admin/          # Admin dashboard
│   │   ├── appointments/   # Patient appointments
│   │   ├── doctor/         # Doctor dashboard
│   │   ├── doctors/        # Doctor discovery
│   │   ├── onboarding/     # User onboarding
│   │   ├── pricing/        # Pricing page
│   │   └── video-call/     # Video consultation
│   └── globals.css         # Global styles
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components (Radix UI)
│   └── *.tsx              # Custom components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── generated/          # Prisma generated types
│   ├── prisma.ts           # Database client
│   └── utils.ts            # Utility functions
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
└── types/                  # TypeScript type definitions
```

---

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

## 🔐 Authentication & Authorization

The application uses Clerk for authentication with role-based access control:

- **Patients**: Can book appointments, manage their profile, and access video calls
- **Doctors**: Can manage availability, view appointments, and conduct consultations
- **Admins**: Can verify doctors and manage platform users

Protected routes are handled through Next.js middleware with automatic redirects to sign-in.

---

## 💳 Credit System

The platform operates on a credit-based system:

- Patients start with 2 free credits
- Each consultation costs 2 credits
- Credits can be purchased through Clerk Billing
- Doctors earn credits for completed consultations
- All transactions are tracked in the database

---

## 🎥 Video Consultation

Video calls are powered by Vonage/TokBox:

- Secure, encrypted video sessions
- Screen sharing capabilities
- Audio/video controls
- Automatic session management
- Mobile-responsive interface

---

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with dark theme
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG compliant components
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Real-time feedback

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Clerk](https://clerk.com/) for authentication and user management
- [Prisma](https://www.prisma.io/) for database ORM
- [Vonage](https://www.vonage.com/) for video calling infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Shadcn](https://ui.shadcn.com/) for accessible components

---

**Built with ❤️ for better healthcare access - Santosh Gurung**
