const express = require("express");

const {
    getStockNews
} = require("../controllers/newsController");

const router = express.Router();

router.get(
    "/:symbol",
    getStockNews
);

module.exports = router;