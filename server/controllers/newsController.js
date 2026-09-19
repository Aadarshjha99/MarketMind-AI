const newsService = require("../services/news/newsService");

const getStockNews = async (req, res) => {
    try {
        const { symbol } = req.params;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: "Stock symbol is required"
            });
        }

        const news = await newsService.getNews(
            symbol.toUpperCase()
        );

        res.status(200).json({
            success: true,
            message: "Stock news fetched successfully",
            data: news
        });

    } catch (error) {
        console.error(
            "News error:",
            error.message
        );

        res.status(502).json({
            success: false,
            message: "Unable to fetch stock news"
        });
    }
};

module.exports = {
    getStockNews
};