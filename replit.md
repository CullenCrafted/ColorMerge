# Game Hub Application

## Overview

This is a multi-game web application featuring five different puzzle/word games. Built with a modern stack using React, TypeScript, Express.js, and PostgreSQL with Drizzle ORM. The application serves as a game hub where users can play various games, track their statistics, and engage with daily challenges.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## System Architecture

The application follows a full-stack architecture with clear separation between client and server:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: Connect-pg-simple for PostgreSQL-based sessions
- **Development**: tsx for TypeScript execution in development

## Key Components

### Games
The application includes five distinct games:
1. **ColorMerge** - Color mixing puzzle game with target matching
2. **Connect Lines** - Dot connection game to form words and images
3. **Stretch Words** - Text manipulation puzzle with distorted words
4. **Word Scramble** - Letter unscrambling game
5. **Letter Path** - Grid-based word finding game

### Game Logic
- Each game has its own dedicated page and logic implementation
- Shared game utilities for level generation and scoring
- Real-time stats tracking and persistence
- Progressive difficulty scaling
- Heart/life system with bonus mechanics

### Database Schema
- **Users**: Basic user authentication and identification
- **Game Stats**: Per-game statistics tracking (levels, scores, hearts, streaks)
- **Daily Challenges**: Time-based challenge system
- **User Challenges**: Individual challenge completion tracking
- **Subscriptions**: Email subscription management for daily challenges

### UI Components
- Modular component system using Radix UI primitives
- Consistent design system with game-specific theming
- Responsive design with mobile-first approach
- Accessibility features built into component library
- Toast notifications for user feedback

## Data Flow

### Game State Management
1. Game stats are fetched from the API on component mount
2. Local game state is managed within individual game components
3. Stats updates are sent to the server via React Query mutations
4. Optimistic updates provide immediate UI feedback

### API Communication
- RESTful API design with Express.js routes
- JSON-based data exchange
- Error handling with appropriate HTTP status codes
- Request/response logging for development

### Database Operations
- Drizzle ORM provides type-safe database queries
- Connection pooling via Neon serverless PostgreSQL
- Migration system for schema management
- Default data creation for new users

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migration tools
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React routing
- **@radix-ui/***: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **zod**: Runtime type validation
- **react-hook-form**: Form state management

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **typescript**: Type checking and compilation
- **@replit/***: Replit-specific development tools

## Deployment Strategy

### Development
- Vite development server for frontend with HMR
- tsx for running TypeScript server code directly
- Environment variable configuration
- Database migrations via Drizzle Kit

### Production Build
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: esbuild compiles server code to `dist/index.js`
- Single-artifact deployment with static asset serving
- Environment-based configuration

### Database
- PostgreSQL database with connection string configuration
- Drizzle migrations for schema management
- Serverless-compatible with Neon database
- Connection pooling for production scalability

The application is designed to be deployed on platforms like Replit, Vercel, or similar services that support Node.js applications with PostgreSQL databases.