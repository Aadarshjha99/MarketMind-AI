const mockNews = {
    TCS: [
        {
            title: "TCS announces new digital transformation partnership",
            description:
                "Tata Consultancy Services announced a new technology partnership focused on digital transformation and cloud services.",
            source: "MarketMind Mock News",
            author: "MarketMind",
            url: "https://example.com/tcs-digital-partnership",
            publishedAt: "2026-09-18T09:30:00Z"
        },
        {
            title: "TCS expands AI capabilities across enterprise solutions",
            description:
                "TCS continues to expand its artificial intelligence capabilities across enterprise technology services.",
            source: "MarketMind Mock News",
            author: "MarketMind",
            url: "https://example.com/tcs-ai-expansion",
            publishedAt: "2026-09-17T12:00:00Z"
        },
        {
            title: "Technology sector faces mixed market sentiment",
            description:
                "Investors remain cautious as global technology stocks experience mixed trading sessions.",
            source: "MarketMind Mock News",
            author: "MarketMind",
            url: "https://example.com/technology-market-sentiment",
            publishedAt: "2026-09-16T08:00:00Z"
        }
    ],

    INFY: [
        {
            title: "Infosys reports strong demand for cloud services",
            description:
                "Infosys reported continued demand for cloud modernization and digital services.",
            source: "MarketMind Mock News",
            author: "MarketMind",
            url: "https://example.com/infosys-cloud",
            publishedAt: "2026-09-18T10:00:00Z"
        },
        {
            title: "Infosys expands artificial intelligence initiatives",
            description:
                "The company announced further investment in AI-driven enterprise solutions.",
            source: "MarketMind Mock News",
            author: "MarketMind",
            url: "https://example.com/infosys-ai",
            publishedAt: "2026-09-17T11:30:00Z"
        }
    ],

    RELIANCE: [
        {
            title: "Reliance Industries expands digital business initiatives",
            description:
                "Reliance continues to expand its digital ecosystem and technology operations.",
            source: "MarketMind Mock News",
            author: "MarketMind",
            url: "https://example.com/reliance-digital",
            publishedAt: "2026-09-18T07:30:00Z"
        }
    ]
};

const getNews = async (symbol) => {
    const normalizedSymbol = symbol.toUpperCase();

    return mockNews[normalizedSymbol] || [];
};

module.exports = {
    getNews
};