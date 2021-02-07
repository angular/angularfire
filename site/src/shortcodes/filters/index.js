const console = require('console');
const { resolve } = require('path');

const findByName = {
  name: "findByName",
  type: "addNunjucksFilter",
  create(list, name) {
    return list.find((item) => item.name === name);
  }
};

const log = {
  name: "log",
  type: "addNunjucksFilter",
  create(object, logName) {
    console.log(logName, object);
    return object;
  }
};

const json = {
  name: "json",
  type: "addNunjucksFilter",
  create(object, spacer = 3) {
    let cache = [];
    const json = JSON.stringify(
      object,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (cache.includes(value)) {
            return;
          }
          cache.push(value);
        }
        return value;
      },
      spacer
    );
    cache = null;
    return json;
  }
};

const findPreviousEntry = {
  name: "findPreviousEntry",
  type: "addNunjucksFilter",
  create(children, eleventyNavigation) {
    const itemIndex = children.findIndex(entry => entry.key === eleventyNavigation.key);
    const previousIndex = itemIndex - 1;
    return children[previousIndex];
  }
};

const findNextEntry = {
  name: "findNextEntry",
  type: "addNunjucksFilter",
  create(children, eleventyNavigation) {
    const itemIndex = children.findIndex(entry => entry.key === eleventyNavigation.key);
    const nextIndex = itemIndex + 1;
    return children[nextIndex];
  }
};

/**
 * This filter reads the custom navigation in the global _data/ folder
 * and merges it with the eleventyNavigation config. Eleventy Navigation
 * works great for parent folders but it's less good for child navigation
 * when it comes to "next/prev" routing. This allows us to keep the good
 * parts of Eleventy Navigation and have a custom child path routing.
 * 
 * Eventually I'd like to customize Eleventy Navigation to do child routing
 * because this is extremely inefficient to loop over nav for every page. It
 * doesn't effect this build too bad though.
 */
const mergeNavigation = {
  name: "mergeNavigation",
  type: "addNunjucksFilter",
  create(eleventyNavigation) {
    const customNavigation = require(resolve(__dirname, '../../_data/nextprev.json'));
    const customKeys = Object.keys(customNavigation);
    console.log(eleventyNavigation);
    customKeys.forEach(key => {
      console.log('key: ', key);
      const eleventyNavMatch = eleventyNavigation.find(item => item.key === key);
      console.log('eleventyNavMatch: ', eleventyNavMatch)
      if(eleventyNavMatch != undefined) {
        const matchKids = eleventyNavMatch.children;
        const newKids = customNavigation[key].children.map(child => {
          return matchKids.find(c => c.key === child.key);
        });
        eleventyNavigation.find(item => item.key === key).children = newKids;
      }
    });
    console.log(eleventyNavigation);
    return eleventyNavigation;
  }  
}

module.exports = {
  shortcodes: [
    findByName,
    log,
    json,
    findPreviousEntry,
    findNextEntry,
    mergeNavigation,
  ],
};
