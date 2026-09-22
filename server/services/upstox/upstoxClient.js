const axios = require("axios");

const upstoxClient = axios.create({
    baseURL: "https://api.upstox.com/v2",
    headers: {
        Accept: "application/json"
    }
});

upstoxClient.interceptors.request.use((config) => {
    config.headers.Authorization =
        `Bearer ${process.env.UPSTOX_ANALYTICS_TOKEN}`;

    return config;
});

module.exports = upstoxClient;