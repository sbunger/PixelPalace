function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function updateSpotify() {
    try {
        const res = await fetch("/now-playing");
        const data = await res.json();

        const song = document.getElementById("spotify-song");
        const album = document.getElementById("spotify-album");
        const container = document.getElementById("spotify-container");
        const link = document.getElementById("spotify-link");

        if (!data.isPlaying) {
            song.innerHTML = "It's a little quiet right now..."
            album.style.display = "none";
            container.style.backgroundColor = "#000";
            song.style.color = "#fff";
            return;
        }

        song.innerHTML = `
            <p style="opacity: 0.85">Listening Now:</p>
            <h2>${data.title}</h2>
            <p>${data.artist} • ${formatTime(data.elapsed)}</p>
        `;
        song.style.color = data.textColor;

        album.style.display = "block";
        album.src = data.albumArt;
        link.href = data.url;

        container.style.backgroundColor = data.color;
    } catch (err) {
        console.error(err);
        document.getElementById("spotify-song").innerText = "Error loading music :(";
    }
}

updateSpotify();
setInterval(updateSpotify, 3000);