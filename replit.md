# ColorMerge - Premium Mobile Game Application

## Overview

This is a professional, App Store-ready ColorMerge game application designed for iOS and Android deployment. Built with React, TypeScript, Express.js, and in-memory storage for optimal performance. The application features premium UI/UX with smooth animations, glassmorphism effects, and a clean, modern design focused on the original color-mixing gameplay mechanics.

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

### Game Features
The ColorMerge application includes:
1. **Premium Ad Screen** - New York Times style advertisement on app launch with countdown timer
2. **Advanced Color Mixing** - 5-color mixing system (blue, red, yellow, white, black) with target matching
3. **Hearts System** - 3-heart life system with bonus heart rewards for efficient play
4. **Progressive Difficulty** - Levels get increasingly challenging with more complex color combinations
5. **Streak Tracking** - Consecutive level completion tracking with milestone rewards
6. **Professional UI** - Glassmorphism effects, smooth animations, and responsive design

### Game Logic
- Single-focus ColorMerge implementation with enhanced visual design
- Advanced color mixing algorithm with RGB color space calculations
- Real-time color blending feedback with dynamic background adaptation
- Progressive difficulty scaling with increasing complexity
- Heart/life system with bonus heart rewards for efficient completion
- Streak tracking with milestone celebrations

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

## GitHub Preparation & Security

### Repository Setup
The project is now prepared for GitHub upload with comprehensive security measures:

#### Security Features Implemented
- `.gitignore` configured to exclude sensitive files (.env, personal data, secrets)
- Environment variable template (`.env.example`) for safe configuration sharing
- Security-focused CI/CD pipeline with secret detection
- No personal information stored in codebase
- MIT License for open-source compatibility

#### Documentation Created
- **README.md**: Comprehensive project documentation with setup instructions
- **CONTRIBUTING.md**: Guidelines for contributors
- **LICENSE**: MIT license for open-source distribution
- **Updated Instructions**: Enhanced how-to-play modal with latest game mechanics

#### Key Security Measures
1. **Environment Variables**: All sensitive data uses environment variables
2. **Secret Detection**: GitHub Actions workflow scans for accidentally committed secrets
3. **Dependency Security**: Automated security audits for npm packages
4. **Clean Codebase**: No hardcoded credentials or personal information
5. **Proper Exclusions**: `.replit` files and development-specific files excluded

#### Game Features Documented
- Progressive color mixing with 5-color system
- Black border visibility for white target backgrounds
- Smooth audio looping with fade transitions
- Haptic feedback and bubble celebrations
- Heart system with bonus rewards every 10 levels
- Enhanced visual cues and seamless border disappearing

The project is now ready for GitHub upload while maintaining complete privacy and security standards.