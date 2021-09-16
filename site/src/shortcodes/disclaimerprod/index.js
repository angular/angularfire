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

// Usage: {% disclaimerprod %}
const disclaimerprod = {
  name: "disclaimerprod",
  type: "addShortcode",
  create() {
    return `<div class="bg-yellow text-black p-8 rounded-lg shadow-lg text-base">
  <h4 class="uppercase tracking-wide font-bold mb-2 text-base">Beta Site!</h4>
  <p class="p-0 m-0">This is a brand new guide site that is in beta. During this time period we'd love to hear your feedback on our <a href="https://github.com/angular/angularfire/discussions" target="blank" rel="opener">GitHub Discussion board</a>. Please let us know what you think of the usability, content, and any ideas for improvement. All contributors are welcome!</p>
</div>`;
  }
}

module.exports = { 
  shortcodes: [
    disclaimerprod
  ]
};
