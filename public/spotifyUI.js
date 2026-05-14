function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function timeAgo(timestamp) {
    if (!timestamp) return "never";

    const now = Date.now();
    const past = new Date(timestamp).getTime();
    const diff = Math.floor((now - past) / 1000); // seconds

    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;

    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

async function updateSpotify() {
    try {
        const res = await fetch("/now-playing");
        const data = await res.json();

        const song = document.getElementById("spotify-song");
        const nowPlaying = document.getElementById("now-playing");

        const album = document.getElementById("spotify-album");
        const container = document.getElementById("spotify-container");
        const link = document.getElementById("spotify-link");

        container.style.backgroundColor = data.vibrantColor;
        nowPlaying.style.color = data.darkVibrant;

        nowPlaying.innerHTML = data.isPlaying
            ? "Listening Now"
            : `Last listened ${timeAgo(data.lastListened)}`;

        container.style.filter = data.isPlaying ? "brightness(1)" : "brightness(0.9)";

        song.innerHTML = `
            <h2>${data.title} ${data.isPlaying ? '<span class="blink">•</span>' : ''}</h2>
            <p>${data.artist} • ${formatTime(data.elapsed)} / ${formatTime(data.duration)}</p>
        `;
        song.style.color = data.textColor;

        album.style.display = "block";
        album.src = data.albumArt;
        link.href = data.url;
    } catch (err) {
        console.error(err);
        document.getElementById("spotify-song").innerText = "Error loading music :(";
    }
}

updateSpotify();
setInterval(updateSpotify, 6000);