const axios = require("axios");
require("dotenv").config();

async function fetchGithub(username) {
  const headers = {
    "User-Agent": "Mozilla/5.0",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  };

  const { data: user } = await axios.get(
    `https://api.github.com/users/${username}`,
    { headers }
  );


  const { data: repos } = await axios.get(
    `https://api.github.com/users/${username}/repos?per_page=100`,
    { headers }
  );

  let totalStars = 0;
  let totalForks = 0;
  const languageMap = {};

  for (const repo of repos) {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;

    if (repo.language) {
      languageMap[repo.language] =
        (languageMap[repo.language] || 0) + 1;
    }
  }

  const { data: prData } = await axios.get(
    `https://api.github.com/search/issues?q=author:${username}+type:pr`,
    { headers }
  );

  const { data: issueData } = await axios.get(
    `https://api.github.com/search/issues?q=author:${username}+type:issue`,
    { headers }
  );

  const sortedLanguages = Object.entries(languageMap)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([lang]) => lang);

    return {
      name: user.name || "",
      followers: user.followers || 0,
      publicRepos: user.public_repos || 0,
      totalStars,
      totalForks,
      totalPRs: prData.total_count || 0,
      totalIssues: issueData.total_count || 0,
      topLanguages: sortedLanguages,
    };
}

module.exports = { fetchGithub };