/**
 * ui.js - DOM 렌더링 및 UI 업데이트
 * 
 * 담당: HTML 요소 선택, 텍스트/속성 업데이트, 이벤트 바인딩
 */

// DOM 요소 참조
const elements = {
    // 로딩 & 에러
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    mainContent: document.querySelector('.main-content'),

    // 헤더 & 검색
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchResults: document.getElementById('searchResults'),

    // 도시명 & 즐겨찾기
    cityName: document.getElementById('cityName'),
    favoriteBtn: document.getElementById('favoriteBtn'),
    favoritesList: document.getElementById('favoritesList'),

    // 현재 날씨
    weatherIcon: document.getElementById('weatherIcon'),
    currentTemp: document.getElementById('currentTemp'),
    weatherDesc: document.getElementById('weatherDesc'),
    feelsLike: document.getElementById('feelsLike'),

    // 상세 정보
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    aqi: document.getElementById('aqi'),
    tempMax: document.getElementById('tempMax'),
    tempMin: document.getElementById('tempMin'),

    // 예보
    hourlyList: document.getElementById('hourlyList'),
    forecastList: document.getElementById('forecastList')
};

/**
 * 로딩 상태 표시
 * @param {boolean} isLoading - 로딩 중 여부
 */
function renderLoading(isLoading) {
    if (isLoading) {
        elements.loading.classList.remove('hidden');
        elements.mainContent.classList.add('hidden');
        elements.error.classList.add('hidden');
    } else {
        elements.loading.classList.add('hidden');
    }
}

/**
 * 에러 메시지 표시
 * @param {string} message - 에러 메시지
 */
function renderError(message) {
    elements.error.textContent = message;
    elements.error.classList.remove('hidden');
    elements.mainContent.classList.add('hidden');
    elements.loading.classList.add('hidden');
}

/**
 * 에러 메시지 숨기기
 */
function clearError() {
    elements.error.classList.add('hidden');
}

/**
 * 메인 콘텐츠 표시
 */
function showMainContent() {
    elements.mainContent.classList.remove('hidden');
    elements.loading.classList.add('hidden');
    clearError();
}

/**
 * 현재 날씨 렌더링
 * @param {Object} weatherData - 정규화된 날씨 데이터
 * @param {Object} aqiData - 정규화된 AQI 데이터
 */
function renderCurrentWeather(weatherData, aqiData) {
    // 도시명
    elements.cityName.textContent = weatherData.city;

    // 현재 날씨 아이콘 & 온도
    elements.weatherIcon.textContent = getWeatherEmoji(weatherData.icon);
    
    elements.currentTemp.textContent = weatherData.temp;
    elements.weatherDesc.textContent = weatherData.description;
    elements.feelsLike.textContent = weatherData.feelsLike;

    // 상세 정보
    elements.humidity.textContent = `${weatherData.humidity}%`;
    elements.windSpeed.textContent = `${weatherData.windSpeed} m/s`;
    elements.tempMax.textContent = weatherData.tempMax;
    elements.tempMin.textContent = weatherData.tempMin;

    // AQI
    if (aqiData) {
        elements.aqi.textContent = aqiData.label;
        elements.aqi.style.color = aqiData.color;
    }

    showMainContent();
}

/**
 * 5일 예보 렌더링
 * @param {Array} dailyForecasts - 일별 예보 데이터 배열
 */
function renderForecast(dailyForecasts) {
    elements.forecastList.innerHTML = ''; // 기존 내용 제거

    dailyForecasts.forEach((item, index) => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';

        const dayLabel = index === 0 ? '오늘' : formatDate(item.date, 'dayOfWeek');

        forecastItem.innerHTML = `
            <div class="forecast-day">${dayLabel}</div>
            <div class="forecast-emoji">${getWeatherEmoji(item.icon)}</div>
            <div class="forecast-desc">${item.description}</div>
            <div class="forecast-temps">
                <span class="forecast-max">${item.tempMax}°</span>
                <span class="forecast-min">${item.tempMin}°</span>
            </div>
        `;

        elements.forecastList.appendChild(forecastItem);
    });
}

/**
 * 검색 결과 표시
 * @param {Array} cities - [{name, lat, lon, country}, ...]
 */
function renderSearchResults(cities) {
    elements.searchResults.innerHTML = '';

    if (cities.length === 0) {
        elements.searchResults.classList.add('hidden');
        return;
    }

    cities.slice(0, 5).forEach(city => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.textContent = `${city.name}${city.country ? ', ' + city.country : ''}`;

        resultItem.addEventListener('click', () => {
            selectSearchResult(city);
        });

        elements.searchResults.appendChild(resultItem);
    });

    elements.searchResults.classList.remove('hidden');
}

/**
 * 검색 결과 아이템 클릭 처리
 * @param {Object} city - {name, lat, lon, country}
 */
function selectSearchResult(city) {
    elements.searchInput.value = city.name;
    elements.searchResults.classList.add('hidden');

    appState.coords = { lat: city.lat, lon: city.lon };
    loadWeatherData(city.lat, city.lon);
}

/**
 * 검색 결과 숨기기
 */
function hideSearchResults() {
    elements.searchResults.classList.add('hidden');
}


/**
 * 검색 입력 포커스 아웃 시 결과 숨기기
 */
function bindSearchEvents() {
    elements.searchInput.addEventListener('blur', () => {
        // 약간의 지연 후 숨기기 (클릭 이벤트 처리를 위해)
        setTimeout(hideSearchResults, 200);
    });

    elements.searchInput.addEventListener('focus', () => {
        if (elements.searchInput.value.length > 0) {
            elements.searchResults.classList.remove('hidden');
        }
    });
}

/**
 * 날씨 아이콘 URL 생성
 */
function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// ── 즐겨찾기 UI ───────────────────────────────────
function renderFavoriteBtn(cityName) {
    const starred = isFavorite(cityName);
    elements.favoriteBtn.textContent = starred ? '★' : '☆';
    elements.favoriteBtn.classList.toggle('active', starred);
}

function renderFavoritesList() {
    const list = getFavorites();
    if (list.length === 0) {
        elements.favoritesList.classList.add('hidden');
        return;
    }
    elements.favoritesList.classList.remove('hidden');
    elements.favoritesList.innerHTML = list.map(city => `
        <button class="favorite-item" data-lat="${city.lat}" data-lon="${city.lon}" data-name="${city.name}">
            ★ ${city.name}
        </button>
    `).join('');

    elements.favoritesList.querySelectorAll('.favorite-item').forEach(btn => {
        btn.addEventListener('click', () => {
            appState.coords = { lat: +btn.dataset.lat, lon: +btn.dataset.lon };
            loadWeatherData(+btn.dataset.lat, +btn.dataset.lon);
        });
    });
}

// ── 시간별 예보 UI ────────────────────────────────
function renderHourly(hourlyData) {
    if (hourlyData.length === 0) {
        elements.hourlyList.innerHTML = '<p style="color:#999;font-size:13px">시간별 데이터 없음</p>';
        return;
    }
    elements.hourlyList.innerHTML = hourlyData.map(item => `
        <div class="hourly-item">
            <div class="hourly-time">${item.time}</div>
            <div class="hourly-emoji">${getWeatherEmoji(item.icon)}</div>
            <div class="hourly-temp">${item.temp}°</div>
        </div>
    `).join('');
}
