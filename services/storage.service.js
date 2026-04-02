export class StorageService {
    STORAGE_KEY = 'results';
    storeResult(result) {
        const results = this.fetchResult();
        results.unshift({ score: result.score, percentage: result.percentage, date: new Date().toISOString(), isPassed: result.isPassed });
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(results));
        return results;
    }

    fetchResult() {
        try {
            const rawResults = localStorage.getItem(this.STORAGE_KEY);
            if (!rawResults) {
                return [];
            }
            const results = JSON.parse(rawResults);
            return Array.isArray(results) ? results : [];
        } catch {
            return [];
        }
    }

    clear() {
        localStorage.removeItem(storageService.STORAGE_KEY);
    }
}

export const component = new StorageService();