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

const { readdirSync, lstatSync } = require('fs');
const { resolve } = require('path');

/**
 * This sets up the shortcodes plugin to dynamically register
 * any shortcode in this directory, as long as it is is in 
 * its own directory, exported in an index.js with an exports
 * of an array of shortcodes.
 * 
 * Example:
 *  / shortcodes
 *   / includecode
 *     + index.js
 *         module.exports = { shortcodes: [...] }
 */

const shortcodes = readdirSync(__dirname)
  .map(relativePath => resolve(__dirname, relativePath))
  .filter(absolutePath => lstatSync(absolutePath).isDirectory())
  .map(path => require(path).shortcodes)
  .flat();

module.exports = {
  shortcodes
};
