// Import dinamico per evitare che Redis si connetta durante la build
// La libreria @trieb.work/nextjs-turbo-redis-cache esegue codice a livello di modulo
// che crea un singleton RedisCacheComponentsHandler che si connette a Redis
// anche se non viene usato. Usando import dinamico, evitiamo questo comportamento.
// import DefaultCacheHandler from 'next/dist/server/lib/cache-handlers/default.js';

let currCacheHandler;
let RedisStringsHandler = null; // Sarà caricato dinamicamente solo quando necessario
 
function isProductionBuild() {
    return process.env.NEXT_PHASE === 'phase-production-build';
}

async function loadRedisHandler() {
    if (!RedisStringsHandler) {
        // Import dinamico solo quando necessario (non durante la build)
        const redisModule = await import('@trieb.work/nextjs-turbo-redis-cache');
        RedisStringsHandler = redisModule.RedisStringsHandler;
    }
    return RedisStringsHandler;
}

class ChacheHandlerManager {
    nullCacheHandler = {
        get: () => Promise.resolve(undefined),
        set: () => Promise.resolve(),
        refreshTags: () => Promise.resolve(),
        getExpiration: () => Promise.resolve(0),
        updateTags: () => Promise.resolve(),
    }

    constructor() {
    }
    async ensureCacheHandler() {
        if (!currCacheHandler) {
            if (!isProductionBuild() && process.env.REDIS_URL) {
                const RedisHandler = await loadRedisHandler();
                currCacheHandler = new RedisHandler({});
            } else {
                currCacheHandler = this.nullCacheHandler;
            }
        }
        return currCacheHandler;
    }

    async get(key) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.get(key);
        }
        return undefined;
    }

    async set(key, value) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.set(key, value);
        }
        return;
    }

    async refreshTags(tags) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.refreshTags(tags);
        }
        return;
    }

    async revalidateTag(tags) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.revalidateTag(tags);
        }
        return 0;
    }

    async getExpiration(key) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.getExpiration(key);
        }
        return 0;
    }

    async updateTags(key, tags) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.updateTags(key, tags);
        }
        return;
    }
}


export default ChacheHandlerManager;
