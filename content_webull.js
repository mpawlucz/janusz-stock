(function(global){
    "use strict";
    console.log('content_webull start');

    let APP = {
        providers: {
            revolut: {}
        }
    };

    chrome.runtime.sendMessage({type: "content-bgp", action:'getProviders'}, function(response){
        if (typeof response == 'undefined'){
            alert('error: ' + chrome.runtime.lastError);
            return;
        }
        APP.providers = response.providers;
    });

    function enableSupportMarker() {
        function isRevolutSupport(ticker) {
            return APP.providers.revolut.hasOwnProperty(ticker.toUpperCase());
        }

        function isTrading212Support(ticker) {
            return APP.providers.trading212.hasOwnProperty(ticker.toUpperCase());
        }

        if (!("MutationObserver" in global)) {
            global.MutationObserver = global.WebKitMutationObserver || global.MozMutationObserver;
        }

        $(document).find('head').append("<style>" +
            ".janusz-revo {color: yellow} .janusz-trading212 {color:lightblue}" +
            ".janusz-logo {color: #02CEEC; margin-top: 10px;}" +
            ".janusz-tooltip-row {color: #8A8D91; margin-top: 10px;}" +
            ".janusz-tooltip-price {color: #EEEEEE;}" +
            "</style>");

        function createRevoMark() {
            let $revoMark = $("<span> R</span>");
            $revoMark.addClass("janusz-revo");
            return $revoMark;
        }

        function createTrading212Mark() {
            let $revoMark = $("<span> T</span>");
            $revoMark.addClass("janusz-trading212");
            return $revoMark;
        }

        let markSupport = function ($td) {
            if ($td.attr('janusz-stock') != "1") {
                let ticker = $td.text().trim();
                if (isRevolutSupport(ticker)) {
                    $td.attr('janusz-stock', "1");
                    $td.append(createRevoMark());
                }
                if (isTrading212Support(ticker)) {
                    $td.attr('janusz-stock', "1");
                    $td.append(createTrading212Mark());
                }
            }
        };

        let observer = new MutationObserver(function (mutationsList) {
            mutationsList.forEach(mutation => {
                if (mutation.type == 'childList') {
                    Array.prototype.forEach.call(mutation.target.children, function (child) {
                        if (child.tagName == "TR") {
                            markSupport($(child).find("td:nth-child(2)"));
                            markSupport($(child).find("td:nth-child(3)"));
                        }
                    });
                }
            });
        });

        observer.observe(document, {
            attributes: false,
            characterData: false,
            childList: true,
            subtree: true,
            attributeOldValue: false,
            characterDataOldValue: false
        });
    }

    function extractNoNestedText(parentElement){
        return [].reduce.call(parentElement.childNodes, function(a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '');
    }

    function findTickerInfo(ticker, callback) {
        chrome.runtime.sendMessage({type: "content-bgp", action:'getTickerInfo', ticker: ticker}, function(response){
            if (typeof response == 'undefined'){
                alert('error: ' + chrome.runtime.lastError);
                return;
            }
            if (typeof callback === "function"){
                callback(response.tickerInfo);
            }
        });
    }

    function getTickerChartData(tickerId, callback) {
        chrome.runtime.sendMessage({type: "content-bgp", action:'getTickerChartData', tickerId: tickerId}, function(response){
            if (typeof response == 'undefined'){
                alert('error: ' + chrome.runtime.lastError);
                return;
            }
            if (typeof callback === "function"){
                callback(response.tickerChartData);
            }
        });
    }

    function loadCustomReferencePrice(ticker){
        findTickerInfo(ticker, function(tickerInfo){
            getTickerChartData(tickerInfo.tickerId, function (tickerChartData) {
                for (let i=0; i<tickerChartData.length; ++i){
                    let candleString = tickerChartData[i];
                    let candleArray = candleString.split(",");
                    let candleOpen = candleArray[1];
                    let candleClose = candleArray[2];
                    let timestamp = candleArray[0];
                    if (timestamp.substr(0,5) == "1579064400".substr(0,5)){
                        $("[janusz-stock-tooltip="+ticker+"] .janusz-tooltip-price-1-close").text(candleClose);
                    }
                    if (timestamp.substr(0,5) == "1584504000".substr(0,5)){
                        $("[janusz-stock-tooltip="+ticker+"] .janusz-tooltip-price-2-close").text(candleClose);
                    }
                    if (timestamp.substr(0,5) == "1585886400".substr(0,5)){
                        $("[janusz-stock-tooltip="+ticker+"] .janusz-tooltip-price-3-close").text(candleClose);
                    }
                }
            });
        });
    }

    function enableCustomPriceToolbar(){
        function insertCustomPriceTooltip(){
            let $tickerDiv = $('#rightTabWrap .tit');
            let $priceOriginalContainer = $tickerDiv.parent().parent().parent();
            let currentStockTicker = extractNoNestedText($tickerDiv[0]).trim();
            console.log(currentStockTicker);
            if ($priceOriginalContainer.attr('janusz-stock-tooltip') != currentStockTicker){
                $priceOriginalContainer.attr('janusz-stock-tooltip', currentStockTicker);
                $('.janusz-logo').remove();
                $('.janusz-tooltip-row').remove();
                $priceOriginalContainer.append("<div class='janusz-logo'>JanuszStock: "+currentStockTicker+"</div>");
                $priceOriginalContainer.append("<div class='janusz-tooltip-row'>Close 2020.01.15: " +
                    "<span class='janusz-tooltip-price janusz-tooltip-price-1-close'>...</span>" +
                    "</div>");
                $priceOriginalContainer.append("<div class='janusz-tooltip-row'>Close 2020.03.18: " +
                    "<span class='janusz-tooltip-price janusz-tooltip-price-2-close'>...</span>" +
                    "</div>");
                $priceOriginalContainer.append("<div class='janusz-tooltip-row'>Close 2020.04.03: " +
                    "<span class='janusz-tooltip-price janusz-tooltip-price-3-close'>...</span>" +
                    "</div>");
                if (currentStockTicker.length > 0){
                    loadCustomReferencePrice(currentStockTicker);
                }
            }
        }

        let changeStockObserver = new MutationObserver(function (mutationsList) {
            mutationsList.forEach(mutation => {
                if (mutation.type == 'childList') {
                    Array.prototype.forEach.call(mutation.target.children, function (child) {
                        if (child.id == "rightTabTop") {
                            insertCustomPriceTooltip();
                        }
                    });
                }
            });
        });

        let rightPanelAppearObserver = new MutationObserver(function (mutationsList) {
            mutationsList.forEach(mutation => {
                if (mutation.type == 'childList') {
                    Array.prototype.forEach.call(mutation.target.children, function (child) {
                        if (child.id == "DomWrap") {
                            changeStockObserver.observe(document, {
                                attributes: false,
                                characterData: false,
                                childList: true,
                                subtree: true,
                                attributeOldValue: false,
                                characterDataOldValue: false
                            });
                        }
                    });
                }
            });
        });

        rightPanelAppearObserver.observe(document, {
            attributes: false,
            characterData: false,
            childList: true,
            subtree: true,
            attributeOldValue: false,
            characterDataOldValue: false
        });
    }

    enableSupportMarker();
    enableCustomPriceToolbar();

})(window);
