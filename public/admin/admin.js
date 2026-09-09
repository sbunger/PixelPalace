const searchForm =
    document.getElementById("search-form");

const searchInput =
    document.getElementById("search-input");

const resultsContainer =
    document.getElementById("results");

const status =
    document.getElementById("status");


// --------------------------------------------------
// Load current song
// --------------------------------------------------

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

        displayCurrentSong(song);

    } catch (error) {

        console.error(error);

        status.textContent =
            error.message;

        status.style.display = "block";
    }
}


// --------------------------------------------------
// Display current song
// --------------------------------------------------

function displayCurrentSong(song) {

    document.getElementById(
        "current-artist"
    ).textContent =
        song.artist || "Artist";


    document.getElementById(
        "current-title"
    ).textContent =
        song.title || "Song";


    document.getElementById(
        "current-album"
    ).textContent =
        song.album || "Album";


    const image =
        document.getElementById(
            "current-image"
        );


    if (song.image) {

        image.src =
            song.image;

        image.style.display =
            "block";

    } else {

        image.style.display =
            "none";
    }
}


// --------------------------------------------------
// Search MusicBrainz
// --------------------------------------------------

searchForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const query =
            searchInput.value.trim();


        if (!query) {
            return;
        }


        status.textContent =
            "Searching...";

        status.style.display = "block";


        resultsContainer.innerHTML =
            "";


        try {

            const response =
                await fetch(
                    `/api/search?q=${encodeURIComponent(query)}`
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Search failed."
                );
            }


            if (
                !data.results ||
                data.results.length === 0
            ) {

                status.textContent =
                    "No results found.";
                status.style.display = "block";

                return;
            }


            status.textContent =
                `${data.results.length} results found.`;
            status.style.display = "block";


            displayResults(
                data.results
            );


        } catch (error) {

            console.error(error);

            status.textContent =
                error.message;
            status.style.display = "block";
        }
    }
);


// --------------------------------------------------
// Display search results
// --------------------------------------------------

function displayResults(results) {

    resultsContainer.innerHTML =
        "";


    results.forEach((song) => {

        const result =
            document.createElement("div");

        result.className =
            "result";


        const image =
            document.createElement("img");

        image.src =
            song.image;

        image.alt =
            `${song.album} album artwork`;


        /*
         * If Cover Art Archive doesn't have artwork,
         * don't show a broken image.
         */
        image.onerror = () => {

            image.style.display =
                "none";
        };


        const info =
            document.createElement("div");

        info.className =
            "result-info";


        const title =
            document.createElement("h2");

        title.textContent =
            song.title;


        const artist =
            document.createElement("p");

        artist.textContent =
            song.artist;


        const album =
            document.createElement("p");

        album.textContent =
            song.album;


        if (song.date) {

            const date =
                document.createElement("p");

            date.textContent =
                song.date;

            info.appendChild(
                date
            );
        }


        info.prepend(
            title,
            artist,
            album
        );


        const button =
            document.createElement("button");

        button.textContent =
            "SELECT";


        button.addEventListener(
            "click",
            () => selectSong(song)
        );


        result.appendChild(
            image
        );

        result.appendChild(
            info
        );

        result.appendChild(
            button
        );


        resultsContainer.appendChild(
            result
        );
    });
}


// --------------------------------------------------
// Select song
// --------------------------------------------------

async function selectSong(song) {

    status.textContent =
        "Updating...";

    status.style.display = "block";

    try {

        const response =
            await fetch(
                "/api/song",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        artist:
                            song.artist,

                        title:
                            song.title,

                        album:
                            song.album,

                        image:
                            song.image,

                        /*
                         * MusicBrainz page is useful
                         * as a fallback link.
                         */
                        url:
                            song.musicbrainzUrl
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not update song."
            );
        }


        displayCurrentSong(
            data.song
        );


        status.textContent =
            "Song updated!";
        
        status.style.display = "block";

        /*
         * Remove search results after selection.
         */
        resultsContainer.innerHTML =
            "";


    } catch (error) {

        console.error(error);

        status.textContent =
            error.message;

        status.style.display = "block";
    }
}


// --------------------------------------------------
// Initial load
// --------------------------------------------------

loadCurrentSong();