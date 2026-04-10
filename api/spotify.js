import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cors from "cors";
import * as Vibrant from "node-vibrant/node";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

async function getAccessToken() {
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Authorization":
                "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: REFRESH_TOKEN
        })
    });

    const data = await response.json();
    return data.access_token;
}

function getContrastingTextColor(hex) {
    hex = hex.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

app.get("/now-playing", async (req, res) => {
    try {
        const accessToken = await getAccessToken();

        const response = await fetch(
            "https://api.spotify.com/v1/me/player/currently-playing",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        if (response.status === 204 || response.status === 202) {
            console.log("failed");
            return res.json({ isPlaying: false });
        }

        const song = await response.json();

        const vibrant = new Vibrant.Vibrant(song.item.album.images[0].url);
        const palette = await vibrant.getPalette();

        const darkVibrant = palette.DarkVibrant.hex;
        const vibrantColor = palette.Vibrant.hex;
        const muted = palette.Muted.hex;

        const textColor = getContrastingTextColor(vibrantColor);

        res.json({
            isPlaying: song.is_playing,
            title: song.item.name,
            artist: song.item.artists.map(a => a.name).join(", "),
            albumArt: song.item.album.images[0].url,
            elapsed: song.progress_ms,
            duration: song.item.duration_ms,
            darkVibrant: darkVibrant,
            vibrantColor: vibrantColor,
            muted: muted,
            textColor: textColor,
            url: song.item.external_urls.spotify
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "fail" });
    }
});

app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});