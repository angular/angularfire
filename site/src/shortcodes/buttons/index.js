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

const linkButton = {
  name: "linkbutton",
  type: "addPairedShortcode",
  create (content, href, type='primary', external=false) {
    const primaryClass = `link-button inline-block shadow-lg bg-blue text-white text-lg uppercase font-bold font-display tracking-wide rounded-lg px-6 py-4 text-center`;
    const secondaryClass = `link-button inline-block shadow-lg bg-blue-200 text-black text-lg uppercase font-bold font-display tracking-wide rounded-lg px-6 py-4 text-center`;
    const cssClass = type === 'primary' ? primaryClass : secondaryClass;
    const externalAttrs = external ? 'rel="noopener" target="blank"' : '';
    return `<a class="${cssClass}" href="${href}" ${externalAttrs}>${content}</a>`;
  }
}

module.exports = {
  shortcodes: [
    linkButton,
  ]
};
