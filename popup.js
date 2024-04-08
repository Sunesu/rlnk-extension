
// various cross-browser compatibility tweaks

var chromium = false;
if(!browser){
    var browser = chrome;
    chromium = true;
}

// chrome.runtime.getBrowserInfo((i)=>{
//     if(i.name != "Firefox"){
//         // probably a chromium based browser
//         browser = chrome;
//         chromium = true;
//     }
// });

// https://stackoverflow.com/questions/45957590/chrome-tabs-queryobject-doesnt-match-definition
var browser_tabs_query = (args,callback) => {
    if(chromium){
        // chrome doesn't support promises, so we have to pass a callback function
        chrome.tabs.query(args, callback);
    }
    else {
        browser.tabs.query(args).then(callback);
    }
}

var browser_runtime_sendMessage = (args,callback) => {
    if(chromium){
        // chrome doesn't support promises, so we have to pass a callback function
        chrome.runtime.sendMessage(args, callback);
    }
    else {
        browser.runtime.sendMessage(args).then(callback);
    }
}

var accounts_select = document.getElementById('accounts');
var swap_cookie_button = document.getElementById('swap-cookie');
var copy_cookie_button = document.getElementById('copy-cookie');
var soft_logout_button = document.getElementById('soft-logout');

// check if we are at a roblox website
browser_tabs_query({active: true, currentWindow: true},(tabs)=>{
    if(tabs[0].url.includes("roblox.com/")){
        // if yes then show the buttons!
        copy_cookie_button.style.display = "inline-block";
        swap_cookie_button.style.display = "inline-block";
        soft_logout_button.style.display = "inline-block";
    }
});

// token for communication with rlnk server
const ACCESS_TOKEN = crypto.randomUUID();

// swap cookie button
swap_cookie_button.addEventListener('click', async ()=>{
    // let's start local rlnk server for 2way communication... this won't stop this script, right?
    window.location.href = `rlnk://server/${ACCESS_TOKEN}`;

    swap_cookie_button.innerText = "Loading..."

    // let it start
    await new Promise((resolve)=>setTimeout(resolve,2000));

    // fetch accounts
    fetch("http://localhost:4968/accounts",{
        headers: {
            authorization: ACCESS_TOKEN
        }
    })
    .then(res=>res.json())
    .then((res)=>{
        // show them to the user
        accounts_select.innerHTML += `<option value="0"></option>`
        for (const account of res) {
            accounts_select.innerHTML += `<option value="${account.userId}">${account.displayName}</option>`
        }
        // hide swap cookie button & show select
        swap_cookie_button.style.display = "none";
        accounts_select.style.display = "inline-block";
        // accounts_select.dispatchEvent(new MouseEvent('mousedown'));
        accounts_select.size = res.length;

        // wait for the user to select account
        accounts_select.addEventListener('change',()=>{
            // get cookie
            fetch(`http://localhost:4968/cookie/${accounts_select.options[accounts_select.options.selectedIndex].value}`,{
                headers: {
                    authorization: ACCESS_TOKEN
                }
            })
            .then(res2=>res2.text())
            .then(async (cookie)=>{
                // and swap!
                await browser_runtime_sendMessage({key:'setcookie', value: cookie, store: browser.extension.inIncognitoContext ? 'incognito' : 'main'},(message)=>{
                    console.log('trying to reload the page...');
                    browser_tabs_query({active: true, currentWindow: true},(tabs)=>{
                        browser.tabs.sendMessage(tabs[0].id, {key:'reloadpage'});
                    });
                });
            });
        });
    });
    
});

// cookie button
copy_cookie_button.addEventListener('click',()=>{
    browser_runtime_sendMessage({key:'getcookie', store: browser.extension.inIncognitoContext ? 'incognito' : 'main'},(message)=>{
        // console.log(message);
        switch (message.key) {
            case 'cookie':
                console.log('cookie received');
                navigator.clipboard.writeText(message.value)
                copy_cookie_button.innerText = "Copied!"
        }
    });
});

// soft logout button
document.getElementById('soft-logout').addEventListener('click',()=>{
    browser.runtime.sendMessage({key:'removecookie', store: browser.extension.inIncognitoContext ? 'incognito' : 'main'});
    document.getElementById('soft-logout').innerText = "Done!";
    console.log('trying to reload the page...');
    browser_tabs_query({active: true, currentWindow: true},(tabs)=>{
        browser.tabs.sendMessage(tabs[0].id, {key:'reloadpage'});
    });
});

// img click
document.querySelector('img').addEventListener('click',()=>{
    window.location.href = "rlnk://app";
})

window.addEventListener("blur", function(){
    // try to shutdown the rlnk server
    // known issue: sometimes it won't shutdown a rlnk server
    fetch(`http://localhost:4968/shutdown`,{
        headers: {
            authorization: ACCESS_TOKEN
        }
    })
});