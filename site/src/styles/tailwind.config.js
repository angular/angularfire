/**
 * Copyright 2021 Google LLC
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
module.exports = {
  purge: [
    "src/**/*.njk",
    "src/**/*.md",
    "src/**/*.js",
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      body: ['Roboto', 'Arial', 'sans-serif'],
      display: ['Google Sans', 'Arial', 'sans-serif'],
      mono: ['Roboto Mono', 'monospace'],
    },
    extend: {
      colors: {
        'black': 'hsl(0 0% 0% / 87%)',
        'blue-200': 'hsl(214 82% 50% / 7%)',
        'blue': 'hsl(214 82% 50%)',
        'navy': '#283142',
        'grey': '#DADCE0',
        'grey-200': '#ECEFF1',
        'grey-300': 'hsl(0 0% 0% / 54%)',
        'grey-600': 'hsl(213 5% 39% / 1)',
        'grey-700': 'hsl(213 5% 19% / 1)',
        'yellow': 'hsl(37 100% 94%)',
        'orange': "#FF8F00",
        'green': '#6CFF38',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}