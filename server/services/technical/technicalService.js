const calculateSMA = (prices, period) => {
    const result = [];

    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            result.push(null);
            continue;
        }

        const slice = prices.slice(i - period + 1, i + 1);

        const sum = slice.reduce(
            (total, price) => total + price,
            0
        );

        result.push(sum / period);
    }

    return result;
};


const calculateEMA = (prices, period) => {
    const result = [];

    const multiplier = 2 / (period + 1);

    let previousEMA = null;

    for (let i = 0; i < prices.length; i++) {
        const price = prices[i];

        if (i < period - 1) {
            result.push(null);
            continue;
        }

        if (previousEMA === null) {
            const initialPrices = prices.slice(
                i - period + 1,
                i + 1
            );

            previousEMA =
                initialPrices.reduce(
                    (sum, value) => sum + value,
                    0
                ) / period;

            result.push(previousEMA);
            continue;
        }

        const currentEMA =
            (price - previousEMA) * multiplier +
            previousEMA;

        previousEMA = currentEMA;

        result.push(currentEMA);
    }

    return result;
};


const calculateRSI = (prices, period = 14) => {
    const result = Array(prices.length).fill(null);

    if (prices.length <= period) {
        return result;
    }

    let gains = 0;
    let losses = 0;

    // Initial average gain/loss
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

    // Subsequent values
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];

        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        averageGain =
            ((averageGain * (period - 1)) + gain) /
            period;

        averageLoss =
            ((averageLoss * (period - 1)) + loss) /
            period;

        result[i] = calculateRSIValue(
            averageGain,
            averageLoss
        );
    }

    return result;
};


const calculateRSIValue = (averageGain, averageLoss) => {
    if (averageLoss === 0) {
        return 100;
    }

    const relativeStrength =
        averageGain / averageLoss;

    return 100 - (100 / (1 + relativeStrength));
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

    const signalValues = calculateEMA(
        validMACDValues,
        9
    );

    const signalLine = Array(prices.length).fill(null);

    let signalIndex = 0;

    for (let i = 0; i < macdLine.length; i++) {
        if (macdLine[i] !== null) {
            signalLine[i] = signalValues[signalIndex];
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


const calculateIndicators = (historicalData) => {
    const prices = historicalData.map(
        (item) => Number(item.close)
    );

    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);

    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);

    const rsi14 = calculateRSI(prices, 14);

    const macd = calculateMACD(prices);

    return historicalData.map((item, index) => ({
        datetime: item.datetime,

        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,

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