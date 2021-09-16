/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fetch = require("node-fetch");

function convertToGitHubApiUrl(githubPath) {
  const urlPieces = githubPath.split('/');
  const [user, repo] = urlPieces.slice(0, 2);
  // TODO(davideast): Don't hardcode main branch
  const githubApiUrl = [user, repo, 'master', ...urlPieces.slice(2, urlPieces.length)].join('/');
  return `https://raw.githubusercontent.com/${githubApiUrl}`;
}

async function fetchCode(githubPath) {
  const githubApiUrl = convertToGitHubApiUrl(githubPath);
  const response = await fetch(githubApiUrl);
  return response.text();
}

module.exports = { fetchCode };
