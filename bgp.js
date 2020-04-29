let APP = {
    providers: {
        revolut: {},
        trading212: {}
    }
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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "content-bgp"){
        if (request.action === "getProviders"){
            sendResponse({response: "bgp-content", providers: APP.providers});
            return;
        }
    }
});