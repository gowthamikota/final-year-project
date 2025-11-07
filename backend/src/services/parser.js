const { execFile } = require("child_process");

async function parser(filePath) {
  return new Promise((resolve, reject) => {
    execFile(
      "python3",
      ["./python/resumeparser.py", filePath],
      (error, stdout, stderr) => {
        if (error) return reject(stderr || error.message);
        try {
          const parsedData = JSON.parse(stdout);
          resolve(parsedData);
        } catch (err) {
          reject("Invalid JSON output from resume parser");
        }
      }
    );
  });
}
