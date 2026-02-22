// const { fetchCodechef } = require("./services/platforms/codechefService");

// async function test() {
//   try {
//     const data = await fetchCodechef("balupasumarthi");
//     console.log("CodeChef Data:");
//     console.log(data);
//   } catch (err) {
//     console.error("Error:", err.message);
//   }
// }

// test();

const { fetchGithub } = require("./services/platforms/githubService");

async function test() {
  try {
    const data = await fetchGithub("Balu2200");
    console.log("GitHub Data:");
    console.log(data);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

test();


// const { fetchLeetcode } = require("./services/platforms/leetcodeService");

// async function test() {
//   try {
//     const data = await fetchLeetcode("BALU_PASUMARTHI3");
//     console.log("LeetCode Data:");
//     console.log(data);
//   } catch (err) {
//     console.error("Error:", err.response?.data || err.message);
//   }
// }

// test();