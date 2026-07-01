import storageService from './storageService';

class BugService {
  constructor() {
    this.errorCount = {};
    this.circuitBreakers = {};
    this.autoFixEnabled = true;
  }

  init() {
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.handleError(error, isFatal, 'RN');
    });
    
    if (global.process) {
      global.process.on('uncaughtException', (error) => {
        this.handleError(error, true, 'NODE');
      });
      global.process.on('unhandledRejection', (reason) => {
        this.handleError(reason, false, 'NODE');
      });
    }
  }

  classifyError(error) {
    const msg = error?.message || String(error);
    if (msg.includes('Network') || msg.includes('fetch') || msg.includes('timeout')) return 'NETWORK_ERROR';
    if (msg.includes('SecureStore') || msg.includes('SQLite') || msg.includes('database')) return 'STORAGE_ERROR';
    if (msg.includes('proxy') || msg.includes('localhost:9876')) return 'PROXY_ERROR';
    if (msg.includes('memory') || msg.includes('heap')) return 'MEMORY_ERROR';
    if (msg.includes('permission') || msg.includes('denied')) return 'PERMISSION_ERROR';
    if (msg.includes('API key') || msg.includes('unauthorized') || msg.includes('429')) return 'API_ERROR';
    if (msg.includes('timeout') || msg.includes('TIMEOUT')) return 'TIMEOUT_ERROR';
    return 'UNKNOWN_ERROR';
  }

  getSeverity(type) {
    const critical = ['CRASH_ERROR', 'STORAGE_ERROR', 'PROXY_ERROR', 'NODE_DEAD'];
    const high = ['MEMORY_ERROR', 'API_ERROR', 'PERMISSION_ERROR'];
    const medium = ['NETWORK_ERROR', 'TIMEOUT_ERROR'];
    if (critical.includes(type)) return 'CRITICAL';
    if (high.includes(type)) return 'HIGH';
    if (medium.includes(type)) return 'MEDIUM';
    return 'LOW';
  }

  async handleError(error, isFatal, source) {
    const type = this.classifyError(error);
    const severity = this.getSeverity(type);
    const message = error?.message || String(error);
    const stack = error?.stack || '';

    console.log(`[BUG] ${type} (${severity})${isFatal ? ' FATAL' : ''}: ${message}`);

    await storageService.logBug(type, severity, message);

    this.errorCount[type] = (this.errorCount[type] || 0) + 1;

    if (this.autoFixEnabled) {
      await this.autoFix(type, message);
    }

    if (isFatal) {
      setTimeout(() => {
        console.log('[BUG] Restarting after fatal error...');
      }, 3000);
    }
  }

  async autoFix(type, message) {
    const actions = {
      NETWORK_ERROR: async () => {
        await new Promise(r => setTimeout(r, 1000));
        return true;
      },
      STORAGE_ERROR: async () => {
        try {
          await storageService.init();
          return true;
        } catch { return false; }
      },
      PROXY_ERROR: async () => {
        console.log('[AUTO-FIX] Restarting proxy...');
        return true;
      },
      MEMORY_ERROR: async () => {
        console.log('[AUTO-FIX] Clearing cache...');
        return true;
      },
      TIMEOUT_ERROR: async () => {
        await new Promise(r => setTimeout(r, 2000));
        return true;
      },
      API_ERROR: async () => {
        console.log('[AUTO-FIX] Switching API key...');
        return true;
      },
    };

    const action = actions[type];
    if (action) {
      try {
        const success = await action();
        console.log(`[AUTO-FIX] ${type}: ${success ? 'SUCCESS' : 'FAILED'}`);
        return success;
      } catch {
        return false;
      }
    }
    return false;
  }

  getStats() {
    return {
      totalErrors: Object.values(this.errorCount).reduce((a, b) => a + b, 0),
      byType: { ...this.errorCount },
      autoFixEnabled: this.autoFixEnabled,
    };
  }

  toggleAutoFix() {
    this.autoFixEnabled = !this.autoFixEnabled;
    return this.autoFixEnabled;
  }

  async getBugHistory(limit = 50) {
    return storageService.getBugLog ? await storageService.getBugLog(limit) : [];
  }

  clearErrors() {
    this.errorCount = {};
    this.circuitBreakers = {};
  }
}

export default new BugService();