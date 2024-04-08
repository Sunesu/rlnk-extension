
// various cross-browser compatibility tweaks

var chromium = false;
if(!browser){
    var browser = chrome;
    chromium = true;
}

var browser_cookies_getAllCookieStores = (callback) => {
    if(chromium){
        // chrome doesn't support promises, so we have to pass a callback function
        chrome.cookies.getAllCookieStores(callback);
    }
    else {
        browser.cookies.getAllCookieStores().then(callback);
    }
}

var browser_cookies = (method,cookie,callback) => {
    if(chromium){
        // chrome doesn't support promises, so we have to pass a callback function
        chrome.cookies[method](cookie,callback);
    }
    else {
        browser.cookies[method](cookie).then(callback);
    }
}

async function getCookieStore(message){
    return new Promise((resolve)=>{
        browser_cookies_getAllCookieStores((stores)=>{
            switch (message.store) {
                case 'incognito':
                    // chrome doesn't support incognito property so thats why we also use id check
                    // we have to use both because incognito store in firefox has "firefox-private" id
                    resolve(stores.find(v=> v.incognito || v.id=="1").id)
                default:
                    // that should be the main store, right?
                    resolve(stores[0].id)
            }
        });
    })
}

browser.runtime.onMessage.addListener((message, sender, sendResponse)=>{
    switch (message.key) {
        case 'getcookie':
            // console.log('getcookie received');

            const _getcookie = (storeId) => {
                browser_cookies('get',{url: "https://www.roblox.com", name: ".ROBLOSECURITY", storeId},(cookie)=>{
                    // console.log('cookie: '+cookie.value);
                    sendResponse({
                        key: 'cookie',
                        value: cookie.value
                    });
                });
            }

            getCookieStore(message).then((store)=>_getcookie(store));
            return true;

        case 'removecookie':
            // console.log('getcookie received');

            const _removecookie = (storeId) => {
                browser_cookies('remove',{url: "https://www.roblox.com", name: ".ROBLOSECURITY", storeId},(cookie)=>{
                    // console.log('cookie: '+cookie.value);
                    sendResponse({
                        key: 'cookie',
                        value: cookie.value
                    });
                });
            }

            getCookieStore(message).then((store)=>_removecookie(store));

            return true;

        case 'setcookie':
            console.log('setcookie received');

            const _setcookie = (storeId) => {
                browser_cookies('set',{url: "https://www.roblox.com", domain: ".roblox.com", name: ".ROBLOSECURITY", value: message.value, storeId, httpOnly: true, secure: true, expirationDate: Date.now() + (1000 * 60 * 60 * 24 * 365 * 25)},(cookie)=>{
                    // console.log('cookie: '+cookie.value);
                    sendResponse({
                        key: 'cookie',
                        value: cookie.value
                    });
                });
            }

            getCookieStore(message).then((store)=>_setcookie(store));
            return true;
    }
});