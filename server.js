
const express = require('express');
const multer = require('multer');
const path = require('path');
const Tesseract = require('tesseract.js');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
app.use(express.json());

// Set storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

// Check file type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images only!');
    }
}

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Upload image route
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.json({ message: err });
        } else {
            if (req.file == undefined) {
                res.json({ message: 'Error: No file selected!' });
            } else {
                // Perform OCR using Tesseract
                Tesseract.recognize(req.file.path, 'eng', { logger: e => console.log(e) })
                    .then(out => {
                        if (out && out.data && out.data.text) {
                            var recognizedText = out.data.text;
                            // Remove the character at index 0
                            recognizedText = recognizedText.replace(/[^a-zA-Z0-9]/g, '');
                            // Call API with modified recognized text
                            callAPI(recognizedText, res);
                        } else {
                            res.json({ message: 'No text recognized.' });
                        }
                    })
                    .catch(err => {
                        console.error('Tesseract Error:', err);
                        res.json({ message: 'Error recognizing text.' });
                    });
            }
        }
    });
});

// Function to call the API
async function callAPI(regNo, res) {
    const options = {
        method: 'POST',
        url: 'https://rto-vehicle-information-verification-india.p.rapidapi.com/api/v1/rc/vehicleinfo',
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': '952659701amsh985387c5fbd45eep1f2a80jsn53547a72f9fb',
            'X-RapidAPI-Host': 'rto-vehicle-information-verification-india.p.rapidapi.com'
          },
        data: {
            reg_no: regNo,
            consent: 'Y',
            consent_text: 'I hereby declare my consent agreement for fetching my information via AITAN Labs API'
        }
    };

    try {
        const response = await axios.request(options);
        // Send the extracted data back to the client
        res.json({ message: 'API response:', vehicleInfo: extractData(response.data) });
    } catch (error) {
        console.error(error);
        res.json({ message: 'Error calling API.' });
    }
}

// Extract only the required data from the API response
function extractData(apiResponse) {
    return {
        reg_no: apiResponse.result.reg_no,
        reg_date: apiResponse.result.reg_date,
        owner_name: apiResponse.result.owner_name,
        model: apiResponse.result.model,
        engine_no: apiResponse.result.engine_no
    };
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


