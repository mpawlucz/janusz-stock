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
        console.log(response.providers);
        APP.providers = response.providers;
    });

    function isRevolutSupport(ticker){
        return APP.providers.revolut.hasOwnProperty(ticker.toUpperCase());
    }

    if (!("MutationObserver" in global)) {
        global.MutationObserver = global.WebKitMutationObserver || global.MozMutationObserver;
    }

    $(document).find('head').append("<style>.janusz-revo {color:yellow}</style>");

    function createRevoMark(){
        let $revoMark = $("<span> REVO</span>");
        $revoMark.addClass("janusz-revo");
        return $revoMark;
    }

    let observer = new MutationObserver(function (mutationsList) {
        mutationsList.forEach(mutation => {
            if(mutation.type == 'childList') {
                Array.prototype.forEach.call(mutation.target.children, function(child) {
                    if (child.tagName == "TR"){
                        let $td = $(child).find("td:nth-child(2)");
                        if (isRevolutSupport($td.text().trim())){
                            if ($td.attr('janusz-stock') != "1"){
                                $td.attr('janusz-stock', "1");
                                $td.append(createRevoMark());
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
