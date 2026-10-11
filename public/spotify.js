
async function loadCurrentSong() {
    try {
        const response = await fetch("/api/song");

        if (!response.ok) {
            throw new Error("Could not load current song.");
        }

        const song = await response.json();

        displaySong(song);
    } catch (error) {
        console.error("Could not load song:", error);
    }
}

function updateWidgetColor(imageUrl) {
    const image = new Image();

    image.crossOrigin = "anonymous";

    image.onload = () => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = 1;
            canvas.height = 1;

            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, 1, 1);

            const [r, g, b] =
                context.getImageData(0, 0, 1, 1).data;

            const container =
                document.getElementById("spotify-container");

            container.style.backgroundColor =
                `rgb(${r}, ${g}, ${b})`;

            const brightness =
                (r * 299 + g * 587 + b * 114) / 1000;

            container.style.color =
                brightness >= 128 ? "#000000" : "#ffffff";

        } catch (error) {
            console.error("Could not extract album color:", error);
        }
    };

    image.onerror = () => {
        console.error("Could not load album artwork.");
    };

    image.src = imageUrl;
}

function displaySong(song) {
    const artist = document.getElementById("now-playing");
    const title = document.querySelector("#spotify-song h2");
    const album = document.querySelector("#spotify-song p");
    const artwork = document.getElementById("spotify-album");
    const link = document.getElementById("spotify-container");

    artist.textContent = song.artist || "";
    title.textContent = song.title || "";
    album.textContent = song.album || "";

    if (song.image) {
        artwork.src = song.image;
        artwork.style.display = "block";
        updateWidgetColor(song.image);
    } else {
        artwork.style.display = "none";
    }

    if (song.url) {
        link.href = song.url;
    }
}

loadCurrentSong();
