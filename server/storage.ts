import { 
  users, gameStats, dailyChallenges, userChallenges, subscriptions,
  type User, type InsertUser, type GameStats, type InsertGameStats,
  type DailyChallenge, type InsertDailyChallenge, type UserChallenge, 
  type InsertUserChallenge, type Subscription, type InsertSubscription
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game Stats
  getGameStats(userId: number, gameType: string): Promise<GameStats | undefined>;
  createGameStats(stats: InsertGameStats): Promise<GameStats>;
  updateGameStats(id: number, stats: Partial<GameStats>): Promise<GameStats | undefined>;
  
  // Daily Challenges
  getDailyChallenges(date: string): Promise<DailyChallenge[]>;
  createDailyChallenge(challenge: InsertDailyChallenge): Promise<DailyChallenge>;
  
  // User Challenges
  getUserChallenges(userId: number, date?: string): Promise<UserChallenge[]>;
  createUserChallenge(challenge: InsertUserChallenge): Promise<UserChallenge>;
  updateUserChallenge(id: number, challenge: Partial<UserChallenge>): Promise<UserChallenge | undefined>;
  
  // Subscriptions
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(email: string): Promise<Subscription | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameStats: Map<number, GameStats>;
  private dailyChallenges: Map<number, DailyChallenge>;
  private userChallenges: Map<number, UserChallenge>;
  private subscriptions: Map<number, Subscription>;
  private currentUserId: number;
  private currentGameStatsId: number;
  private currentDailyChallengeId: number;
  private currentUserChallengeId: number;
  private currentSubscriptionId: number;

  constructor() {
    this.users = new Map();
    this.gameStats = new Map();
    this.dailyChallenges = new Map();
    this.userChallenges = new Map();
    this.subscriptions = new Map();
    this.currentUserId = 1;
    this.currentGameStatsId = 1;
    this.currentDailyChallengeId = 1;
    this.currentUserChallengeId = 1;
    this.currentSubscriptionId = 1;
    
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create daily challenges for today
    const today = new Date().toISOString().split('T')[0];
    const gameTypes = ['colormerge', 'connectlines', 'stretchwords', 'wordscramble', 'letterpath'];
    
    gameTypes.forEach((gameType, index) => {
      this.createDailyChallenge({
        date: today,
        gameType,
        challengeData: { difficulty: 'medium', targetScore: 1000 * (index + 1) },
        description: `Complete ${gameType} with a score of ${1000 * (index + 1)} or higher`
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getGameStats(userId: number, gameType: string): Promise<GameStats | undefined> {
    return Array.from(this.gameStats.values()).find(
      stats => stats.userId === userId && stats.gameType === gameType
    );
  }

  async createGameStats(insertStats: InsertGameStats): Promise<GameStats> {
    const id = this.currentGameStatsId++;
    const stats: GameStats = { 
      ...insertStats, 
      id, 
      lastPlayed: new Date() 
    };
    this.gameStats.set(id, stats);
    return stats;
  }

  async updateGameStats(id: number, updateStats: Partial<GameStats>): Promise<GameStats | undefined> {
    const existing = this.gameStats.get(id);
    if (existing) {
      const updated = { ...existing, ...updateStats, lastPlayed: new Date() };
      this.gameStats.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getDailyChallenges(date: string): Promise<DailyChallenge[]> {
    return Array.from(this.dailyChallenges.values()).filter(
      challenge => challenge.date === date
    );
  }

  async createDailyChallenge(insertChallenge: InsertDailyChallenge): Promise<DailyChallenge> {
    const id = this.currentDailyChallengeId++;
    const challenge: DailyChallenge = { ...insertChallenge, id };
    this.dailyChallenges.set(id, challenge);
    return challenge;
  }

  async getUserChallenges(userId: number, date?: string): Promise<UserChallenge[]> {
    const userChallenges = Array.from(this.userChallenges.values()).filter(
      challenge => challenge.userId === userId
    );
    
    if (date) {
      // Filter by date by checking the associated daily challenge
      return userChallenges.filter(userChallenge => {
        const dailyChallenge = this.dailyChallenges.get(userChallenge.challengeId!);
        return dailyChallenge?.date === date;
      });
    }
    
    return userChallenges;
  }

  async createUserChallenge(insertChallenge: InsertUserChallenge): Promise<UserChallenge> {
    const id = this.currentUserChallengeId++;
    const challenge: UserChallenge = { ...insertChallenge, id, completedAt: null };
    this.userChallenges.set(id, challenge);
    return challenge;
  }

  async updateUserChallenge(id: number, updateChallenge: Partial<UserChallenge>): Promise<UserChallenge | undefined> {
    const existing = this.userChallenges.get(id);
    if (existing) {
      const updated = { 
        ...existing, 
        ...updateChallenge,
        completedAt: updateChallenge.completed ? new Date() : existing.completedAt
      };
      this.userChallenges.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const subscription: Subscription = { 
      ...insertSubscription, 
      id, 
      subscribedAt: new Date() 
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async getSubscription(email: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      subscription => subscription.email === email
    );
  }
}

export const storage = new MemStorage();
