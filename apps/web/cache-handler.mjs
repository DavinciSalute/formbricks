// Import dinamico per evitare che Redis si connetta durante la build
// La libreria @trieb.work/nextjs-turbo-redis-cache esegue codice a livello di modulo
// che crea un singleton RedisCacheComponentsHandler che si connette a Redis
// anche se non viene usato.

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

    async get(...args) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.get(...args);
        }
        return undefined;
    }

    async set(...args) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.set(...args);
        }
        return;
    }

    async refreshTags(...args) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.refreshTags(...args);
        }
        return;
    }

    async revalidateTag(...args) {
        console.log('ChacheHandlerManager revalidateTag called with args: '+ JSON.stringify(args));
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.revalidateTag(...args);
        }
        return 0;
    }

    async getExpiration(...args) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.getExpiration(...args);
        }
        return 0;
    }

    async updateTags(...args) {
        const handler = await this.ensureCacheHandler();
        if (handler) {
            return handler.updateTags(...args);
        }
        return;
    }
}


export default ChacheHandlerManager;
