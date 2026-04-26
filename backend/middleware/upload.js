const multer = require('multer');

// Use memory storage to temporarily hold the file before passing to parsing services
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    // Restrict inputs to PDF and TXT
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT are allowed.'));
    }
  }
});

module.exports = upload;
