/**
 * Lazy import wrapper — loads modules on demand with loading state tracking
 */

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

interface LazyModule<T> {
  get: () => Promise<T>;
  state: LoadState;
}

const cache = new Map<string, { module: any; state: LoadState }>();

export function lazyImport<T>(key: string, loader: () => Promise<T>): LazyModule<T> {
  const entry = cache.get(key) ?? { module: null, state: 'idle' as LoadState };
  if (!cache.has(key)) cache.set(key, entry);

  return {
    get state() { return entry.state; },
    async get() {
      if (entry.state === 'loaded') return entry.module as T;
      if (entry.state === 'loading') {
        // Wait for in-flight load
        while (entry.state === 'loading') {
          await new Promise(r => setTimeout(r, 50));
        }
        if (entry.state === 'loaded') return entry.module as T;
        throw new Error(`Failed to load module: ${key}`);
      }

      entry.state = 'loading';
      try {
        entry.module = await loader();
        entry.state = 'loaded';
        return entry.module as T;
      } catch (err) {
        entry.state = 'error';
        throw err;
      }
    },
  };
}
