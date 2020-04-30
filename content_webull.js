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

    function isRevolutSupport(ticker){
        return APP.providers.revolut.hasOwnProperty(ticker.toUpperCase());
    }
    function isTrading212Support(ticker){
        return APP.providers.trading212.hasOwnProperty(ticker.toUpperCase());
    }

    if (!("MutationObserver" in global)) {
        global.MutationObserver = global.WebKitMutationObserver || global.MozMutationObserver;
    }

    $(document).find('head').append("<style>.janusz-revo {color:yellow} .janusz-trading212 {color:lightblue}</style>");

    function createRevoMark(){
        let $revoMark = $("<span> R</span>");
        $revoMark.addClass("janusz-revo");
        return $revoMark;
    }
    function createTrading212Mark(){
        let $revoMark = $("<span> T</span>");
        $revoMark.addClass("janusz-trading212");
        return $revoMark;
    }

    let observer = new MutationObserver(function (mutationsList) {
        mutationsList.forEach(mutation => {
            if(mutation.type == 'childList') {
                Array.prototype.forEach.call(mutation.target.children, function(child) {
                    if (child.tagName == "TR"){
                        let $td = $(child).find("td:nth-child(2)");
                        if ($td.attr('janusz-stock') != "1"){
                            let ticker = $td.text().trim();
                            if (isRevolutSupport(ticker)){
                                $td.attr('janusz-stock', "1");
                                $td.append(createRevoMark());
                            }
                            if (isTrading212Support(ticker)){
                                $td.attr('janusz-stock', "1");
                                $td.append(createTrading212Mark());
                            }
                        }
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

})(window);
