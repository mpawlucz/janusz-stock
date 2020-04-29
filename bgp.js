let APP = {
    providers: {
        revolut: {}
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
        // console.log(APP.revolut);
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