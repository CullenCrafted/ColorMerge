# ColorMerge - Premium Mobile Game Application

## Overview

This is a comprehensive multi-mode ColorMerge game application featuring 8 distinct game modes with infinite Arcade progression. Built with React, TypeScript, Express.js, and advanced game engine architecture. The application transforms the original color-mixing mechanics into a complete puzzle game ecosystem with unified gameplay controller, sophisticated animations, and diverse interactive experiences.

## Recent Changes (January 5, 2025)

**✓ Multi-Mode Game System Completed**
- Implemented 8 unique game modes: Classic, Golf Ball, Strings, Concentric, Flash Background, Tetris, Chaotic, and Zen Fade
- Created unified game engine with progressive difficulty scaling (GDI system)
- Built comprehensive game controller managing mode transitions and progression
- Developed infinite Arcade Mode cycling through all game modes with escalating complexity

**✓ Advanced Game Modes**
- **Classic Mode**: Enhanced original color mixing with improved UI
- **Golf Ball Mode**: 3D sphere with interactive dimples and rotation physics
- **Strings Mode**: Curved SVG bands with complex blending mechanics
- **Concentric Mode**: Multi-ring progressive matching system
- **Flash Background Mode**: Memory-based color recreation challenges
- **Tetris Mode**: Falling shapes with time-pressure color matching
- **Chaotic Mode**: Physics-based bouncing shapes with collision dynamics
- **Zen Fade Mode**: Meditative color transition following gameplay

**✓ Professional Menu System**
- Animated main menu with game mode previews and descriptions
- Featured games section highlighting Classic and Arcade modes
- Visual icons and gradients representing each game mode
- Seamless routing between menu and game modes

**✓ Technical Architecture**
- GameEngine class managing difficulty progression and settings generation
- Unified game controller supporting both single-mode and arcade progression
- Advanced game mode transition system with countdown animations
- Modular component architecture supporting easy game mode expansion

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
The ColorMerge multi-mode system includes:
1. **8 Unique Game Modes** - Each mode featuring distinct mechanics and visual styles
2. **Infinite Arcade Mode** - Continuous progression through all game modes with escalating difficulty
3. **Advanced Color Mixing** - Sophisticated 5-color blending system with RGB calculations
4. **Hearts System** - 3-heart life system across all game modes with contextual challenges
5. **Game Difficulty Index (GDI)** - Progressive complexity scaling affecting all game parameters
6. **Unified Controller** - Seamless transitions between modes with adaptive UI
7. **Professional Animations** - Mode-specific visual effects using Framer Motion
8. **Responsive Design** - Optimized for all devices with touch-friendly interactions

### Game Logic
- **Multi-Mode Architecture**: Unified system supporting 8 distinct game experiences
- **Game Engine**: Centralized difficulty management with Game Difficulty Index (GDI)
- **Advanced Color Mixing**: RGB color space calculations with tolerance-based matching
- **Progressive Scaling**: Dynamic parameter adjustment based on level progression
- **Mode-Specific Mechanics**: Each game mode features unique interaction patterns and objectives
- **Unified Progression**: Seamless advancement through single modes or infinite arcade sequence
- **Real-Time Physics**: Collision detection, rotation, falling objects, and smooth animations

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