let APP = {
    providers: {
        revolut: {},
        trading212: {}
    },
    tickerIdByTicker: {},
    tickerChartDataByTickerId: {}
};

$.ajax({
    type: "GET",
    url: "https://mpawlucz.github.io/revolut-stocks-list-raw/revolut-stocks-list.csv",
    dataType: "text",
    success: function(responseText){
        let data = $.csv.toArrays(responseText);
        for (let i=1; i<data.length; ++i){ // skip first line (csv headers)
            let item = data[i];
            APP.providers.revolut[item[0].toUpperCase()] = {
                ticker: item[0].toUpperCase(),
                name: item[1]
            };
        }
    }
});

$.ajax({
    type: "GET",
    url: "https://mpawlucz.github.io/revolut-stocks-list-raw/trading212-stocks-list.csv",
    dataType: "text",
    success: function(responseText){
        let data = $.csv.toArrays(responseText);
        for (let i=1; i<data.length; ++i){ // skip first line (csv headers)
            let item = data[i];
            let marketName = item[5].trim();
            let allowedMarkets = {"NYSE": 1, "NASDAQ": 1};
            if (allowedMarkets.hasOwnProperty(marketName)){
                APP.providers.trading212[item[0].toUpperCase()] = {
                    ticker: item[0].toUpperCase(),
                    name: item[1]
                };
            }
        }
    }
});

function findTickerInfo(ticker, callback) {
    if (APP.tickerIdByTicker.hasOwnProperty(ticker)){
        callback(APP.tickerIdByTicker[ticker]);
        return;
    }
    $.ajax({
        type: "GET",
        url: "https://infoapi.webullbroker.com/api/search/tickerSearchV5?keys=" + ticker + "&hasNumber=0&clientOrder=0&queryNumber=30",
        dataType: "text",
        success: function (responseText) {
            let responseJson = JSON.parse(responseText);
            let mergedInfo = [].concat(responseJson.stockAndEtfs).concat(responseJson.others);
            let found = mergedInfo.find(element => element.symbol === ticker);
            if (found){
                if (typeof callback === "function"){
                    APP.tickerIdByTicker[ticker] = found;
                    callback(found);
                }
            }
        }
    });
}

function getTickerChartData(tickerId, callback) {
    if (APP.tickerChartDataByTickerId.hasOwnProperty(tickerId)){
        callback(APP.tickerChartDataByTickerId[tickerId]);
        return;
    }
    $.ajax({
        type: "GET",
        url: "https://quoteapi.webullbroker.com/api/quote/tickerChartDatas/v5/"+tickerId+"?type=d1&count=800",
        dataType: "text",
        success: function (responseText) {
            let responseJson = JSON.parse(responseText);
            if (responseJson.length > 0){
                if (typeof callback === "function"){
                    let data = responseJson[0].data;
                    APP.tickerChartDataByTickerId[tickerId] = data;
                    callback(data);
                    // todo validate response tickerId
                }
            }
        }
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "content-bgp"){
        if (request.action === "getProviders"){
            sendResponse({response: "bgp-content", providers: APP.providers});
            return;
        }
        if (request.action === "getTickerInfo"){
            findTickerInfo(request.ticker, function(tickerInfo){
                sendResponse({response: "bgp-content", tickerInfo: tickerInfo});
            });
            return true; // true => async
        }
        if (request.action === "getTickerChartData"){
            getTickerChartData(request.tickerId, function(tickerChartData){
                sendResponse({response: "bgp-content", tickerChartData: tickerChartData});
            });
            return true;
        }
    }
});