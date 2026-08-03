import { getFirestore } from 'firebase-admin/firestore';

export interface RateLimitStore {
  checkAndIncrement(key: string, type: 'analyze' | 'generate' | 'deep-scan', limit: number, windowMs: number): Promise<boolean>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private limits = new Map<string, { count: number, resetAt: number }>();

  async checkAndIncrement(key: string, type: 'analyze' | 'generate' | 'deep-scan', limit: number, windowMs: number): Promise<boolean> {
    const fullKey = `${key}:${type}`;
    const now = Date.now();
    let data = this.limits.get(fullKey);

    if (!data || now > data.resetAt) {
      data = { count: 0, resetAt: now + windowMs };
    }

    if (data.count >= limit) {
      return false;
    }

    data.count++;
    this.limits.set(fullKey, data);
    return true;
  }
}

export class FirestoreRateLimitStore implements RateLimitStore {
  async checkAndIncrement(key: string, type: 'analyze' | 'generate' | 'deep-scan', limit: number, windowMs: number): Promise<boolean> {
    const db = getFirestore();
    const docRef = db.collection('rate_limits').doc(`${key}_${type}`);
    
    try {
      return await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const now = Date.now();
        
        if (!doc.exists) {
          transaction.set(docRef, { count: 1, resetAt: now + windowMs });
          return true;
        }
        
        const data = doc.data()!;
        if (now > data.resetAt) {
          transaction.set(docRef, { count: 1, resetAt: now + windowMs });
          return true;
        }
        
        if (data.count >= limit) {
          return false;
        }
        
        transaction.update(docRef, { count: data.count + 1 });
        return true;
      });
    } catch (e) {
      console.error("Firestore rate limit error, falling back to allow:", e);
      // Fail open if Firestore is unreachable to prevent blocking users due to infrastructure issues
      return true;
    }
  }
}

// Export a singleton instance based on environment
export const rateLimitStore = process.env.NODE_ENV === 'test' 
  ? new MemoryRateLimitStore() 
  : new FirestoreRateLimitStore();
