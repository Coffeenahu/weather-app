/**
 * app.js - 앱 초기화 및 이벤트 핸들러
 * 
 * 담당: 앱 시작, 위치 감지, API 호출 조합, 이벤트 바인딩
 */

// 전역 상태 (싱글톤 패턴)
const appState = {
    currentCity: null,
    coords: { lat: null, lon: null },
    weatherData: null,
    forecastData: null,
    hourlyData: null,
    aqiData: null,
    isLoading: false
};

/**
 * 기본 위치 (권한 거부 시 fallback)
 */
const DEFAULT_LOCATION = {
    lat: 37.5665, // 서울
    lon: 126.9780,
    name: '서울특별시'
};

/**
 * 앱 초기화 (시작점)
 */
async function init() {
    console.log('🌤️ 날씨 앱 시작...');
    
    renderLoading(true);
    
    try {
        // 1. 위치 감지
        const coords = await detectLocation();
        appState.coords = coords;

        // 2. 날씨 데이터 로드
        await loadWeatherData(coords.lat, coords.lon);

        // 3. 이벤트 바인딩
        bindAllEvents();

        console.log('✅ 앱 초기화 완료');
    } catch (error) {
        console.error('❌ 앱 초기화 실패:', error);
        renderError('앱 초기화에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
}

/**
 * 위치 감지 (Geolocation API)
 * @returns {Promise<{lat, lon}>} - 좌표 또는 기본 위치
 */
async function detectLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn('⚠️ Geolocation API 미지원, 기본 위치 사용');
            resolve(DEFAULT_LOCATION);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                console.log('📍 위치 감지 성공:', coords);
                resolve(coords);
            },
            (error) => {
                console.warn('⚠️ 위치 감지 실패:', error.message, '기본 위치(서울) 사용');
                resolve(DEFAULT_LOCATION);
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 600000 // 10분 캐시
            }
        );
    });
}

/**
 * 날씨 데이터 로드 (캐시 확인 포함)
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 */
async function loadWeatherData(lat, lon) {
    renderLoading(true);
    
    try {
        // 1. 캐시 확인 (좌표가 같을 때만 사용)
        const cachedCoords = loadCache(CACHE_CONFIG.KEYS.coords);
        const coordsMatch = cachedCoords &&
            Math.abs(cachedCoords.lat - lat) < 0.01 &&
            Math.abs(cachedCoords.lon - lon) < 0.01;

        const cachedWeather = coordsMatch ? loadCache(CACHE_CONFIG.KEYS.weather) : null;
        const cachedForecast = coordsMatch ? loadCache(CACHE_CONFIG.KEYS.forecast) : null;
        const cachedAqi = coordsMatch ? loadCache(CACHE_CONFIG.KEYS.aqi) : null;

        if (cachedWeather && cachedForecast && cachedAqi) {
            console.log('💾 캐시된 데이터 사용');
            appState.weatherData = cachedWeather;
            appState.forecastData = cachedForecast;
            appState.aqiData = cachedAqi;
        } else {
            // 2. API 호출 (병렬 처리)
            const [weatherResp, forecastResp, aqiResp] = await Promise.all([
                fetchCurrentWeather(lat, lon),
                fetchForecast(lat, lon),
                fetchAirPollution(lat, lon)
            ]);

            // 3. 데이터 정규화
            appState.weatherData = normalizeWeatherData(weatherResp);
            appState.forecastData = groupForecastByDay(forecastResp.list);
            appState.hourlyData = getTodayHourly(forecastResp.list);
            appState.aqiData = normalizeAqiData(aqiResp);

            // 4. 캐시 저장
            saveCache(CACHE_CONFIG.KEYS.weather, appState.weatherData);
            saveCache(CACHE_CONFIG.KEYS.forecast, appState.forecastData);
            saveCache(CACHE_CONFIG.KEYS.aqi, appState.aqiData);

            // 5. 좌표 및 도시명 저장
            saveCache(CACHE_CONFIG.KEYS.coords, appState.coords);
            saveCache(CACHE_CONFIG.KEYS.city, appState.weatherData.city);
        }

        // 6. UI 렌더링
        renderCurrentWeather(appState.weatherData, appState.aqiData);
        renderHourly(appState.hourlyData || []);
        renderForecast(appState.forecastData);
        renderFavoriteBtn(appState.weatherData.city);
        renderFavoritesList();

        renderLoading(false);
    } catch (error) {
        console.error('❌ 날씨 데이터 로드 실패:', error);
        renderError('날씨 정보를 불러올 수 없습니다. 네트워크 연결을 확인하세요.');
    }
}

/**
 * 도시명 검색
 * @param {string} query - 검색어
 */
async function searchCity(query) {
    if (!query.trim()) {
        hideSearchResults();
        return;
    }

    try {
        // 1. 도시 검색
        const cities = await searchCities(query);
        
        if (cities.length === 0) {
            renderError(`"${query}"에 해당하는 도시를 찾을 수 없습니다.`);
            return;
        }

        // 자동 완성 결과 표시
        renderSearchResults(cities);
    } catch (error) {
        console.error('❌ 도시 검색 실패:', error);
        renderError('검색에 실패했습니다.');
    }
}

/**
 * 모든 이벤트 바인딩
 */
function bindAllEvents() {
    // 검색 버튼
    elements.searchBtn.addEventListener('click', () => {
        const query = elements.searchInput.value;
        if (query.trim()) {
            searchCity(query);
        }
    });

    // 엔터키 검색
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = elements.searchInput.value;
            searchCity(query);
        }
    });

    // 검색 입력 중 자동완성
    let searchTimeout;
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchCity(e.target.value);
        }, 300); // 300ms 디바운싱
    });

    // 즐겨찾기 버튼
    elements.favoriteBtn.addEventListener('click', () => {
        const city = {
            name: appState.weatherData.city,
            lat: appState.coords.lat,
            lon: appState.coords.lon
        };
        if (isFavorite(city.name)) {
            removeFavorite(city.name);
        } else {
            addFavorite(city);
        }
        renderFavoriteBtn(city.name);
        renderFavoritesList();
    });

    // 검색 관련 추가 이벤트
    bindSearchEvents();
}

// 앱 시작
document.addEventListener('DOMContentLoaded', init);
