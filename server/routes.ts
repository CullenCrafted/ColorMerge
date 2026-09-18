import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameStatsSchema, insertSubscriptionSchema } from "@shared/schema";
import { z } from "zod";
import { gameHandler } from './secure/handler';

export async function registerRoutes(app: Express): Promise<Server> {
  app.all('/api/game', gameHandler);
  // Retire the demo stats API: it accepted arbitrary scores and shared user 1.
  app.all('/api/stats/:gameType', (_req, res) => {
    res.status(410).json({ message: 'Use the verified game session API.' });
  });
  
  // Get game stats for a user
  app.get("/api/stats/:gameType", async (req, res) => {
    try {
      // For demo purposes, using a mock user ID
      const userId = 1;
      const { gameType } = req.params;
      
      let stats = await storage.getGameStats(userId, gameType);
      
      // Create default stats if none exist
      if (!stats) {
        stats = await storage.createGameStats({
          userId,
          gameType,
          currentLevel: 1,
          bestLevel: 1,
          currentScore: 0,
          bestScore: 0,
          hearts: 3,
          streak: 0,
          totalPlays: 0,
          successRate: 0,
          gameState: null
        });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get game stats" });
    }
  });

  // Update game stats
  app.put("/api/stats/:gameType", async (req, res) => {
    try {
      const userId = 1;
      const { gameType } = req.params;
      
      let stats = await storage.getGameStats(userId, gameType);
      
      if (!stats) {
        // Create new stats
        const validatedData = insertGameStatsSchema.parse({
          ...req.body,
          userId,
          gameType
        });
        stats = await storage.createGameStats(validatedData);
      } else {
        // Update existing stats
        const updated = await storage.updateGameStats(stats.id, req.body);
        stats = updated || stats;
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to update game stats" });
    }
  });

  // Get daily challenges
  app.get("/api/challenges/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const challenges = await storage.getDailyChallenges(date);
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get daily challenges" });
    }
  });

  // Get user challenges
  app.get("/api/user-challenges/:date", async (req, res) => {
    try {
      const userId = 1;
      const { date } = req.params;
      const challenges = await storage.getUserChallenges(userId, date);
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user challenges" });
    }
  });

  // Subscribe to daily challenges
  app.post("/api/subscribe", async (req, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);
      
      // Check if already subscribed
      const existing = await storage.getSubscription(validatedData.email);
      if (existing) {
        return res.status(409).json({ message: "Email already subscribed" });
      }
      
      const subscription = await storage.createSubscription(validatedData);
      res.json({ message: "Successfully subscribed", subscription });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
