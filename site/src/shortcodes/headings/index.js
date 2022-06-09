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

// Usage: {% headingone %} My title! {% endheadingone %}
const headingOne = {
  name: "headingone",
  type: "addPairedShortcode",
  create (content) {
    return `<h1 class="text-5xl font-bold leading-snug mb-2">${ content }</h1>`
  }
};

const subHeading = {
  name: "subheading",
  type: "addPairedShortcode",
  create (content) {
    return `<div class="text-3xl font-display mb-8 text-grey-300">${content}</div>`;
  }
};

module.exports = {
  shortcodes: [
    headingOne,
    subHeading,
  ]
};

