//connect to the APIs
const dogApi = document.getElementById("dog-api");
const catApi = document.getElementById("cat-api");
const weatherApi = document.getElementById("weather-api");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("search-results");
const currencyApi = document.getElementById("currency-exchange-api");
const moviesApi = document.getElementById("trending-movies-api");
// matches id in index.html
const githubApi = document.getElementById("github-user-api");
const stockApi = document.getElementById("stock-information-api");
const jokeApi = document.getElementById("joke-api");

//Random Dog Image API
async function getDogImage() {
    const response = await fetch('https://dog.ceo/api/breeds/image/random');
    const data = await response.json();
    const dogApi = document.getElementById('dog-output');
    if (dogApi) dogApi.innerHTML = "";
    const img = document.createElement('img');
    img.src = data.message;
    dogApi.appendChild(img);   
}



//Random Cat Image API
async function getCatImage() {
    const response = await fetch("https://api.thecatapi.com/v1/images/search");
    const data = await response.json();
    const catApi = document.getElementById('cat-output');
    if (catApi) catApi.innerHTML = "";
    const img = document.createElement('img');
    img.src = data[0].url; // Access the URL from the first object in the array
    catApi.appendChild(img);
}

//Weather Information API
// Holds the last user-selected location from the search results
let selectedLocation = null;

async function getWeatherInfo(latitude, longitude) {
    try {
        // If no coordinates provided, try to resolve from selectedLocation
        if (typeof latitude === 'undefined' || typeof longitude === 'undefined') {
            if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
                latitude = selectedLocation.latitude;
                longitude = selectedLocation.longitude;
            } else if (searchInput && searchInput.value.trim().length > 2) {
                // Try to geocode the input and use the first result
                const results = await searchLocation(searchInput.value.trim());
                if (results && results.length > 0) {
                    latitude = results[0].latitude;
                    longitude = results[0].longitude;
                    // set selectedLocation for future
                    selectedLocation = results[0];
                }
            } else if (navigator.geolocation) {
                // Fallback to browser geolocation
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                });
                latitude = pos.coords.latitude;
                longitude = pos.coords.longitude;
            } else {
                // final fallback to NYC
                latitude = 40.7128;
                longitude = -74.0060;
            }
        }

        // Use Open-Meteo's current_weather flag to get current weather
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`
        );
        const data = await response.json();
        // attach coordinates to data for display if available
        data._coords = { latitude, longitude };
        displayWeatherResults(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        searchResults.innerHTML = '<p>Error fetching weather data. Please try again later.</p>';
    }
}

async function searchLocation(query) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
        );
        const data = await response.json();
        const results = data.results || [];
        displayLocationResults(results);
        return results;
    } catch (error) {
        console.error('Error searching location:', error);
        searchResults.innerHTML = '<p>Error searching location. Please try again later.</p>';
        return [];
    }
}

function displayLocationResults(results) {
    searchResults.innerHTML = "";
    if (results && results.length > 0) {
        searchResults.innerHTML = '';
        results.forEach(location => {
            const resultElement = document.createElement('div');
            resultElement.classList.add('search-result-item');
            resultElement.style.cursor = 'pointer';
            resultElement.innerHTML = 
                `<h3>${location.name}${location.admin1 ? ', ' + location.admin1 : ''}</h3>
                <p>${location.country}</p>`;
            resultElement.addEventListener('click', () => {
                // set selected location and fetch weather for it
                selectedLocation = {
                    name: location.name + (location.admin1 ? ', ' + location.admin1 : ''),
                    country: location.country,
                    latitude: location.latitude,
                    longitude: location.longitude
                };
                // visually indicate selection
                Array.from(searchResults.children).forEach(c => c.classList.remove('selected'));
                resultElement.classList.add('selected');
                getWeatherInfo(location.latitude, location.longitude);
            });
            searchResults.appendChild(resultElement);
        })
    } else {
        searchResults.innerHTML = '<p>No locations found.</p>';
    }
}

function displayWeatherResults(data) {
    const current = data.current_weather;
    if (!current) {
        searchResults.innerHTML = '<p>No current weather data available for this location.</p>';
        return;
    }

    const locationName = selectedLocation && selectedLocation.name ? selectedLocation.name :
        (data.name ? data.name : (data._coords ? `Lat: ${data._coords.latitude.toFixed(3)}, Lon: ${data._coords.longitude.toFixed(3)}` : 'Selected Location'));

    searchResults.innerHTML = `
        <div class="weather-info">
            <h3>Current Weather — ${locationName}</h3>
            <p><strong>Temperature:</strong> ${current.temperature}°F</p>
            <p><strong>Wind Speed:</strong> ${current.windspeed} km/h</p>
            <p><strong>Weather Code:</strong> ${current.weathercode}</p>
        </div>
    `;
}

searchInput.addEventListener("input", async (event) => {
    const query = event.target.value.trim();
    if (query.length > 2) {
        await searchLocation(query);
    } else {
        searchResults.innerHTML = "";
    }
});
//Currency Exchange Rate API

async function getExchangeRate(fromCurrency, toCurrency) {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await response.json();
    const currencyApi = document.getElementById("currency-output");
    const rate = data.rates[toCurrency];
    currencyApi.innerHTML = `<p>1 ${fromCurrency} = ${rate} ${toCurrency}</p>`;
}

//Trending Movies API

const apiKey = "3275d797df8384bd24e51a97d6d7ea3f";
const url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=en-US`;

