const newsService = require("../services/news/newsService");

const getStockNews = async (req, res) => {
    try {
        const { symbol } = req.params;

        const news = await newsService.getStockNews(symbol);

        res.status(200).json({
            success: true,
            data: news
        });
    } catch (error) {
        console.error("News error:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getStockNews
};