const express = require('express');
const app = express();
const port = 3001;
const bodyParser = require('body-parser');
const T = require("tesseract.js");


const textFromImage = async (imageData)=>{
let textFromBase64;
  await T.recognize(imageData).then(out => {
      textFromBase64 = out.data.text;
    });
    return await textFromBase64;
}



// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


const readImage = async (req, res, next) => {

    if (!req.body.base64image) {
        return new Error('Invalid Request');
    }
    // to declare some path to store your converted image
    let matches = req.body.base64image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');
    let textFromImg;
    try {
        textFromImg = await textFromImage(req.body.base64image);

        console.log(textFromImg);
        return await res.send({
            "status": "success",
            "text": textFromImg
        });
    } catch (e) {
        next(e);
    }
}




app.post('/readImage', readImage)

app.listen(port, () => console.log(`Server is listening on port ${port}`))
