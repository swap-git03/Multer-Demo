const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 7000;

// Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ Upload route (handles both single and multiple files)
app.post('/upload', (req, res, next) => {
  const uploader = upload.any(); // accept any field name
  uploader(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrls = req.files.map(
      (file) => `http://localhost:${port}/uploads/${file.filename}`
    );

    res.json({
      msg: 'File(s) uploaded successfully',
      total: req.files.length,
      images: imageUrls,
    });
  });
});

// Serve static files
app.use('/uploads', express.static(uploadDir));

// Get single image
app.get('/image/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Get all uploaded images
app.get('/images', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to scan upload directory' });
    }

    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    const imageUrls = imageFiles.map(
      (file) => `http://localhost:${port}/uploads/${file}`
    );

    res.json({
      total: imageUrls.length,
      images: imageUrls,
    });
  });
});

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () =>
  console.log(`✅ Server running at http://localhost:${port}`)
);
