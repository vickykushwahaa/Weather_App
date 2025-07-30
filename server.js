require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENWEATHER_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API endpoint to fetch weather
app.get('/api/weather', async (req, res) => {
    const city = req.query.city;
    
    if (!city) {
        return res.status(400).json({ error: 'City name is required' });
    }

    try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

        const [weatherResponse, forecastResponse] = await Promise.all([
            axios.get(weatherUrl),
            axios.get(forecastUrl)
        ]);

        const weatherData = {
            city: weatherResponse.data.name,
            country: weatherResponse.data.sys.country,
            temperature: Math.round(weatherResponse.data.main.temp),
            description: weatherResponse.data.weather[0].description,
            icon: weatherResponse.data.weather[0].icon,
            humidity: weatherResponse.data.main.humidity,
            windSpeed: Math.round(weatherResponse.data.wind.speed * 3.6),
        };

        const forecastData = forecastResponse.data.list
            .filter((item, index) => index % 8 === 0) // Get one forecast per day
            .slice(0, 5) // Next 5 days
            .map(item => ({
                date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
                temp: Math.round(item.main.temp),
                icon: item.weather[0].icon,
            }));

        res.json({ weather: weatherData, forecast: forecastData });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching weather data' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});