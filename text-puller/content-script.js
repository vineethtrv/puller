

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

        image.onload = function () {
            ctx.drawImage(image, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
            // Crop the image
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = rectWidth;
            croppedCanvas.height = rectHeight;
            const croppedCtx = croppedCanvas.getContext('2d');
            croppedCtx.putImageData(imageData, (-1 * rectX), (-1 * rectY));
            const croppedImage = croppedCanvas.toDataURL();

            // printFrame();
            textFromImage(croppedImage);
        };
    }



    //textFromImage
    const textFromImage = (imageData) => {
        Tesseract.recognize(imageData).then(out => {
           let textFromBase64 = out.data.text;
            navigator.clipboard.writeText(textFromBase64).then(() => {
                //clipboard successfully set
                createNotification();
            }, () => {
                //clipboard write failed, use fallback
            });
        },error=>{
            console.log('Text Reg faild : ' , error)
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
    const createNotification = (e) => {
        const snapTextNotificationEl = document.createElement('div');
        snapTextNotificationEl.setAttribute('id', 'snapTextNotification');
        snapTextNotificationEl.innerHTML = `
            <img src="${chrome.runtime.getURL("/images/icon-128.png")}" />
            <div class="notification-text-holder">
                <h2>Text copied to clipboard </h2>
                <span>Now you can paste the text</span>
            </div> 
        `;
        document.querySelector('html').appendChild(snapTextNotificationEl);
        // Remove Notification
        setTimeout(() => {
            if (snapTextNotificationEl){
                // snapTextNotificationEl.remove();
            }
        }, 1600);
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



