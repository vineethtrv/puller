

(() => {

    let startX, startY, endX, endY, rectX, rectY , screenX , screenY, rectWidth, rectHeight;
    let isDrawingStart = false;

    // Crop image
    const cropImage = (imgDataUrl) => {
        const image = new Image();
        image.src = imgDataUrl;
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        const dpxr = window.devicePixelRatio;

        image.onload = function () {
            ctx.drawImage(image, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Crop the image
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = rectWidth * dpxr;
            croppedCanvas.height = rectHeight * dpxr;
            const croppedCtx = croppedCanvas.getContext('2d');
            croppedCtx.putImageData(imageData, (-1 * (rectX * dpxr)), (-1 * (rectY * dpxr)));
            const croppedImage = croppedCanvas.toDataURL();
            // Generate text from image
            textFromImage(croppedImage);
        };
    }



    //textFromImage
    const textFromImage = (imageData) => {

        createNotification('loading');

        Tesseract.recognize(imageData).then(out => {
           let textFromBase64 = out.data.text;
            navigator.clipboard.writeText(textFromBase64).then(() => {
                createNotification('success');
                //clipboard successfully set
            }, () => {
                //clipboard write failed, use fallback
                createNotification('error');
            });
        },error=>{
            console.log('Text Reg faild : ' , error);
            createNotification('error');
        });
    }


    // Set selection box size and position
    const selectAreaFromScreen = () => {
        rectWidth = startX < endX ? (endX - startX) : (startX - endX);
        rectHeight = startY < endY ? (endY - startY) : (startY - endY);
        rectX = startX < endX ? screenX : (screenX - rectWidth);
        rectY = startY < endY ? screenY : (screenY - rectHeight);
        document.getElementById('snapText-selection-box').style.cssText = `
            height: ${rectHeight}px;
            width: ${rectWidth}px;
            left: ${rectX}px;
            top: ${rectY}px;
        `;
    }

    // Remove selection box from the DOM
    const removeSelectionBox = ()=>{
        document.getElementById('selectionCover').remove();
    }

    // Handlers
    const selectionStart = (e) => {
        startX = e.pageX;
        startY = e.pageY;
        screenX = e.x;
        screenY = e.y;
        isDrawingStart = true;
    }
    const selectionMove = (e) => {
        if (!isDrawingStart){
            return
        }
        endX = e.pageX;
        endY = e.pageY;
        selectAreaFromScreen();
    }
    const selectionEnd = (e) => {
        if (!isDrawingStart) {
            return
        }
        endX = e.pageX;
        endY = e.pageY;
        isDrawingStart = false;
        selectAreaFromScreen();
        removeSelectionBox();
        // Send message to background js
        if (rectWidth > 4 && rectHeight > 4 ){
            chrome.runtime.sendMessage({ capturedData: true}, 
                (imageDataUrl)=>{
                cropImage(imageDataUrl)
            });
        }
    }

    // escape from the Selection box
    const escapeSelection = (e) => {
        if (e.code == "Escape" || e.key == "Escape" || e.keyCode == 27){
            removeSelectionBox();
       }
    }


    // Create Notification
    const createNotification = (notificationType) => {
        let snapTextNotificationEl = '';
        if(document.getElementById('snapTextNotification')){
            snapTextNotificationEl =  document.getElementById('snapTextNotification');
        } else {
            snapTextNotificationEl = document.createElement('div');
            snapTextNotificationEl.setAttribute('id', 'snapTextNotification');
            document.querySelector('html').appendChild(snapTextNotificationEl);
        }


        // Notification Type
        if(notificationType === 'success'){
            snapTextNotificationEl.innerHTML = `
                <img src="${chrome.runtime.getURL("/images/icon-128.png")}" />
                <div class="notification-text-holder">
                    <h2>Text copied to clipboard </h2>
                    <span>Now you can paste the text</span>
                </div> 
            `;
            removeNotification(snapTextNotificationEl);

        } else if (notificationType === 'error'){
            snapTextNotificationEl.innerHTML = `
                <img src="${chrome.runtime.getURL("/images/error-icon.png")}" />
                <div class="notification-text-holder">
                    <h2 class="notification-error-text">Faild to extract text</h2>
                    <span>Please try again</span>
                </div> 
            `;
            removeNotification(snapTextNotificationEl);
        } else {
            // Notification Loader 
            snapTextNotificationEl.classList.add('slideUp')
            snapTextNotificationEl.innerHTML = `
            <div class="snapText-loader-holder">
                <span class="snapText-loader"></span>
            </div>
            `
        }
    }    


    const removeNotification = (snapTextNotificationEl)=>{
        if (snapTextNotificationEl){
            snapTextNotificationEl.classList.add('slideDown')
            // Remove Notification
            setTimeout(() => {
                snapTextNotificationEl.remove();
            }, 1600);
        }
    }

    // Append selection on DOM 
    (() => {
        const SelectionCover = document.createElement('div');
        SelectionCover.setAttribute('id', 'selectionCover');
        SelectionCover.setAttribute('tabindex', 0);
        // Selection box
        const SelectionBox = document.createElement('div');
        SelectionBox.setAttribute('id', 'snapText-selection-box');
        SelectionCover.appendChild(SelectionBox);

        document.querySelector('html').appendChild(SelectionCover);
        SelectionCover.focus();
        // Event handlers for selection
        SelectionCover.onmousedown = selectionStart;
        SelectionCover.onmousemove = selectionMove;
        SelectionCover.onmouseup = selectionEnd;
        SelectionCover.onkeydown = escapeSelection;
    })();

})();



