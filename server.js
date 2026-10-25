
import express from "express";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import session from "express-session";

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

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, PROJECT_IMAGES_DIR);
        },
        filename: (req, file, cb) => {
            const extension = path.extname(file.originalname).toLowerCase();

            const name = path
                .basename(file.originalname, extension)
                .replace(/[^a-zA-Z0-9_-]/g, "-")
                .replace(/-+/g, "-")
                .toLowerCase();

            cb(null, `${name}-${Date.now()}${extension}`);
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
            cb(new Error("Only JPG, PNG, WebP, and GIF images are allowed."));
        }
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

if (
    !process.env.ADMIN_USERNAME ||
    !process.env.ADMIN_PASSWORD ||
    !process.env.SESSION_SECRET
) {
    throw new Error(
        "ADMIN_USERNAME, ADMIN_PASSWORD, and SESSION_SECRET must be set in .env"
    );
}

app.use(session({
    name: "admin.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: "auto",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 8
    }
}));

function requireAdmin(req, res, next) {
    if (req.session?.authenticated) {
        return next();
    }

    if (req.path.startsWith("/api/")) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    return res.redirect("/admin/login");
}

app.get("/admin/login", (req, res) => {
    if (req.session?.authenticated) {
        return res.redirect("/admin/");
    }

    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#000000">
    <title>Admin Login - Silas Unger</title>
    <link rel="stylesheet" href="/style.css">
    <style>
        .login-form { display: flex; flex-direction: column; gap: 12px; }
        .login-form input, .login-form button { box-sizing: border-box; width: 100%; padding: 10px 12px; font: 22px "Jersey 10", sans-serif; }
        .login-form input { background: black; color: white; border: 2px solid white; }
        .login-form button { background: white; color: black; border: 2px solid white; cursor: pointer; }
        .login-form button:hover { background: #3159b0; color: white; border-color: #3159b0; }
        .login-error { color: #3159b0; }
        .login-form input:focus-visible { outline: none; border-color: #3159b0; }
    </style>
</head>
<body>
<div class="team top container">
    <a href="/">
        <img src="/images/home.png" width="200px" alt="Home">
    </a>
</div>
    <main class="container outline">
        <h1>Admin Login</h1>
        <form class="login-form" method="POST" action="/admin/login" autocomplete="off">
            <input name="username" type="text" placeholder="Username" required>
            <input name="password" type="password" placeholder="Password" required>
            <button type="submit">LOG IN</button>
        </form>
    </main>
</body>
</html>`);
});

app.post("/admin/login", (req, res, next) => {
    const { username, password } = req.body;

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        username !== process.env.ADMIN_USERNAME ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login Failed</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
<div class="team top container">
    <a href="/">
        <img src="/images/home.png" width="200px" alt="Home">
    </a>
</div>
    <main class="container outline">
        <h1>Login failed</h1>
        <p>Incorrect username or password.</p>
        <p><a href="/admin/login">Try again</a></p>
    </main>
</body>
</html>`);
    }

    req.session.regenerate((error) => {
        if (error) {
            return next(error);
        }

        req.session.authenticated = true;

        req.session.save((saveError) => {
            if (saveError) {
                return next(saveError);
            }

            res.redirect("/admin/");
        });
    });
});

app.post("/admin/logout", requireAdmin, (req, res, next) => {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }

        res.clearCookie("admin.sid", {
            httpOnly: true,
            sameSite: "strict",
            secure: "auto"
        });

        res.redirect("/admin/login");
    });
});

// Require login for the admin page and all files under /admin.
app.use("/admin", (req, res, next) => {
    if (req.session?.authenticated) {
        return next();
    }

    return res.redirect("/admin/login");
});

// Serve public files after the admin access check.
app.use(express.static(path.join(__dirname, "public")));

// Initialize data.

async function initializeData() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(PROJECT_IMAGES_DIR, { recursive: true });

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
        await fs.writeFile(PROJECTS_FILE, "[]");
    }
}

// Projects.

app.get("/api/projects", async (req, res) => {
    try {
        const data = await fs.readFile(PROJECTS_FILE, "utf8");
        res.json(JSON.parse(data));
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Could not load projects."
        });
    }
});

app.post("/api/projects", requireAdmin, async (req, res) => {
    try {
        const { title, date, description, links, images } = req.body;

        if (!title || !date || !description) {
            return res.status(400).json({
                error: "Title, date, and description are required."
            });
        }

        const data = await fs.readFile(PROJECTS_FILE, "utf8");
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

app.delete("/api/projects/:index", requireAdmin, async (req, res) => {
    try {
        const index = Number(req.params.index);
        const data = await fs.readFile(PROJECTS_FILE, "utf8");
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

        const deletedProject = projects.splice(index, 1)[0];

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
});

app.post(
    "/api/projects/upload",
    requireAdmin,
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
            console.error("Image upload error:", error);

            res.status(500).json({
                error: error.message || "Could not upload image."
            });
        }
    }
);

// Current song storage.

async function getCurrentSong() {
    const data = await fs.readFile(SONG_FILE, "utf8");
    return JSON.parse(data);
}

async function setCurrentSong(song) {
    await fs.writeFile(
        SONG_FILE,
        JSON.stringify(song, null, 4)
    );
}

// Get current song.

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

// Search iTunes.

app.get("/api/search", async (req, res) => {
    try {
        const artist = (req.query.artist || "").trim();
        const song = (req.query.song || "").trim();

        if (!artist && !song) {
            return res.status(400).json({
                error: "Artist or song is required."
            });
        }

        const params = new URLSearchParams({
            term: [artist, song].filter(Boolean).join(" "),
            media: "music",
            entity: "song",
            country: "US",
            limit: "25"
        });

        const response = await fetch(
            `https://itunes.apple.com/search?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error(`iTunes returned ${response.status}`);
        }

        const data = await response.json();

        const results = (data.results || []).map(track => ({
            artist: track.artistName || "",
            title: track.trackName || "",
            album: track.collectionName || "",
            image: track.artworkUrl100
                ? track.artworkUrl100.replace(
                    /\/\d+x\d+bb\./,
                    "/600x600bb."
                )
                : "",
            date: track.releaseDate
                ? track.releaseDate.slice(0, 4)
                : "",
            url: track.trackViewUrl || ""
        }));

        res.json({ results });
    } catch (error) {
        console.error("iTunes search error:", error);

        res.status(500).json({
            error: "Could not search iTunes."
        });
    }
});

// Set current song.

app.post("/api/song", requireAdmin, async (req, res) => {
    try {
        const { artist, title, album, image, url } = req.body;

        if (!artist || !title || !album) {
            return res.status(400).json({
                error: "Missing song information."
            });
        }

        const song = {
            artist: artist.trim(),
            title: title.trim(),
            album: album.trim(),
            image: image?.trim() || "",
            url: url?.trim() || ""
        };

        await setCurrentSong(song);

        res.json({
            success: true,
            song
        });
    } catch (error) {
        console.error("Could not save song:", error);

        res.status(500).json({
            error: "Could not save current song."
        });
    }
});

// Admin page.

app.get("/admin", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "admin", "index.html")
    );
});

// Start server.

initializeData()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`Admin page: http://localhost:${PORT}/admin/`);
        });
    })
    .catch(error => {
        console.error("Failed to initialize server:", error);
        process.exit(1);
    });
