import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

/**
 * Service for interacting with the cache system (wrapper around NestJS CacheManager).
 */
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async setCache(key: string, val: any, ttl: number) {
    await this.cacheManager.set(`${key}`, val, ttl * 1000);
    return val;
  }

  async getCache<T>(key: string): Promise<T> {
    const val = (await this.cacheManager.get(`${key}`)) as T;
    return val;
  }

  async deleteCache(key: string) {
    await this.cacheManager.del(`:${key}`);
  }

  /**
   * Add a key from the cache.
   *
   * @param pattern - Cache pattern to be deleted.
   * @param ttl     - Time to live in seconds. (must be longer than cache key is all)
   */
  async addToKeyList(pattern: string, key: string, ttl: number): Promise<void> {
    //
    const allKeys = (await this.cacheManager.get<string[]>(`${pattern}:allKeys`)) || [];

    //
    if (!allKeys.includes(key)) {
      allKeys.push(key);

      //
      await this.cacheManager.set(`${pattern}:allKeys`, allKeys, ttl * 1000);
    }
  }

  /**
   * Delete a key from the cache.
   *
   * @param pattern - Cache pattern to be deleted.
   */
  async deleteCacheByPattern(pattern: string): Promise<void> {
    const allKeys = (await this.cacheManager.get<string[]>(`${pattern}:allKeys`)) || [];

    //
    for (const key of allKeys) {
      await this.cacheManager.del(key);
    }

    //
    await this.cacheManager.del(`${pattern}:allKeys`);
  }
}