async function getTrendingMovies() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
    
        const data = await response.json();
        const top5Movies = data.results.slice(0, 5);
        const moviesApi = document.getElementById("movies-output");
        if (moviesApi) moviesApi.innerHTML = "";
        top5Movies.forEach((movie, index) => {
            const movieElement = document.createElement('div');
            movieElement.classList.add('movie-item');
            movieElement.innerHTML = `
                <h4>${index + 1}. ${movie.title}</h4>
                <p><strong>Rating:</strong> ${movie.vote_average}/10</p>
                <p>${movie.overview.substring(0, 100)}...</p>
            `;
            moviesApi.appendChild(movieElement);
        });
    } catch (error) {
        console.error("Error fetching trending movies:", error);
        moviesApi.innerHTML = '<p>Error fetching trending movies. Please try again later.</p>';
    }
}    

//GitHub User Profile API

async function getRandomGitHubUser() {
    const userDetails = document.getElementById('github-user-details');
    userDetails.innerHTML = "<p>Fetching new user...</p>";

    try {
        // Limit pages to avoid exceeding search result bounds; GitHub has a ~1000 result cap
        const randomPage = Math.floor(Math.random() * 100) + 1;
        const githubUrl = new URL("https://api.github.com/search/users");
        // Use a valid search qualifier for users — 'repos:>0' finds users with at least one repo
        githubUrl.searchParams.append('q', 'repos:>0');
        githubUrl.searchParams.append('per_page', '1');
        githubUrl.searchParams.append('page', randomPage);

        // Browsers disallow setting the User-Agent header; only set Accept
        let response = await fetch(githubUrl, {
            headers: {
                'Accept': "application/vnd.github.v3+json"
            }
        });

        // If GitHub returns 422 (validation failed), retry with a simpler qualifier
        if (response.status === 422) {
            console.warn('GitHub search validation failed. Retrying with followers:>0');
            userDetails.innerHTML = '<p>Search validation failed; retrying...</p>';
            githubUrl.searchParams.set('q', 'followers:>0');
            response = await fetch(githubUrl, {
                headers: {
                    'Accept': "application/vnd.github.v3+json"
                }
            });
        }

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const user = data.items[0];
            // fetch full user profile (search results return limited fields)
            const userResponse = await fetch(`https://api.github.com/users/${user.login}`);
            const fullUser = userResponse.ok ? await userResponse.json() : user;
            displayUser(fullUser);
        } else {
            userDetails.innerHTML = "<p>No user found.</p>";
        }
    } catch (error) {
        console.error("Error fetching GitHub user:", error);
        userDetails.innerHTML = "<p>Error fetching GitHub user.</p>";
    }

    function displayUser(user) {
        const userDetails = document.getElementById('github-user-details');
        userDetails.innerHTML = `
            <h3>${user.login}</h3>
            <p><strong>Username:</strong> ${user.login}</p>
            <p><strong>Public Repos:</strong> ${user.public_repos}</p>
            <p><strong>Followers:</strong> ${user.followers}</p>
            <p><strong>Following:</strong> ${user.following}</p>
            <img src="${user.avatar_url}" alt="${user.login} avatar">
        `;
    }
}


//Stock Information API

async function getStockInfo() {
    const stockApiKey = 'YlejLXdF8AjXDQ13Tz2EYwk1yanjoUeK';
    const url = `https://financialmodelingprep.com/stable/biggest-gainers?apikey=${stockApiKey}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const topStocks = data.slice(0, 5);

        console.log('Top 5 stocks:', topStocks);

        topStocks.forEach((stock, index) => {
            console.log(`${index + 1}. ${stock.symbol} - ${stock.price}`);
        });

        const stockList = document.createElement('ul');
        topStocks.forEach(stock => {
            const stockItem = document.createElement('li');
            stockItem.textContent = `${stock.symbol} - ${stock.price}`;
            stockList.appendChild(stockItem);
        });
        const stockApi = document.getElementById("stock-output");
        if (stockApi) stockApi.innerHTML = "";
        stockApi.appendChild(stockList);

        return topStocks;
    } catch (error) {
        console.error("Error fetching stock information:", error);
    }

}


//Random Joke API

async function getJoke() {
    const response = await fetch("https://v2.jokeapi.dev/joke/Any?safe-mode");
    const data = await response.json();
    const jokeApi = document.getElementById("joke-output");
    if (jokeApi) jokeApi.innerHTML = "";
    if (data.type === "single") {
        jokeApi.innerHTML = `<p>${data.joke}</p>`;
    } else if (data.type === "twopart") {
        jokeApi.innerHTML = `<p>${data.setup}</p><p>${data.delivery}</p>`;
    }
}


dogApi.addEventListener("click", getDogImage);
catApi.addEventListener("click", getCatImage);
weatherApi.addEventListener("click", () => getWeatherInfo());
jokeApi.addEventListener("click", getJoke);
currencyApi.addEventListener("click", () => getExchangeRate("USD", "EUR"));
moviesApi.addEventListener("click", () => getTrendingMovies());
if (githubApi) {
    // click the section or button to fetch a random GitHub user
    githubApi.addEventListener("click", getRandomGitHubUser);
};

stockApi.addEventListener("click", getStockInfo);


