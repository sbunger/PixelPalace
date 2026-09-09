async function loadCurrentSong() {

    try {

        const response =
            await fetch("/api/song");

        if (!response.ok) {
            throw new Error(
                "Could not load current song."
            );
        }

        const song =
            await response.json();

        displaySong(song);

    } catch (error) {

        console.error(
            "Could not load song:",
            error
        );
    }
}


function displaySong(song) {

    const artist =
        document.getElementById(
            "now-playing"
        );

    const title =
        document.querySelector(
            "#spotify-song h2"
        );

    const album =
        document.querySelector(
            "#spotify-song p"
        );

    const artwork =
        document.getElementById(
            "spotify-album"
        );


    artist.textContent =
        song.artist;

    title.textContent =
        song.title;

    album.textContent =
        song.album;


    if (song.image) {

        artwork.src =
            song.image;

    }


    if (song.url) {

        link.href =
            song.url;

    }

}


loadCurrentSong();