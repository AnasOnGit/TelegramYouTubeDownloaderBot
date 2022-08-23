const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { isValidUrl } = require("is-youtube-url");
require("dotenv").config();
const Innertube = require("youtubei.js");
const getVideoId = require("get-video-id");

const app = express();

// middleware
app.use(bodyParser.json());

// accessing env
const { TOKEN, SERVER_URL } = process.env; // GET YOUR TOKEN FROM https://core.telegram.org/bots/api

// Telegram API end-point
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const init = async() => {
    try {
        const res = await axios.get(
            `${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`
        );
        console.log(res.data);
    } catch (e) {
        console.log(e);
    }
    console.log(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
};

app.get("/", async function(req, res) {
    // downloader("IlsygSzikOQ");
    res.json("Hello, World!");
});

app.post(URI, async(req, res) => {
    console.log(req.body);

    const chatId = req.body.message?.chat.id || req.body.edited_message.chat.id;
    const text = req.body.message.text;

    if (isValidUrl(text)) {
        const url = await downloader(text);
        try {
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: url,
            });
        } catch (e) {
            console.log(e);
        }
    } else {
        try {
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: "Please enter a youtube URL",
            });
        } catch (e) {
            console.log(e);
        }
    }

    return res.send();
});

// helper functions
const downloader = async(url) => {
    const { id } = getVideoId(url);
    const youtube = await new Innertube({ gl: "US" });
    const stream = await youtube.getStreamingData(id, {
        format: "mp4", // defaults to mp4
        quality: "720p", // falls back to 360p if a specific quality isn't available
        type: "videoandaudio",
    });
    return stream.formats[0].url;
};

app.listen(3000, async() => {
    console.log("Server started 🚀 ");
    await init();
});