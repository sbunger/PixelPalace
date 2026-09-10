import express from "express";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const SONG_FILE = path.join(DATA_DIR, "current-song.json");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const PROJECT_IMAGES_DIR = path.join(
    __dirname,
    "public",
    "images",
    "projects"
);

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const MUSICBRAINZ_URL = "https://musicbrainz.org/ws/2";

const MUSICBRAINZ_USER_AGENT =
    "SilasUngerWebsite/1.0 (https://sbunger.tech/)";

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, PROJECT_IMAGES_DIR);
        },
        filename: (req, file, cb) => {
            const extension = path.extname(file.originalname).toLowerCase();

            const name = path
                .basename(file.originalname, extension)
                .replace(/[^a-zA-Z0-9-_]/g, "-")
                .replace(/-+/g, "-")
                .toLowerCase();

            cb(
                null,
                `${name}-${Date.now()}${extension}`
            );
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only JPG, PNG, WebP, and GIF images are allowed."
                )
            );
        }
    }
});

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

    await fs.mkdir(PROJECT_IMAGES_DIR, {
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

    try {
        await fs.access(PROJECTS_FILE);
    } catch {
        await fs.writeFile(
            PROJECTS_FILE,
            "[]"
        );
    }
}

// --------------------------------------------------
// Projects
// --------------------------------------------------

app.get("/api/projects", async (req, res) => {
    try {
        const data = await fs.readFile(
            PROJECTS_FILE,
            "utf8"
        );

        res.json(JSON.parse(data));
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not load projects."
        });
    }
});

app.post("/api/projects", async (req, res) => {
    try {
        const {
            title,
            date,
            description,
            links,
            images
        } = req.body;

        if (!title || !date || !description) {
            return res.status(400).json({
                error: "Title, date, and description are required."
            });
        }

        const data = await fs.readFile(
            PROJECTS_FILE,
            "utf8"
        );

        const projects = JSON.parse(data);

        const project = {
            title: title.trim(),
            date: date.trim(),
            description: description.trim(),
            links: Array.isArray(links)
                ? links
                    .filter(link => link.label && link.url)
                    .map(link => ({
                        label: link.label.trim(),
                        url: link.url.trim()
                    }))
                : [],
            images: Array.isArray(images)
                ? images
                    .filter(image => image.src)
                    .map(image => ({
                        src: image.src.trim(),
                        caption: image.caption?.trim() || ""
                    }))
                : []
        };

        projects.push(project);

        await fs.writeFile(
            PROJECTS_FILE,
            JSON.stringify(projects, null, 4)
        );

        res.json({
            success: true,
            project
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not save project."
        });
    }
});

app.delete(
    "/api/projects/:index",
    async (req, res) => {
        try {
            const index = Number(req.params.index);

            const data = await fs.readFile(
                PROJECTS_FILE,
                "utf8"
            );

            const projects = JSON.parse(data);

            if (
                !Number.isInteger(index) ||
                index < 0 ||
                index >= projects.length
            ) {
                return res.status(404).json({
                    error: "Project not found."
                });
            }

            const deletedProject =
                projects.splice(index, 1)[0];

            await fs.writeFile(
                PROJECTS_FILE,
                JSON.stringify(projects, null, 4)
            );

            res.json({
                success: true,
                project: deletedProject
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                error: "Could not delete project."
            });
        }
    }
);

app.post(
    "/api/projects/upload",
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: "No image was uploaded."
                });
            }

            res.json({
                success: true,
                path: `/images/projects/${req.file.filename}`
            });
        } catch (error) {
            console.error(
                "Image upload error:",
                error
            );

            res.status(500).json({
                error: error.message ||
                    "Could not upload image."
            });
        }
    }
);

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
// Escape MusicBrainz/Lucene query
// --------------------------------------------------

function escapeLucene(value) {
    return value.replace(
        /([+\-!(){}\[\]^"~*?:\\/])/g,
        "\\$1"
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
        const artist =
            req.query.artist?.trim() || "";

        const song =
            req.query.song?.trim() || "";

        if (!artist && !song) {
            return res.status(400).json({
                error:
                    "Artist or song is required."
            });
        }

        const queryParts = [];

        if (artist) {
            queryParts.push(
                `artist:"${escapeLucene(artist)}"`
            );
        }

        if (song) {
            queryParts.push(
                `recording:"${escapeLucene(song)}"`
            );
        }

        const query =
            queryParts.join(" AND ");

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
            "20"
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

        const data =
            await response.json();

        const results = [];

        for (
            const recording of
            data.recordings || []
        ) {

            const artists =
                recording["artist-credit"] || [];

            const artistName =
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

            const release =
                releases.find(
                    (release) =>
                        release[
                            "release-group"
                        ]?.[
                            "primary-type"
                        ] === "Album"
                ) ||
                releases[0];

            if (!release) {
                continue;
            }

            const releaseId =
                release.id;

            const image =
                `https://coverartarchive.org/release/${releaseId}/front-500`;

            results.push({
                recordingId:
                    recording.id,

                releaseId,

                title:
                    recording.title,

                artist:
                    artistName,

                album:
                    release.title,

                date:
                    release.date || "",

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

        app.listen(
            PORT,
            () => {

                console.log(
                    `Server running at http://localhost:${PORT}`
                );

                console.log(
                    `Admin page: http://localhost:${PORT}/admin/`
                );
            }
        );
    })
    .catch((error) => {

        console.error(
            "Failed to initialize server:",
            error
        );

        process.exit(1);
    });