# VerdantTech Solution - Agricultural Smart Platform

<div align="center">

![VerdantTech Logo](src/assets/logo.png)

**A comprehensive digital ecosystem for modern agriculture**

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.12-38B2AC.svg)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Project Structure](#-project-structure)
- [User Roles & Permissions](#-user-roles--permissions)
- [Core Modules](#-core-modules)
- [State Management](#-state-management)
- [API Integration](#-api-integration)
- [Real-time Communication](#-real-time-communication)
- [Development Guide](#-development-guide)
- [Build & Deployment](#-build--deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

**VerdantTech Solution** is an innovative agricultural technology platform that connects farmers, vendors, and agricultural service providers in a comprehensive digital ecosystem. The platform leverages AI, real-time weather data, IoT integration, and e-commerce capabilities to modernize agricultural operations and supply chain management.

### 🎯 Mission
Empower farmers and agricultural businesses with modern technology to increase productivity, sustainability, and market access.

### 🔑 Core Value Propositions
- **Smart Farm Management** with real-time weather monitoring and AI-powered recommendations
- **Agricultural Marketplace** for buying and selling farm products and equipment
- **AI Chatbot Assistant** for agricultural consultation and product recommendations
- **Supply Chain Transparency** with vendor and inventory management
- **Community Platform** for knowledge sharing through forums
- **Financial Management** with integrated wallet and payment systems

---

## ✨ Key Features

### 🌾 For Farmers
- **Farm Management System**
  - Create and manage multiple farms with geospatial mapping (Leaflet integration)
  - Real-time weather monitoring (current, hourly, and 7-day forecasts)
  - Soil moisture and temperature tracking
  - AI-powered crop suggestions based on environmental data
  - CO2 emissions tracking and environmental impact analysis

- **Smart Shopping Experience**
  - Browse agricultural products, equipment, and supplies
  - AI chatbot for product recommendations and agricultural consultation
  - Shopping cart with order preview
  - Order history and tracking
  - Product reviews and ratings

- **Community & Support**
  - Agricultural forum for knowledge sharing
  - Support ticket system
  - Real-time notifications via SignalR

### 🏪 For Vendors
- **Vendor Dashboard**
  - Product registration and management
  - Inventory tracking
  - Sales analytics and reporting
  - Registration approval workflow

- **Financial Management**
  - Integrated wallet system
  - Cashout request management
  - Bank account integration
  - Transaction history
  - Balance monitoring

### 👔 For Staff
- **Operations Management**
  - User management and verification
  - Vendor approval and management
  - Product approval workflow
  - Order processing and fulfillment
  - Inventory management across warehouses

- **Customer Support**
  - Support ticket management
  - Real-time monitoring dashboard
  - Post/forum content moderation

### 👨‍💼 For Administrators
- **Complete System Control**
  - All staff capabilities plus:
  - Analytics and reporting dashboard
  - System settings and configuration
  - Equipment and asset management
  - Financial oversight
  - User role management
  - Platform-wide monitoring

---

## 🛠️ Tech Stack

### Frontend Framework
- **React 19.1.1** - Modern UI library with latest features
- **TypeScript 5.8.3** - Type-safe development
- **Vite 7.1.2** - Lightning-fast build tool and dev server

### State Management
- **Redux Toolkit 2.10.1** - Predictable state container
- **React Redux 9.2.0** - Official React bindings for Redux
- Context API for localized state (Auth, Cart, Notifications)

### UI Framework & Styling
- **TailwindCSS 4.1.12** - Utility-first CSS framework
- **Radix UI** - Headless UI components for accessibility
  - Dialog, Dropdown, Select, Tabs, Switch, Avatar, etc.
- **Framer Motion 12.23.12** - Animation library
- **Lucide React** - Beautiful icon library
- **Recharts 2.15.4** - Composable charting library

### Routing & Navigation
- **React Router v7** - Declarative routing for React

### Form Management
- **React Hook Form 7.62.0** - Performant form handling
- **Zod 4.1.5** - TypeScript-first schema validation
- **@hookform/resolvers** - Validation resolvers

### Maps & Geospatial
- **Leaflet 1.9.4** - Interactive map library
- **React Leaflet 5.0.0** - React components for Leaflet
- **Leaflet Draw** - Drawing and editing tools

### Real-time Communication
- **@microsoft/signalr 10.0.0** - Real-time web functionality
- **Axios 1.11.0** - Promise-based HTTP client

### Authentication
- **@react-oauth/google 0.12.2** - Google OAuth integration
- JWT-based authentication

### Additional Libraries
- **Sonner 2.0.7** - Toast notifications
- **date-fns 4.1.0** - Modern date utility library
- **Embla Carousel** - Smooth carousel implementation
- **Ant Design 5.27.1** - Additional UI components
- **Cloudinary** - Image upload and optimization

### Development Tools
- **ESLint 9.33.0** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **Vite Plugin React** - Official React plugin for Vite

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│                    (React + TypeScript)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   User   │  │  Vendor  │  │  Staff   │  │  Admin   │  │
│  │Interface │  │Dashboard │  │  Panel   │  │  Panel   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Shared Components                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Maps │ Weather │ Chat │ Forms │ Tables │ Charts    │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     State Management                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐       │
│  │Redux Store│  │ Contexts │  │ Local State (Hooks)│       │
│  └──────────┘  └──────────┘  └────────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                           │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐        │
│  │ API Client │  │ SignalR Hub  │  │ AI Chatbot  │        │
│  └────────────┘  └──────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   REST   │  │ SignalR  │  │  PayOS   │  │ Weather  │  │
│  │   API    │  │   Hub    │  │ Payment  │  │   API    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The application follows a modular architecture with clear separation of concerns:

```
src/
├── pages/          # Route-level components
├── components/     # Reusable UI components
├── layouts/        # Layout wrappers
├── api/           # API service layer
├── state/         # Redux store & slices
├── contexts/      # React Context providers
├── hooks/         # Custom React hooks
├── services/      # Business logic services
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── constants/     # Application constants
└── assets/        # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 or **yarn** >= 1.22.0
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FE
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see [Environment Configuration](#-environment-configuration))

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Backend API Configuration
VITE_API_BASE_URL=https://verdanttechbe-bpbaaghrg5ggexds.southeastasia-01.azurewebsites.net

# SignalR Real-time Communication
VITE_SIGNALR_HUB_URL=https://your-backend-url/hubs/notification

# AI Chatbot Configuration
VITE_API_AI_CHATBOT=https://your-ai-webhook-url
VITE_AI_WEBHOOK_CHATBOT_URL=https://your-ai-webhook-url
VITE_AI_WEBHOOK_URL=https://your-ai-webhook-url

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Optional: Additional Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### Environment Variables Description

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend REST API base URL | Yes |
| `VITE_SIGNALR_HUB_URL` | SignalR hub endpoint for real-time notifications | Yes |
| `VITE_API_AI_CHATBOT` | AI chatbot webhook URL | Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | Yes |
| `VITE_CLOUDINARY_*` | Cloudinary configuration for image uploads | No |

---

## 📁 Project Structure

```
FE/
├── public/                    # Static public assets
│   └── vite.svg
│
├── src/
│   ├── api/                   # API service layer
│   │   ├── apiClient.ts       # Axios instance with interceptors
│   │   ├── auth.ts            # Authentication endpoints
│   │   ├── product.ts         # Product endpoints
│   │   ├── cart.ts            # Shopping cart endpoints
│   │   ├── order.ts           # Order management endpoints
│   │   ├── farm.ts            # Farm management endpoints
│   │   ├── weather.ts         # Weather data endpoints
│   │   ├── chatbot.ts         # AI chatbot integration
│   │   ├── notification.ts    # Notification endpoints
│   │   ├── wallet.ts          # Wallet & payment endpoints
│   │   ├── vendor.ts          # Vendor management endpoints
│   │   ├── forum.ts           # Forum endpoints
│   │   ├── ticket.ts          # Support ticket endpoints
│   │   └── ...                # Other API modules
│   │
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── bank/              # Bank-related components
│   │   ├── order/             # Order-related components
│   │   ├── ticket/            # Support ticket components
│   │   ├── wallet/            # Wallet components
│   │   ├── ChatAIBubble.tsx   # AI chatbot interface
│   │   ├── NotificationBell.tsx # Real-time notifications
│   │   ├── MapUserArea.tsx    # Leaflet map component
│   │   ├── FarmWeather.tsx    # Weather display
│   │   ├── ProtectedRoute.tsx # Route guards
│   │   └── ...
│   │
│   ├── pages/                 # Route-level page components
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── AdminOverviewPage.tsx
│   │   │   ├── AdminUserManagementPanel.tsx
│   │   │   ├── AdminProductManagementPanel.tsx
│   │   │   ├── AdminOrderManagementPanel.tsx
│   │   │   ├── AdminVendorManagementPanel.tsx
│   │   │   ├── AdminAnalyticsPage.tsx
│   │   │   └── ...
│   │   ├── staff/             # Staff panel pages
│   │   │   ├── ProductManagementPanel.tsx
│   │   │   ├── OrderManagementPanel.tsx
│   │   │   ├── InventoryManagementPanel.tsx
│   │   │   ├── UserManagementPanel.tsx
│   │   │   └── ...
│   │   ├── vendor/            # Vendor dashboard pages
│   │   │   ├── VendorDashboard.tsx
│   │   │   ├── RegisterProductPage.tsx
│   │   │   ├── RegistrationManagementPage.tsx
│   │   │   ├── WalletPage.tsx
│   │   │   ├── CashoutRequestManagementPage.tsx
│   │   │   └── ...
│   │   ├── HomePage.tsx       # Landing page
│   │   ├── LoginPage.tsx      # Authentication
│   │   ├── SignUpPage.tsx
│   │   ├── MarketplacePage.tsx # Product marketplace
│   │   ├── ProductDetailPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── OrderHistoryPage.tsx
│   │   ├── FarmList.tsx       # Farm management
│   │   ├── CreateFarmPage.tsx
│   │   ├── FarmDetailPage.tsx
│   │   ├── ForumPage.tsx      # Community forum
│   │   ├── ChatPage.tsx       # AI chat interface
│   │   ├── TicketPage.tsx     # Support system
│   │   └── ...
│   │
│   ├── state/                 # Redux state management
│   │   ├── store.ts           # Redux store configuration
│   │   ├── hooks.ts           # Typed Redux hooks
│   │   └── slices/
│   │       ├── authSlice.ts   # Authentication state
│   │       ├── cartSlice.ts   # Shopping cart state
│   │       └── notificationSlice.ts # Notification state
│   │
│   ├── contexts/              # React Context providers
│   │   ├── AuthContext.tsx    # Authentication context
│   │   ├── CartContext.tsx    # Shopping cart context
│   │   └── NotificationContext.tsx # Real-time notifications
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAddress.ts      # Address selection logic
│   │   ├── useAdminAuth.ts    # Admin authentication guard
│   │   ├── useStaffAuth.ts    # Staff authentication guard
│   │   ├── useVendorAuth.ts   # Vendor authentication guard
│   │   ├── useRequireAuth.ts  # General auth requirement
│   │   ├── useAuthRedirect.ts # Conditional redirects
│   │   └── useWallet.ts       # Wallet operations
│   │
│   ├── services/              # Business logic services
│   │   └── NotificationService.ts # SignalR notification service
│   │
│   ├── routes/                # Routing configuration
│   │   ├── routes.tsx         # Main route component
│   │   └── all-routes.tsx     # Route definitions
│   │
│   ├── layouts/               # Layout components
│   │   └── layout.tsx         # Main layout wrapper
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── index.ts
│   │   └── notification.types.ts
│   │
│   ├── constants/             # Application constants
│   │   └── constants.ts       # Route paths, config values
│   │
│   ├── utils/                 # Utility functions
│   │   └── parseChatProducts.ts # Chat response parser
│   │
│   ├── assets/                # Images, fonts, etc.
│   │   ├── logo.png
│   │   ├── carousel1.jpg
│   │   └── ...
│   │
│   ├── lib/                   # Library configurations
│   │   └── utils.ts           # Utility helpers
│   │
│   ├── App.tsx                # Root application component
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
│
├── .env.example               # Environment variable template
├── components.json            # shadcn/ui configuration
├── eslint.config.js           # ESLint configuration
├── index.html                 # HTML entry point
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
├── tsconfig.app.json          # App-specific TS config
├── tsconfig.node.json         # Node-specific TS config
├── vite.config.ts             # Vite configuration
├── vercel.json                # Vercel deployment config
└── README.md                  # This file
```

---

## 👥 User Roles & Permissions

### Role Hierarchy

```
┌─────────────────────────────────────────┐
│              ADMIN                      │
│  (Full system access & configuration)   │
└─────────────────┬───────────────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
┌──────▼────────┐    ┌──────▼────────┐
│     STAFF     │    │    VENDOR     │
│  (Operations) │    │   (Selling)   │
└───────────────┘    └───────────────┘
       │                     │
       └──────────┬──────────┘
                  │
         ┌────────▼─────────┐
         │      USER        │
         │   (Customer)     │
         └──────────────────┘
```

### Permission Matrix

| Feature | User | Vendor | Staff | Admin |
|---------|------|--------|-------|-------|
| Browse products | ✅ | ✅ | ✅ | ✅ |
| Purchase products | ✅ | ✅ | ✅ | ✅ |
| Manage farms | ✅ | ✅ | ✅ | ✅ |
| AI chatbot access | ✅ | ✅ | ✅ | ✅ |
| Forum participation | ✅ | ✅ | ✅ | ✅ |
| Create support tickets | ✅ | ✅ | ✅ | ✅ |
| Register as vendor | ✅ | - | - | - |
| Register products | - | ✅ | - | - |
| Manage inventory | - | ✅ | ✅ | ✅ |
| Wallet & cashouts | - | ✅ | - | ✅ |
| Approve vendors | - | - | ✅ | ✅ |
| Approve products | - | - | ✅ | ✅ |
| Process orders | - | - | ✅ | ✅ |
| Manage users | - | - | ✅ | ✅ |
| Handle support tickets | - | - | ✅ | ✅ |
| System analytics | - | - | - | ✅ |
| System configuration | - | - | - | ✅ |
| Equipment management | - | - | - | ✅ |

---

## 🧩 Core Modules

### 1. Authentication & Authorization

**Location:** `src/api/auth.ts`, `src/state/slices/authSlice.ts`, `src/contexts/AuthContext.tsx`

**Features:**
- JWT-based authentication
- Google OAuth integration
- Email verification workflow
- Password reset functionality
- Role-based access control (RBAC)
- Persistent session management
- Protected route guards

**Key Components:**
- `AuthContext` - Authentication state provider
- `ProtectedRoute` - Generic authentication guard
- `AdminProtectedRoute` - Admin-only routes
- `StaffProtectedRoute` - Staff-only routes
- `VendorProtectedRoute` - Vendor-only routes

### 2. Farm Management System

**Location:** `src/pages/CreateFarmPage.tsx`, `src/pages/FarmDetailPage.tsx`, `src/api/farm.ts`

**Features:**
- Geospatial farm creation using Leaflet maps
- Draw and define farm boundaries
- Multiple farm management per user
- Real-time weather monitoring:
  - Current conditions
  - Hourly forecasts (24 hours)
  - 7-day forecasts
  - Soil temperature and moisture
- AI-powered crop suggestions
- Environmental data tracking (CO2, humidity, UV index)
- Farm equipment inventory

**Technologies:**
- Leaflet + React Leaflet for mapping
- Leaflet Draw for boundary definition
- Open-Meteo API for weather data

### 3. E-Commerce Platform

**Location:** `src/pages/MarketplacePage.tsx`, `src/pages/CartPage.tsx`, `src/api/product.ts`

**Features:**
- Product catalog with advanced filtering
- Category-based browsing
- Product search functionality
- Product detail pages with specifications
- Shopping cart management
- Order preview and checkout
- Order history and tracking
- Product reviews and ratings
- PayOS payment integration

**State Management:**
- Redux Toolkit for cart state
- Real-time cart synchronization
- Optimistic UI updates

### 4. AI Chatbot Assistant

**Location:** `src/components/ChatAIBubble.tsx`, `src/api/chatbot.ts`

**Features:**
- Floating chat bubble interface
- Agricultural consultation
- Product recommendations with carousel display
- Conversation history
- Context-aware responses
- Session management
- Persistent chat history storage

**Integration:**
- External AI webhook (n8n workflow or similar)
- JSON-based product recommendations
- Markdown-style response formatting

### 5. Vendor Management System

**Location:** `src/pages/vendor/`, `src/api/vendor.ts`

**Features:**
- Vendor registration with approval workflow
- Product registration and management
- Inventory tracking across warehouses
- Sales dashboard with analytics
- Wallet integration for payments
- Cashout request management
- Bank account integration
- Transaction history

**Vendor Dashboard Sections:**
- Overview (sales, revenue, products)
- Product management
- Registration approvals
- Wallet & financial management
- Vendor profile settings

### 6. Admin & Staff Panels

**Location:** `src/pages/admin/`, `src/pages/staff/`

**Admin Capabilities:**
- System-wide analytics dashboard
- User management (all roles)
- Vendor approval and management
- Product approval workflow
- Order management and fulfillment
- Inventory management
- Support ticket resolution
- Forum content moderation
- Equipment and asset management
- Financial oversight (wallets, cashouts)
- System configuration

**Staff Capabilities:**
- Subset of admin features
- Focus on daily operations
- Customer support
- Order processing
- Inventory management

### 7. Real-Time Notification System

**Location:** `src/services/NotificationService.ts`, `src/contexts/NotificationContext.tsx`

**Features:**
- SignalR-based real-time notifications
- Notification bell with unread count
- Multiple notification types:
  - Order updates
  - Payment confirmations
  - Registration approvals
  - Forum mentions
  - Cashout status
  - System announcements
- Automatic reconnection
- Offline notification queuing
- Mark as read functionality

**Implementation:**
- SignalR HubConnection
- JWT authentication via query string
- Automatic reconnection with exponential backoff
- Redux state management for notification list

### 8. Community Forum

**Location:** `src/pages/ForumPage.tsx`, `src/pages/ForumDetailPage.tsx`

**Features:**
- Create and publish articles/posts
- Rich text editor for content creation
- Comment and discussion threads
- Post categorization
- Search and filtering
- User engagement (likes, shares)
- Content moderation by staff/admin

### 9. Support Ticket System

**Location:** `src/pages/TicketPage.tsx`, `src/components/ticket/`

**Features:**
- Create support tickets
- Ticket categorization
- Priority levels
- Status tracking (Open, In Progress, Resolved, Closed)
- Staff assignment
- Internal notes and comments
- Ticket history

---

## 🔄 State Management

### Redux Store Structure

```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    status: 'idle' | 'loading' | 'succeeded' | 'failed',
    initialized: boolean
  },
  cart: {
    items: CartItem[],
    count: number,
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
  },
  notifications: {
    items: Notification[],
    unreadCount: number,
    connectionState: ConnectionState
  }
}
```

### Context Providers

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Provides authentication hooks
   - Manages user session
   - Handles login/logout

2. **CartContext** (`src/contexts/CartContext.tsx`)
   - Cart synchronization
   - Auto-refresh on updates
   - Event-driven cart updates

3. **NotificationContext** (`src/contexts/NotificationContext.tsx`)
   - SignalR connection management
   - Real-time notification streaming
   - Connection state monitoring

### Custom Hooks

- `useAuth()` - Authentication utilities
- `useCart()` - Cart operations
- `useAdminAuth()` - Admin authorization check
- `useStaffAuth()` - Staff authorization check
- `useVendorAuth()` - Vendor authorization check
- `useWallet()` - Wallet operations
- `useAddress()` - Address selection logic

---

## 🌐 API Integration

### API Client Configuration

**Base Client:** `src/api/apiClient.ts`

```typescript
// Axios instance with interceptors
const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle 401 errors
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data);
  }
);
```

### API Modules

| Module | File | Purpose |
|--------|------|---------|
| Authentication | `auth.ts` | Login, register, verification, password reset |
| Products | `product.ts` | Product CRUD, search, filtering |
| Cart | `cart.ts` | Cart operations, checkout |
| Orders | `order.ts` | Order management, history |
| Farms | `farm.ts` | Farm CRUD, management |
| Weather | `weather.ts` | Current, hourly, daily weather data |
| AI Chatbot | `chatbot.ts` | Chat interactions, conversation history |
| Notifications | `notification.ts` | Fetch, mark as read |
| Wallet | `wallet.ts` | Balance, transactions, cashouts |
| Vendors | `vendor.ts` | Vendor CRUD, approvals |
| Forum | `forum.ts` | Posts, comments, interactions |
| Tickets | `ticket.ts` | Support ticket CRUD |
| Dashboard | `dashboard.ts` | Analytics and statistics |
| Inventory | `inventory.ts` | Stock management |
| PayOS | `payos.ts` | Payment processing |

---

## 📡 Real-time Communication

### SignalR Integration

**Service:** `src/services/NotificationService.ts`

**Features:**
- WebSocket-based real-time communication
- JWT authentication via `accessTokenFactory`
- Automatic reconnection with exponential backoff
- Connection state management
- Event-driven notification delivery

**Server Events:**
- `ReceiveNotification` - New notification received
- `NotificationMarkedAsRead` - Notification read status update
- `Error` - Server error messages

**Client Methods:**
- `MarkNotificationAsRead(notificationId)` - Mark notification as read
- `Ping()` - Connection health check (optional)

**Connection Flow:**
```
1. User logs in → JWT token stored
2. NotificationService initialized with token
3. SignalR connection established
4. Server validates JWT from query string
5. User added to notification group
6. Real-time notifications streamed
7. On disconnect → automatic reconnection
```

---

## 💻 Development Guide

### Available Scripts

```bash
# Development server with HMR
npm run dev

# Type-check TypeScript
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Code Style Guidelines

1. **TypeScript**
   - Use explicit types for function parameters and return values
   - Avoid `any` type; use `unknown` if necessary
   - Prefer interfaces over type aliases for object shapes

2. **Components**
   - Use functional components with hooks
   - Keep components small and focused
   - Extract reusable logic into custom hooks
   - Use TypeScript for prop types

3. **State Management**
   - Use Redux for global state (auth, cart, notifications)
   - Use Context for feature-scoped state
   - Use local state (useState) for component-specific state
   - Avoid prop drilling; use context or Redux

4. **Naming Conventions**
   - Components: PascalCase (e.g., `ProductCard.tsx`)
   - Hooks: camelCase with "use" prefix (e.g., `useAuth.ts`)
   - Utilities: camelCase (e.g., `formatDate.ts`)
   - Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

5. **File Organization**
   - Group related files in feature folders
   - Keep API calls in `src/api/` directory
   - Reusable components in `src/components/`
   - Page components in `src/pages/`

### Adding New Features

1. **Create API Service**
   ```typescript
   // src/api/myFeature.ts
   import { apiClient } from './apiClient';
   
   export const getMyData = async () => {
     return await apiClient.get('/api/MyFeature');
   };
   ```

2. **Create Redux Slice (if needed)**
   ```typescript
   // src/state/slices/myFeatureSlice.ts
   import { createSlice } from '@reduxjs/toolkit';
   
   const myFeatureSlice = createSlice({
     name: 'myFeature',
     initialState: { /* ... */ },
     reducers: { /* ... */ }
   });
   ```

3. **Create Component**
   ```typescript
   // src/components/MyFeatureComponent.tsx
   export const MyFeatureComponent = () => {
     // Component logic
   };
   ```

4. **Add Route**
   ```typescript
   // src/routes/all-routes.tsx
   {
     path: PATH_NAMES.MY_FEATURE,
     component: <MyFeaturePage />
   }
   ```

### Debugging Tips

1. **Redux DevTools**
   - Install Redux DevTools Extension
   - Monitor state changes in real-time
   - Time-travel debugging

2. **React Developer Tools**
   - Inspect component hierarchy
   - View props and state
   - Profile performance

3. **Network Monitoring**
   - Check browser Network tab for API calls
   - Verify request/response payloads
   - Monitor WebSocket connection (SignalR)

4. **Console Logging**
   - Use descriptive log prefixes: `[ComponentName]`, `[API]`, `[SignalR]`
   - Remove console logs before committing

---

## 🏗️ Build & Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# Output directory: dist/
```

### Build Optimization

The production build includes:
- ✅ Tree shaking (removes unused code)
- ✅ Code splitting (lazy loading)
- ✅ Minification (smaller bundle size)
- ✅ Asset optimization (images, fonts)
- ✅ CSS purging (removes unused styles)

### Deployment Options

#### 1. Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configuration: `vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### 2. Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 3. Azure Static Web Apps

1. Create Static Web App in Azure Portal
2. Connect to GitHub repository
3. Configure build settings:
   - App location: `/`
   - API location: `` (leave empty)
   - Output location: `dist`

#### 4. Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
  }
}
```

Build and run:

```bash
docker build -t verdanttech-frontend .
docker run -p 8080:80 verdanttech-frontend
```

### Environment Variables in Production

- Set environment variables in your hosting platform's dashboard
- Never commit `.env` file to version control
- Use different values for development, staging, and production

---

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add TypeScript types

3. **Test Locally**
   ```bash
   npm run dev
   npm run lint
   npm run build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Commit message format:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `style:` Code style (formatting)
   - `refactor:` Code refactoring
   - `test:` Tests
   - `chore:` Maintenance

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Review Guidelines

- Ensure code passes linting
- Verify TypeScript types are correct
- Test new features thoroughly
- Update documentation if needed
- Keep pull requests focused and small

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

For technical support or questions:

- **Email:** support@verdanttech.com
- **Documentation:** [Internal Wiki]
- **Issue Tracker:** [GitHub Issues]

---

## 🙏 Acknowledgments

- **React Team** - For the amazing framework
- **Vite Team** - For the blazing fast build tool
- **shadcn/ui** - For beautiful, accessible components
- **Open-Meteo** - For weather data API
- **Leaflet** - For mapping capabilities

---

<div align="center">

**Built with ❤️ for modern agriculture**

</div>
