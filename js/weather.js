/**
 * weather.js - 날씨 데이터 처리 및 비즈니스 로직
 *
 * 담당: API 응답 데이터 가공, 단위 변환, 날짜 포맷팅, AQI 등급 변환
 */

// ── 즐겨찾기 ──────────────────────────────────────
const FAVORITES_KEY = 'favorites';
const FAVORITES_MAX = 5;

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch { return []; }
}

function saveFavorites(list) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function addFavorite(city) {
    const list = getFavorites();
    if (list.find(f => f.name === city.name)) return;
    if (list.length >= FAVORITES_MAX) list.pop();
    list.unshift(city);
    saveFavorites(list);
}

function removeFavorite(cityName) {
    saveFavorites(getFavorites().filter(f => f.name !== cityName));
}

function isFavorite(cityName) {
    return getFavorites().some(f => f.name === cityName);
}

// ── 시간별 예보 ───────────────────────────────────
function getTodayHourly(forecastList) {
    const today = new Date().toISOString().split('T')[0];
    return forecastList
        .filter(item => item.dt_txt.startsWith(today))
        .map(item => ({
            time: item.dt_txt.split(' ')[1].slice(0, 5),
            icon: item.weather[0]?.icon || '04d',
            temp: Math.round(item.main.temp),
            description: cleanWeatherDesc(item.weather[0]?.description || '')
        }));
}

const WEATHER_ICON_EMOJI = {
    '01d': '☀️', '01n': '🌙',
    '02d': '🌤️', '02n': '🌤️',
    '03d': '⛅', '03n': '⛅',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
};

function getWeatherEmoji(iconCode) {
    const dayCode = iconCode.replace('n', 'd');
    return WEATHER_ICON_EMOJI[dayCode] || WEATHER_ICON_EMOJI[iconCode] || '🌡️';
}

const WEATHER_DESC_MAP = {
    '온흐림': '흐림',
    '튼구름': '구름 많음',
    '약간의 구름이 있는 맑은 하늘': '대체로 맑음',
    '실 비': '가랑비',
    '엷은 안개': '안개',
    '박무': '연무',
};

function cleanWeatherDesc(desc) {
    return WEATHER_DESC_MAP[desc] || desc;
}

/**
 * 3시간 단위 예보를 일별로 그룹핑
 * @param {Array} forecastList - 3시간 단위 예보 리스트
 * @returns {Array} - 일별 예보 데이터 [{date, icon, description, tempMax, tempMin}, ...]
 */
function groupForecastByDay(forecastList) {
    const dailyData = {};

    forecastList.forEach(item => {
        const date = item.dt_txt.split(' ')[0];

        if (!dailyData[date]) {
            dailyData[date] = {
                date: date,
                icon: item.weather[0]?.icon || '04d',
                description: cleanWeatherDesc(item.weather[0]?.description || '정보 없음'),
                tempMax: Math.round(item.main.temp),
                tempMin: Math.round(item.main.temp),
                temps: []
            };
        }

        // 하루의 모든 슬롯 온도 수집
        dailyData[date].temps.push(item.main.temp);

        // 정오 데이터로 대표 아이콘/설명 갱신
        if (item.dt_txt.includes('12:00')) {
            dailyData[date].icon = item.weather[0]?.icon || '04d';
            dailyData[date].description = cleanWeatherDesc(item.weather[0]?.description || '정보 없음');
        }
    });

    // 하루 전체 슬롯에서 진짜 최고/최저 계산
    Object.values(dailyData).forEach(day => {
        day.tempMax = Math.round(Math.max(...day.temps));
        day.tempMin = Math.round(Math.min(...day.temps));
        delete day.temps;
    });

    return Object.values(dailyData)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
}

/**
 * AQI 숫자를 등급 문자열로 변환
 * @param {number} aqiValue - AQI 값 (1-5)
 * @returns {string} - 한글 등급 ("좋음", "보통", "나쁨", "매우나쁨", "위험")
 */
function getAqiLabel(aqiValue) {
    const labels = {
        1: '좋음',
        2: '보통',
        3: '나쁨',
        4: '매우나쁨',
        5: '위험'
    };
    return labels[aqiValue] || '정보 없음';
}

/**
 * AQI 값에 따른 색상 코드 반환
 * @param {number} aqiValue - AQI 값 (1-5)
 * @returns {string} - 색상 코드 (hex)
 */
function getAqiColor(aqiValue) {
    const colors = {
        1: '#4CAF50', // 좋음 - 초록색
        2: '#8BC34A', // 보통 - 연둑색
        3: '#FF9800', // 나쁨 - 주황색
        4: '#F44336', // 매우나쁨 - 빨간색
        5: '#9C27B0'  // 위험 - 자주색
    };
    return colors[aqiValue] || '#999999';
}


/**
 * 날짜 포맷팅
 * @param {string} dtTxt - "2026-03-06" 또는 "2026-03-06 12:00:00" 형식
 * @param {string} format - 출력 포맷 ('day', 'date', 'full')
 * @returns {string} - 포맷된 날짜 ("오늘", "내일", "2026-03-06" 등)
 */
function formatDate(dtTxt, format = 'day') {
    const date = new Date(dtTxt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (format === 'day') {
        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '내일';
        if (diffDays === 2) return '모레';
        return `${diffDays}일 후`;
    } else if (format === 'dayOfWeek') {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        return days[date.getDay()] + '요일';
    } else if (format === 'date') {
        return date.toISOString().split('T')[0]; // "2026-03-06"
    }

    // format === 'full': "2026년 3월 6일 (토)"
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${date.getFullYear()}년 ${month}월 ${day}일 (${dayOfWeek})`;
}


/**
 * 현재 날씨 데이터 정규화/전처리
 * @param {Object} weatherData - API 응답 데이터
 * @returns {Object} - 정규화된 날씨 데이터
 */
function normalizeWeatherData(weatherData) {
    return {
        city: `${weatherData.name}${weatherData.sys?.country ? ' (' + weatherData.sys.country + ')' : ''}`,
        coords: {
            lat: weatherData.coord.lat,
            lon: weatherData.coord.lon
        },
        temp: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        tempMin: Math.round(weatherData.main.temp_min),
        tempMax: Math.round(weatherData.main.temp_max),
        humidity: weatherData.main.humidity,
        windSpeed: Math.round(weatherData.wind.speed * 10) / 10,
        description: cleanWeatherDesc(weatherData.weather[0]?.description || '정보 없음'),
        icon: weatherData.weather[0]?.icon || '04d'
    };
}

/**
 * AQI 데이터 정규화
 * @param {Object} aqiData - API 응답 데이터
 * @returns {Object} - 정규화된 AQI 데이터
 */
function normalizeAqiData(aqiData) {
    const current = aqiData.list[0];
    return {
        aqi: current.main.aqi,
        label: getAqiLabel(current.main.aqi),
        color: getAqiColor(current.main.aqi),
        components: current.components || {}
    };
}
