import express from "express";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const SONG_FILE = path.join(DATA_DIR, "current-song.json");

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const MUSICBRAINZ_URL = "https://musicbrainz.org/ws/2";

const MUSICBRAINZ_USER_AGENT =
    "SilasUngerWebsite/1.0 (https://yourdomain.com)";

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

// --------------------------------------------------
// Initialize data
// --------------------------------------------------

async function initializeData() {
    await fs.mkdir(DATA_DIR, {
        recursive: true
    });

    try {
        await fs.access(SONG_FILE);
    } catch {
        const defaultSong = {
            artist: "",
            title: "",
            album: "",
            image: "",
            url: ""
        };

        await fs.writeFile(
            SONG_FILE,
            JSON.stringify(defaultSong, null, 4)
        );
    }
}

// --------------------------------------------------
// Current song
// --------------------------------------------------

async function getCurrentSong() {
    const data = await fs.readFile(
        SONG_FILE,
        "utf8"
    );

    return JSON.parse(data);
}


async function setCurrentSong(song) {
    await fs.writeFile(
        SONG_FILE,
        JSON.stringify(song, null, 4)
    );
}


// --------------------------------------------------
// GET current song
// --------------------------------------------------

app.get("/api/song", async (req, res) => {
    try {
        const song = await getCurrentSong();

        res.json(song);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not load current song."
        });
    }
});


// --------------------------------------------------
// Search MusicBrainz
// --------------------------------------------------

app.get("/api/search", async (req, res) => {
    try {
        const query = req.query.q?.trim();

        if (!query) {
            return res.status(400).json({
                error: "Search query is required."
            });
        }

        const url = new URL(
            `${MUSICBRAINZ_URL}/recording`
        );

        url.searchParams.set(
            "query",
            query
        );

        url.searchParams.set(
            "fmt",
            "json"
        );

        url.searchParams.set(
            "limit",
            "10"
        );

        url.searchParams.set(
            "inc",
            "artist-credits+releases"
        );

        const response = await fetch(
            url,
            {
                headers: {
                    "User-Agent":
                        MUSICBRAINZ_USER_AGENT,
                    "Accept":
                        "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `MusicBrainz returned ${response.status}`
            );
        }

        const data = await response.json();

        const results = [];

        for (const recording of data.recordings || []) {
            const artists =
                recording["artist-credit"] || [];

            const artist =
                artists
                    .map((credit) => {
                        if (
                            typeof credit === "string"
                        ) {
                            return credit;
                        }

                        return (
                            credit.name ||
                            credit.artist?.name ||
                            ""
                        );
                    })
                    .join("");

            const releases =
                recording.releases || [];

            /*
             * Prefer an album release when possible.
             */
            const release =
                releases.find(
                    (r) =>
                        r["release-group"]?.["primary-type"] ===
                        "Album"
                ) ||
                releases[0];

            if (!release) {
                continue;
            }

            const releaseId =
                release.id;

            /*
             * Cover Art Archive thumbnail.
             *
             * 500px is a good size for the admin
             * search results.
             */
            const image =
                `https://coverartarchive.org/release/${releaseId}/front-500`;

            results.push({
                recordingId:
                    recording.id,

                releaseId,

                title:
                    recording.title,

                artist,

                album:
                    release.title,

                date:
                    release.date ||
                    "",

                image,

                musicbrainzUrl:
                    `https://musicbrainz.org/recording/${recording.id}`
            });
        }

        res.json({
            results
        });

    } catch (error) {
        console.error(
            "MusicBrainz search error:",
            error
        );

        res.status(500).json({
            error:
                "Could not search MusicBrainz."
        });
    }
});


// --------------------------------------------------
// Set current song
// --------------------------------------------------

app.post("/api/song", async (req, res) => {
    try {
        const {
            artist,
            title,
            album,
            image,
            url
        } = req.body;

        if (
            !artist ||
            !title ||
            !album ||
            !image
        ) {
            return res.status(400).json({
                error:
                    "Missing song information."
            });
        }

        const song = {
            artist:
                artist.trim(),

            title:
                title.trim(),

            album:
                album.trim(),

            image:
                image.trim(),

            url:
                url?.trim() || ""
        };

        await setCurrentSong(song);

        res.json({
            success: true,
            song
        });

    } catch (error) {
        console.error(
            "Could not save song:",
            error
        );

        res.status(500).json({
            error:
                "Could not save current song."
        });
    }
});


// --------------------------------------------------
// Admin page
// --------------------------------------------------

app.get("/admin", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "public",
            "admin",
            "index.html"
        )
    );
});


// --------------------------------------------------
// Start server
// --------------------------------------------------

initializeData()
    .then(() => {
        app.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );

            console.log(
                `Admin page: http://localhost:${PORT}/admin/`
            );
        });
    })
    .catch((error) => {
        console.error(
            "Failed to initialize server:",
            error
        );

        process.exit(1);
    });