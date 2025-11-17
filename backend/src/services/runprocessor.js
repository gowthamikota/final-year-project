const { execFile } = require("child_process");
const path = require("path");

function runPreprocessor(userId) {
    return new Promise((resolve, reject) => {
        const script = path.join(__dirname, "../python/preprocess.py");

        execFile("python", [script, userId], (error, stdout, stderr) => {
            if (error) {
                console.log("Preprocessor Error:", stderr || error.message);
                return reject(error);
            }

            try {
                const out = JSON.parse(stdout);
                resolve(out);
            } catch (err) {
                reject("Invalid JSON from preprocess.py");
            }
        });
    });
}

module.exports = { runPreprocessor };
