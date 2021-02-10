// Modified from: https://github.com/firebase/snippets-web/blob/master/scripts/separate-snippets.ts

// Regex for [START] and [END] snippet tags.
const RE_START_SNIPPET = /\[START\s+([A-Za-z_]+)\s*\]/;
const RE_END_SNIPPET = /\[END\s+([A-Za-z_]+)\s*\]/;

function isBlank(line) {
  return line.trim().length === 0;
}

/**
 * Change all [START foo] and [END foo] to be [START foosuffix] and [END foosuffix]
 */
function removeSectionsFromSnippet(lines/* string[]*/) {
  const outputLines = [];
  for (const line of lines) {
    if (!line.match(RE_START_SNIPPET) && !line.match(RE_END_SNIPPET)) {
      outputLines.push(line);
    }
  }
  return outputLines;
}

/**
 * Remove all left-padding so that the least indented line is left-aligned.
 */
function adjustIndentation(lines /*: string[]*/) {
  const nonBlankLines = lines.filter((l) => !isBlank(l));
  const indentSizes = nonBlankLines.map((l) => l.length - l.trimLeft().length);
  const minIndent = Math.min(...indentSizes);

  const outputLines = [];
  for (const line of lines) {
    if (isBlank(line)) {
      outputLines.push("");
    } else {
      outputLines.push(line.substr(minIndent));
    }
  }
  return outputLines;
}

/**
 * If the first line after leading comments is blank, remove it.
 */
function removeFirstLineAfterComments(lines /*: string[]*/) {
  const outputLines = [...lines];
  const firstNonComment = outputLines.findIndex(
    (l) => l.startsWith("// [START")
  );
  return outputLines.slice(firstNonComment, outputLines.length);
}

/**
 * Turns a series of source lines into a standalone snippet file by running
 * a series of transformations.
 *
 * @param cones the code containing the snippet (including START/END comments)
 */
function processSnippet(code /*: string[]*/) /*: string*/ {
  const lines = code.split('\n');
  let outputLines = [...lines];

  // Perform transformations individually, in order
  outputLines = removeFirstLineAfterComments(outputLines);
  outputLines = removeSectionsFromSnippet(outputLines);
  outputLines = adjustIndentation(outputLines);

  const content = [...outputLines].join("\n");
  return content;
}

module.exports = { processSnippet };
