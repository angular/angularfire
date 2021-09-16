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

const { parse } = require("@babel/parser")
const generate = require('@babel/generator').default;
const prettier = require("prettier");

function transform(githubCode) {
  const parsedAST = parse(githubCode, {
    sourceType: "module",
  });
  
  const isFirst = index => index === 0;
  
  parsedAST.program.body.forEach((statement, index) => {
  
    // The first set of lines usually have comments and we 
    // always want them removed
    if(isFirst(index)) {
      // Remove all comments before leading statement
      if(statement.leadingComments) {
        delete statement.leadingComments;
      }
    }
  
    // Find any [START] or [END]
    if(statement.leadingComments) {
      statement.leadingComments = statement.leadingComments.filter(comment => {
        return !comment.value.includes('[START') && !comment.value.includes('[END');
      });
    }
  
    // Remove any trailing comments because they likely should be
    // leading comments. Babel guesses where comments go and you can 
    // find a comment as both trailing and leading. This will likely
    // cause problems in the future, but right now it works with the
    // code samples we use.
    if(statement.trailingComments) {
      statement.trailingComments = [];
    }
  });
  
  const { code } = generate({
    type: "Program",
    // passing a new copy of the body to avoid
    // any reference problems
    body: parsedAST.program.body.slice(),
  });
  return prettier.format(code, { parser: "babel" });
}

module.exports = { transform };
