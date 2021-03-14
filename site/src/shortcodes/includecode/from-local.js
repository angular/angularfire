const { readFile } = require('fs');
const { resolve } = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(readFile);

function convertGitHubPathToLocal(githubPath) {
  return resolve(__dirname, '../../../repo_clones', githubPath);
}

async function fetchCode(githubPath = '') {
  let content = '';
  try {
    const localPath = convertGitHubPathToLocal(githubPath);
    content = await readFileAsync(localPath, 'utf-8');
  } catch(error) {
    console.error(error);
    content = 'File not found 😭'; 
  }
  return content;
}

module.exports = {
  fetchCode,
};
