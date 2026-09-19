const instrumentMap = {
    TCS: "NSE_EQ|INE467B01029",
    INFY: "NSE_EQ|INE009A01021",
    RELIANCE: "NSE_EQ|INE002A01018",
    HDFCBANK: "NSE_EQ|INE040A01034"
};

const getInstrumentKey = (symbol) => {
    return instrumentMap[symbol.toUpperCase()];
};

module.exports = {
    getInstrumentKey
};