
const calculateSMA = (prices, period) => {
    const result = Array(prices.length).fill(null);

    for (let i = period - 1; i < prices.length; i++) {
        const slice = prices.slice(i - period + 1, i + 1);

        const sum = slice.reduce(
            (total, price) => total + price,
            0
        );

        result[i] = sum / period;
    }

    return result;
};


const calculateEMA = (prices, period) => {
    const result = Array(prices.length).fill(null);

    if (prices.length < period) {
        return result;
    }

    const multiplier = 2 / (period + 1);

    // Initial EMA = SMA of first period values
    let previousEMA = prices
        .slice(0, period)
        .reduce((sum, price) => sum + price, 0) / period;

    result[period - 1] = previousEMA;

    for (let i = period; i < prices.length; i++) {
        const currentEMA =
            (prices[i] - previousEMA) * multiplier +
            previousEMA;

        previousEMA = currentEMA;
        result[i] = currentEMA;
    }

    return result;
};


const calculateRSIValue = (averageGain, averageLoss) => {
    if (averageGain === 0 && averageLoss === 0) {
        return 50;
    }

    if (averageLoss === 0) {
        return 100;
    }

    if (averageGain === 0) {
        return 0;
    }

    const relativeStrength = averageGain / averageLoss;

    return 100 - (100 / (1 + relativeStrength));
};


const calculateRSI = (prices, period = 14) => {
    const result = Array(prices.length).fill(null);

    if (prices.length <= period) {
        return result;
    }

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];

        if (change > 0) {
            gains += change;
        } else {
            losses += Math.abs(change);
        }
    }

    let averageGain = gains / period;
    let averageLoss = losses / period;

    result[period] = calculateRSIValue(
        averageGain,
        averageLoss
    );

    // Wilder's smoothing
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];

        const gain = Math.max(change, 0);
        const loss = Math.max(-change, 0);

        averageGain =
            (averageGain * (period - 1) + gain) / period;

        averageLoss =
            (averageLoss * (period - 1) + loss) / period;

        result[i] = calculateRSIValue(
            averageGain,
            averageLoss
        );
    }

    return result;
};


const calculateMACD = (prices) => {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);

    const macdLine = prices.map((_, index) => {
        if (
            ema12[index] === null ||
            ema26[index] === null
        ) {
            return null;
        }

        return ema12[index] - ema26[index];
    });

    const validMACDValues = macdLine.filter(
        (value) => value !== null
    );

    const validSignalValues = calculateEMA(
        validMACDValues,
        9
    );

    const signalLine = Array(prices.length).fill(null);

    let signalIndex = 0;

    for (let i = 0; i < macdLine.length; i++) {
        if (macdLine[i] !== null) {
            signalLine[i] = validSignalValues[signalIndex];
            signalIndex++;
        }
    }

    const histogram = macdLine.map((macd, index) => {
        if (
            macd === null ||
            signalLine[index] === null
        ) {
            return null;
        }

        return macd - signalLine[index];
    });

    return {
        macdLine,
        signalLine,
        histogram
    };
};


// Main technical analysis function
const calculateIndicators = (historicalData) => {
    if (!Array.isArray(historicalData)) {
        throw new Error("Historical data must be an array.");
    }

    // Validate candles and create a sorted copy.
    // Upstox returns newest-first; calculations need oldest-first.
    const chronologicalData = historicalData
        .filter((item) => {
            return (
                item.datetime &&
                Number.isFinite(Number(item.close)) &&
                Number.isFinite(new Date(item.datetime).getTime())
            );
        })
        .map((item) => ({
            ...item,
            close: Number(item.close)
        }))
        .sort(
            (a, b) =>
                new Date(a.datetime) - new Date(b.datetime)
        );

    const prices = chronologicalData.map(
        (item) => item.close
    );

    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);

    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);

    const rsi14 = calculateRSI(prices, 14);

    const macd = calculateMACD(prices);

    return chronologicalData.map((item, index) => ({
        datetime: item.datetime,

        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: item.close,
        volume: Number(item.volume || 0),

        sma20: sma20[index],
        sma50: sma50[index],

        ema20: ema20[index],
        ema50: ema50[index],

        rsi14: rsi14[index],

        macd: macd.macdLine[index],
        macdSignal: macd.signalLine[index],
        macdHistogram: macd.histogram[index]
    }));
};

module.exports = {
    calculateIndicators
};
