const { execFile } = require("child_process");
const path = require("path");

function parser(filePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../python/resumeparser.py");

    execFile("python", [scriptPath, filePath], (error, stdout, stderr) => {
      if (error) {
        console.error("Python Error:", stderr || error.message);
        return reject(error);
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        reject("Invalid JSON output from resume parser");
      }
    });
  });
}

module.exports = { parser };
