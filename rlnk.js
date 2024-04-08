// chromium based browser compatibility
if(chrome){
    var browser = chrome;
}

// helper function to acquire .ROBLOSECURITY cookie
function getCookie(){
    // return document.cookie.split('; ').map(v=>{return{[v.split('=')[0]]: v.split('=')[1]}}).find(v=>Object.keys(v)[0] == '.ROBLOSECURITY')['.ROBLOSECURITY'];
    // above won't work because .ROBLOSECURITY is httpOnly
    // so... we just have to use a background script instead
    return new Promise((resolve,reject)=>{
        browser.runtime.sendMessage({key:'getcookie',store: browser.extension.inIncognitoContext ? 'incognito' : 'main'}).then((message)=>{
            // console.log(message);
            switch (message.key) {
                case 'cookie':
                    console.log('cookie received');
                    resolve(message.value);
            }
        });
        // console.log('message sent');
    });
}

// add rlnk button next to play button
if(window.location.pathname.startsWith('/games/')){
    var timer = setInterval(() => {
        if(document.querySelector('.btn-common-play-game-lg.btn-primary-md.btn-full-width')){
            var rlnk_button = document.createElement('button');
    
            rlnk_button.style.height = '60px';
            rlnk_button.style.aspectRatio = 1;
            rlnk_button.style.backgroundColor = '#232527';
            rlnk_button.style['border-radius'] = '8px';
            rlnk_button.style['margin-left'] = '8px';
            rlnk_button.style.border = 'none';
            rlnk_button.style.outline = 'none';
    
            rlnk_button.style.fontSize = '2rem';
    
            // browser.runtime.getURL() doesn't work somehow... so i had to use data uri
            var rlnk_image = document.createElement('img');
            rlnk_image.style.width = '36px';
            rlnk_image.style.transition = '2s ease-in-out';
            rlnk_image.src = "data:image/png;base64,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";
    
            rlnk_button.appendChild(rlnk_image);

            rlnk_button.title = "Left click to create a shortcut, right click for more (coming soon)!"
    
            rlnk_button.onclick = async () => {
    
                window.location.href = 
                    "rlnk://create/game/" + 
                    window.location.href.split(/\/+/)[3] + "/" + 
                    (await getCookie());
                
                rlnk_image.style.filter = 'hue-rotate(200deg) brightness(2)';
                rlnk_image.style.rotate = '360deg';
            }
    
            rlnk_button.oncontextmenu = (e) => {
                e.preventDefault();
                // TODO
                // add some nice context menu
            }
    
            document.getElementById('game-details-play-button-container').appendChild(rlnk_button);
            clearInterval(timer);
        }
    }, 100);
}

browser.runtime.onMessage.addListener((message, sender, sendResponse)=>{
    console.log(message);
    switch (message.key) {
        case 'reloadpage':
            window.location.reload(true);
    }
});

console.log('rlnk: loaded');