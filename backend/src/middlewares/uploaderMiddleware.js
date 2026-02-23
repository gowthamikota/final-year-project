const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { parser } = require("../services/parser");
const resumeDataModel = require("../models/resumeParsedData");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage }).single("resume");

// Removed hardcoded fallback data - will throw proper error instead

async function uploader(req, res, next) {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer upload error:", err.message);
      return res
        .status(400)
        .json({ 
          success: false,
          error: "File upload failed", 
          details: err.message 
        });
    }

    try {
      const userId = req.user?._id;
      const filePath = req.file?.path;

      if (!filePath) {
        return res.status(400).json({ 
          success: false,
          error: "No file uploaded" 
        });
      }
    
      let parsed;
      try {
        parsed = await parser(filePath);
        console.log("Resume parsing completed with Python service");
      } catch (parseError) {
        console.error("Resume parsing failed:", parseError.message);
        throw new Error(`Resume parsing failed: ${parseError.message}. Ensure Python microservice is running.`);
      }
      
      const savedResume = await resumeDataModel.create({
        userId,
        ...parsed,
        filePath,
      });

      req.parsedResume = savedResume;
      next();
    } catch (error) {
      console.error("Error in uploader:", error.message);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
}

module.exports = { uploader };
