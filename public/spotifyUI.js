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
        const nowPlaying = document.getElementById("now-playing");

        const album = document.getElementById("spotify-album");
        const container = document.getElementById("spotify-container");
        const link = document.getElementById("spotify-link");

        if (!data.isPlaying) {
            song.innerHTML = "It's a little quiet right now..."
            album.style.display = "none";
            container.style.backgroundColor = "#000";

            nowPlaying.style.color = "#fff";
            song.style.color = "#fff";
            return;
        }

        nowPlaying.style.color = data.darkVibrant;

        song.innerHTML = `
            <h2>${data.title}</h2>
            <p>${data.artist} • ${formatTime(data.elapsed)} / ${formatTime(data.duration)}</p>
        `;
        song.style.color = data.textColor;

        album.style.display = "block";
        album.src = data.albumArt;
        link.href = data.url;

        container.style.backgroundColor = data.vibrantColor;
    } catch (err) {
        console.error(err);
        document.getElementById("spotify-song").innerText = "Error loading music :(";
    }
}

updateSpotify();
setInterval(updateSpotify, 3000);