const axios = require("axios");

async function fetchCodeforces(username) {
  try {
    const res = await axios.get(
      `https://codeforces.com/api/user.info?handles=${username}`
    );

    const user = res.data.result[0];

    return {
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || "",
      maxRank: user.maxRank || "",
    };
  } catch {
    return {
      rating: 0,
      maxRating: 0,
      rank: "",
      maxRank: "",
    };
  }
}

module.exports = { fetchCodeforces };