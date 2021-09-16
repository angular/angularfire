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

const { fetchCode } = require('./from-local');
const { processSnippet } = require('./snippets');
const prism = require('markdown-it-prism');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ html: true });
md.use(prism);

function embedInCodeticks(code) {
  return '```js\n' + code + '\n```';
}

// Usage: {% includecode github_path="firebase/snippets-web/snippets/auth-next/anonymous/auth_anon_sign_in.js" %}
const includecode = {
  name: "includecode",
  type: "addNunjucksAsyncShortcode",
  create({ github_path }) {
    return fetchCode(github_path)
      .then(processSnippet)
      .then(embedInCodeticks)
      .then(output => md.render(output));
  }
};

// Usage: {% codeswitcher eap_github_path="" current_github_path="" %}
const codeswitcher = {
  name: "codeswitcher",
  type: "addNunjucksAsyncShortcode",
  async create({ eap_github_path, current_github_path }) {    
    
    let eapCode = '';
    if(eap_github_path != undefined && eap_github_path !== '') {
      eapCode = await fetchCode(eap_github_path);
      eapCode = processSnippet(eapCode);
      eapCode = embedInCodeticks(eapCode);
      eapCode = md.render(eapCode);
      eapCode = eapCode.trim();
    }

    let currentCode = '';
    if(current_github_path != undefined && current_github_path !== '') {
      currentCode = await fetchCode(current_github_path);
      currentCode = processSnippet(currentCode);
      currentCode = embedInCodeticks(currentCode);
      currentCode = md.render(currentCode);
      eapCode = eapCode.trim();
    }
    const eapId = Math.random().toString(36).substring(7);
    const currentId = Math.random().toString(36).substring(7);
    return /*html*/`<eap-tab-switcher>
  <eap-tab-list role="tablist">
    <button aria-selected="true" id="aria-tab-${eapId}" data-panel="tabpanel-${eapId}" aria-controls="tabpanel-${eapId}">
      EAP Modular
    </button>
    <button id="aria-tab-${currentId}" data-panel="tabpanel-${currentId}" aria-controls="">
      v8 Current
    </button>
  </eap-tab-list>
  <eap-tab-panel-list>
    <eap-tab-panel id="tabpanel-${eapId}" aria-labelledby="aria-tab-${eapId}">${eapCode}</eap-tab-panel>
    <eap-tab-panel id="tabpanel-${currentId}" aria-labelledby="aria-tab-${currentId}" class="hidden">${currentCode}</eap-tab-panel>
  </eap-tab-panel-list>
</eap-tab-switcher>`;
  }
};

// Usage: {% commonexample title="" eap_github_path="" current_github_path=""  %}
const commonexample = {
  name: "commonexample",
  type: "addNunjucksAsyncShortcode",
  async create({ title, eap_github_path, current_github_path, github_path }) {
    const isEmpty = value => value == undefined || value === '';
    const isSwitcher = (!isEmpty(eap_github_path) || !isEmpty(github_path)) && !isEmpty(current_github_path);
    // TODO(davideast): Enable current_github_path as a single option
    const pathToUse = !isEmpty(github_path) ? github_path : eap_github_path;
    const codebox = isSwitcher ? 
       await codeswitcher.create({ eap_github_path: pathToUse, current_github_path }) :
       await includecode.create({ github_path: pathToUse });
    return md.render(`### ${title} 
${codebox}`);
  }
};

module.exports = { 
  shortcodes: [
    includecode,
    codeswitcher,
    commonexample,
  ]
};
