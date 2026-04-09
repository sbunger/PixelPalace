function updateData() {
    const now = new Date();

    const timeString = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const dateString = now.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    document.querySelectorAll(".time").forEach(el => {
        el.textContent = timeString.toLowerCase();
    });

    document.querySelectorAll(".date").forEach(el => {
        el.textContent = dateString;
    });
}

async function updateWeather() {
    try {
        const lat = 47.6062;
        const lon = -122.3321;

        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );

        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const wind = data.current_weather.windspeed;

        const weatherText = `Seattle: ${Math.round(temp * 1.8 + 32)}°C • wind ${Math.round(wind * 0.621371)}mi/h`;

        document.querySelectorAll(".weather").forEach(el => {
            el.textContent = weatherText;
        });

    } catch (err) {
        document.querySelectorAll(".weather").forEach(el => {
            el.textContent = "weather unavailable";
        });
        console.error(err);
    }
}

setInterval(updateData, 10);
setInterval(updateWeather, 100000);

updateData();
updateWeather();