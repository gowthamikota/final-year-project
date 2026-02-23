const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      family: 4,
      retryWrites: true,
      w: 'majority'
    });
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Error in connection", err.message);
    process.exit(1);
  }
};

module.exports = {
  connectDb,
};
