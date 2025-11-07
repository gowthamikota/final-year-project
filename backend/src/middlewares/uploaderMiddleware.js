const multer = require("multer");
const path = require("path");
const { parser } = require("../services/parser");
const resumeDataModel = require("../models/resumeParsedData");


const storage = multer.diskStorage({
    destination: (req, file, db) => {
        cb(null, path.join(__dirname, "../uploads/"));
    },
    filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
})

const upload = multer({ storage }).single("resume");


async function uploader(req, res, next) {
    upload(res, req, async(err) =>{
      if (err) return res.status(400).json({ error: "File upload failed", details: err.message });

      try {
        const userId = req.user?._id || "674A9C000000000000000000";

        const filePath = req.file?.path;

        if (!filePath)
          return res.status(400).json({ error: "No file uploaded" });
        
        console.log("📄 Resume uploaded:", filePath);

        const parsed = await parser(filePath);
        console.log("Resumer parsing completed");

        const savedResumer = await resumeDataModel.create({
          userId,
          ...parsed,
          filePath,
        })

        req.parsedResume = savedResume;
        next();
        
      }
      catch (error) {
        console.error("Error in uploader:", error.message);
        res.status(500).json({ error: error.message });
      }
    })
}

module.exports = { uploader };

