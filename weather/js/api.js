/**
 * api.js - OpenWeatherMap API 호출 모듈
 * 
 * 담당: Weather API, Forecast API, Air Pollution API 호출
 * API_KEY는 환경변수에서 로드하거나 웹팩 플러그인으로 주입
 */

// API 키는 js/config.js에서 관리 (gitignore 처리됨)
const API_KEY = CONFIG.WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const LANG = 'kr';
const UNITS = 'metric';

/**
 * 현재 좌표 기반 날씨 조회
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @returns {Promise<Object>} - 현재 날씨 데이터
 */
async function fetchCurrentWeather(lat, lon) {
    try {
        const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${UNITS}&lang=${LANG}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('현재 날씨 조회 실패:', error);
        throw error;
    }
}


/**
 * 5일 예보 조회 (3시간 단위)
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @returns {Promise<Object>} - 예보 데이터 (list 배열 포함)
 */
async function fetchForecast(lat, lon) {
    try {
        const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${UNITS}&lang=${LANG}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('예보 조회 실패:', error);
        throw error;
    }
}

/**
 * 공기질 지수 조회
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @returns {Promise<Object>} - AQI 데이터 (list 배열 포함, index 0이 현재)
 */
async function fetchAirPollution(lat, lon) {
    try {
        const url = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('공기질 조회 실패:', error);
        throw error;
    }
}

/**
 * 도시명 검색 자동완성 (Geocoding API 활용)
 * @param {string} query - 검색어
 * @returns {Promise<Array>} - 도시 목록 [{name, lat, lon, country}, ...]
 */
async function searchCities(query) {
    try {
        if (query.length < 2) return [];

        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status}`);
        }

        const data = await response.json();

        return data.map(city => ({
            name: city.local_names?.ko || city.name,
            lat: city.lat,
            lon: city.lon,
            country: city.country
        }));
    } catch (error) {
        console.error('도시 검색 실패:', error);
        return []; // 에러 시 빈 배열 반환
    }
}

