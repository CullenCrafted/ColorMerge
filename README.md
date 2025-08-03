# ColorMerge - Premium Color Mixing Game

A sophisticated color mixing puzzle game built with React, TypeScript, and modern web technologies. Challenge yourself to create the perfect color combinations through progressive difficulty levels.

## ✨ Features

- **Progressive Color Mixing**: 5-color system (red, yellow, blue, white, black) with advanced blending
- **Dynamic Gameplay**: Fill-from-bottom circle visualization with real-time color updates
- **Smart Visual Cues**: Black outlines for white targets, seamless border disappearing on success
- **Enhanced Audio**: Smooth looping background music with fade transitions
- **Haptic Feedback**: Multi-burst vibration patterns for tactile engagement
- **Hearts System**: Strategic life management with bonus hearts every 10 levels
- **Bubble Celebrations**: Explosive visual feedback for successful matches
- **Responsive Design**: Mobile-first approach with touch-optimized controls

## 🎮 How to Play

1. **Objective**: Mix colors to match the target background color exactly
2. **Controls**: Tap the 5 color buttons to fill the center circle progressively
3. **Progression**: Each level requires more color clicks, creating complex combinations
4. **Strategy**: Blue + Yellow automatically creates Green for advanced mixing
5. **Lives**: Start with 3 hearts, lose only when completely out of attempts

## 🛠 Technical Stack

### Frontend
- **React 18** with TypeScript for robust component architecture
- **Wouter** for lightweight client-side routing
- **TanStack Query** for efficient server state management
- **Tailwind CSS** for responsive styling and animations
- **Radix UI** with shadcn/ui for accessible component primitives

### Backend
- **Express.js** with TypeScript for API endpoints
- **PostgreSQL** with Drizzle ORM for data persistence
- **Serverless-compatible** architecture

### Build Tools
- **Vite** for fast development and optimized production builds
- **ESBuild** for efficient TypeScript compilation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/colormerge-game.git
cd colormerge-game
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database connection details
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

The game will be available at `http://localhost:5000`

## 🏗 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Game screens and routes
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Game logic and utilities
│   │   └── assets/        # Static assets (audio, images)
├── server/                # Backend Express application
│   ├── routes.ts          # API route definitions
│   └── storage.ts         # Data access layer
├── shared/                # Shared TypeScript schemas
└── drizzle/              # Database migrations
```

## 🎯 Game Mechanics

### Color Mixing Algorithm
- **Additive Mixing**: Colors blend using RGB averaging
- **Special Rules**: Blue + Yellow automatically converts to Green
- **Progressive Difficulty**: Levels increase required color combinations

### Visual Design
- **Glassmorphism Effects**: Modern translucent UI elements
- **Dynamic Backgrounds**: Color-matched environments
- **Smooth Animations**: 60fps transitions and celebrations

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open database management UI

### Code Quality
- TypeScript for type safety
- ESLint for code consistency
- Automated testing with Vitest

## 📱 Mobile Optimization

- Touch-friendly button sizing
- Haptic feedback integration
- Progressive Web App (PWA) ready
- Responsive design for all screen sizes

## 🎵 Audio Features

- Background music with seamless looping
- Fade-out transitions before track restart
- Page visibility detection (pauses when tab inactive)
- Volume controls integrated with game UI

## 🏆 Achievements & Progression

- Level-based difficulty scaling
- Heart bonus system every 10 levels
- Game over modal with statistics
- Progress tracking and persistence

## 🔒 Security

- Environment variables for sensitive data
- No personal information stored in repository
- Secure database connection handling
- Input validation and sanitization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For questions or support, please open an issue on GitHub.

---

Built with ❤️ using modern web technologies