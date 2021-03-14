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

const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const prism = require('markdown-it-prism');

module.exports = eleventyConfig => {
  eleventyConfig.setUseGitIgnore(false);
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  eleventyConfig.addWatchTarget("./_tmp/style.css");
  eleventyConfig.addPassthroughCopy({ "./src/styles/prism.css": "./prism.css"});
  eleventyConfig.addPassthroughCopy({ "./src/js/**/*.js": "./js"});
  eleventyConfig.addPassthroughCopy({ "./_tmp/style.css": "./style.css" });
  eleventyConfig.setLibrary("md", configureMarkdownIt());

  registerShortcodes(eleventyConfig);

  return {
    dir: {
      input: "src",
      output: "public"
    },
    templateFormats: [
      "md",
      "njk",
      "html",
      "svg",
      "woff2",
      "ico",
    ],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};

function configureMarkdownIt() {
  return require("markdown-it")({
    html: true,
    linkify: true,
    replaceLink: function rewriteRelativeLinks (link, env) {
      // TODO(davideast): Create readable expressions or matches
      // for this if statement tree.
      if (link.indexOf('./') !== -1) {
        link = link.replace('./', '/reference/');
        if (link === '/reference/index') {
          link = '/reference';
        }
        if (link === '/reference/firestore') {
          link = '/reference/firestore_';
        }
      }
      return link;
    }
  }).use(require('markdown-it-attrs'))
    // https://github.com/markdown-it/markdown-it-container/issues/23
    .use(require('markdown-it-container'), 'dynamic', {
      validate: function () { return true; },
      render: function (tokens, idx) {
        const token = tokens[idx];
        if (token.nesting === 1) {
          return '<div class="' + token.info.trim() + '">';
        } else {
          return '</div>';
        }
      },
    })
    .use(require('markdown-it-replace-link'))
    .use(prism);
}

function registerShortcodes(eleventyConfig) {
  const { shortcodes } = require('./src/shortcodes');
  shortcodes.forEach(shortcode => {
    console.log(`Creating shortcode: ${shortcode.name} as ${shortcode.type}`);
    eleventyConfig[shortcode.type](shortcode.name, shortcode.create);
  });
}
