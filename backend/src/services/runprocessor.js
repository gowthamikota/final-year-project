const { execFile } = require("child_process");
const path = require("path");

function runPreprocessor(userId) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, "../python/preprocess.py");

  
    const pythonPath = path.join(
      __dirname,
      "../python/venv/Scripts/python.exe"
    );

    execFile(pythonPath, [script, userId], (error, stdout, stderr) => {
      console.log("PYTHON STDOUT:", stdout);
      console.log("PYTHON STDERR:", stderr);

      if (error) {
        return reject(error);
      }

      try {
        const out = JSON.parse(stdout);
        resolve(out);
      } catch (err) {
        reject(new Error("Invalid JSON from preprocess.py: " + stdout));
      }
    });
  });
}

module.exports = { runPreprocessor };
