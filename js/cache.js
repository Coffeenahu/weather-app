/**
 * cache.js - localStorage 캐싱 관리
 * 
 * 담당: 날씨 데이터 및 예보 데이터를 localStorage에 저장/불러오기
 * 캐시 유효시간: 10분
 */

const CACHE_VERSION = 'v2';

const CACHE_CONFIG = {
    TTL: 10 * 60 * 1000, // 10분 (밀리초)
    KEYS: {
        weather: `weather_data_${CACHE_VERSION}`,
        forecast: `forecast_data_${CACHE_VERSION}`,
        aqi: `aqi_data_${CACHE_VERSION}`,
        coords: `last_coords_${CACHE_VERSION}`,
        city: `last_city_${CACHE_VERSION}`
    }
};

/**
 * 캐시에 데이터 저장 (타임스탐프 함께)
 * @param {string} key - 캐시 키
 * @param {any} data - 저장할 데이터
 */
function saveCache(key, data) {
    try {
        const cacheEntry = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
        console.error('캐시 저장 실패:', error);
    }
}

/**
 * 캐시에서 데이터 불러오기 (만료 여부 확인)
 * @param {string} key - 캐시 키
 * @returns {any|null} - 유효한 캐시 데이터 또는 null
 */
function loadCache(key) {
    try {
        const cacheEntry = localStorage.getItem(key);
        if (!cacheEntry) return null;

        const { data, timestamp } = JSON.parse(cacheEntry);
        const isExpired = Date.now() - timestamp > CACHE_CONFIG.TTL;

        if (isExpired) {
            clearCacheKey(key); // 만료됨 삭제
            return null;
        }

        return data;
    } catch (error) {
        console.error('캐시 불러오기 실패:', error);
        return null;
    }
}

/**
 * 특정 캐시 키 삭제
 * @param {string} key - 캐시 키
 */
function clearCacheKey(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('캐시 삭제 실패:', error);
    }
}

/**
 * 모든 캐시 삭제
 */
function clearAllCache() {
    try {
        Object.values(CACHE_CONFIG.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.error('전체 캐시 삭제 실패:', error);
    }
}

/**
 * 캐시 유효시간 확인 (디버깅용)
 * @param {string} key - 캐시 키
 * @returns {number|null} - 남은 유효시간(분) 또는 null
 */
function getCacheRemainingTime(key) {
    try {
        const cacheEntry = localStorage.getItem(key);
        if (!cacheEntry) return null;

        const { timestamp } = JSON.parse(cacheEntry);
        const elapsed = Date.now() - timestamp;
        const remaining = CACHE_CONFIG.TTL - elapsed;

        return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
    } catch (error) {
        return null;
    }
}
