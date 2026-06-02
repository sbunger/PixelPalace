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

let lastPlayedSong = null;
let lastListened = null;

let cachedAccessToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
    if (cachedAccessToken && Date.now() < tokenExpiresAt) {
        return cachedAccessToken;
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization:
                "Basic " +
                Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: REFRESH_TOKEN
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${text}`);
    }

    const data = await response.json();

    cachedAccessToken = data.access_token;

    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

    console.log("Fetched new Spotify access token");

    return cachedAccessToken;
}

function getContrastingTextColor(hex) {
    hex = hex.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

let currentTrackId = null;

async function updateNowPlaying() {
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
            console.log("Nothing playing");
            if (lastPlayedSong) {
                lastPlayedSong.isPlaying = false;
            }
            return;
        }

        if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");

            console.log(
                `Spotify rate limited. Retry after ${retryAfter} seconds`
            );

            return;
        }

        if (!response.ok) {
            const text = await response.text();

            console.error(
                `Spotify API error ${response.status}:`,
                text
            );

            return;
        }

        const song = await response.json();

        if (!song.item) return;

        const vibrant = new Vibrant.Vibrant(
            song.item.album.images[0].url
        );

        const palette = await vibrant.getPalette();
        const darkVibrant = palette.DarkVibrant?.hex || "#000000";
        const vibrantColor = palette.Vibrant?.hex || "#ffffff";
        const muted = palette.Muted?.hex || "#888888";
        const textColor = getContrastingTextColor(vibrantColor);

        if (song.is_playing) {
            lastListened = new Date().toISOString();
        }

        lastPlayedSong = {
            isPlaying: song.is_playing,

            title: song.item.name,

            artist: song.item.artists
                .map(a => a.name)
                .join(", "),

            albumArt: song.item.album.images[0].url,

            elapsed: song.progress_ms,
            duration: song.item.duration_ms,

            darkVibrant,
            vibrantColor,
            muted,
            textColor,

            url: song.item.external_urls.spotify,

            lastListened
        };

    } catch (err) {
        console.error("Background update failed:", err);
    }
}

app.get("/now-playing", (req, res) => {
    if (!lastPlayedSong) {
        return res.json({ isPlaying: false });
    }

    res.json(lastPlayedSong);
});

app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  updateNowPlaying();

  setInterval(updateNowPlaying, 6000);
});