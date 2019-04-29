import { Tree } from "@angular-devkit/schematics";
import { ngAdd } from "./ng-add";

const PROJECT_NAME = "pie-ka-chu";
const PROJECT_ROOT = "pirojok";
const FIREBASE_PROJECT = "pirojok-111e3";

const OTHER_PROJECT_NAME = "pi-catch-you";
const OTHER_FIREBASE_PROJECT_NAME = "bi-catch-you-77e7e";

describe("ng-add", () => {
  describe("generating files", () => {
    let tree: Tree;

    beforeEach(() => {
      tree = Tree.empty();
      tree.create("angular.json", JSON.stringify(generateAngularJson()));
    });

    it('generates new files if starting from scratch', async () => {
      const result = ngAdd(tree, {firebaseProject: FIREBASE_PROJECT, project: PROJECT_NAME});
      expect(result.read('firebase.json')!.toString()).toEqual(initialFirebaseJson);
      expect(result.read('.firebaserc')!.toString()).toEqual(initialFirebaserc);
      expect(result.read('angular.json')!.toString()).toEqual(initialAngularJson);
    });

    it('uses default project', async () => {
      const result = ngAdd(tree, {firebaseProject: FIREBASE_PROJECT});
      expect(result.read('firebase.json')!.toString()).toEqual(overwriteFirebaseJson);
      expect(result.read('.firebaserc')!.toString()).toEqual(overwriteFirebaserc);
      expect(result.read('angular.json')!.toString()).toEqual(overwriteAngularJson);
    });

    it('overrides existing files', async () => {
      const tempTree = ngAdd(tree, {firebaseProject: FIREBASE_PROJECT, project: PROJECT_NAME});
      const result = ngAdd(tempTree, {firebaseProject: OTHER_FIREBASE_PROJECT_NAME, project: OTHER_PROJECT_NAME});
      expect(result.read('firebase.json')!.toString()).toEqual(projectFirebaseJson);
      expect(result.read('.firebaserc')!.toString()).toEqual(projectFirebaserc);
      expect(result.read('angular.json')!.toString()).toEqual(projectAngularJson);
    });
  });

  describe("error handling", () => {
    it("fails if project not defined", () => {
      const tree = Tree.empty();
      const angularJSON = generateAngularJson();
      delete angularJSON.defaultProject;
      tree.create("angular.json", JSON.stringify(angularJSON));
      expect(() =>
        ngAdd(tree, {
          firebaseProject: FIREBASE_PROJECT,
          project: ""
        })
      ).toThrowError(
        /No project selected and no default project in the workspace/
      );
    });

    it("Should throw if angular.json not found", async () => {
      expect(() =>
        ngAdd(Tree.empty(), {
          firebaseProject: FIREBASE_PROJECT,
          project: PROJECT_NAME
        })
      ).toThrowError(/Could not find angular.json/);
    });

    it("Should throw if angular.json  can not be parsed", async () => {
      const tree = Tree.empty();
      tree.create("angular.json", "hi");
      expect(() =>
        ngAdd(tree, {
          firebaseProject: FIREBASE_PROJECT,
          project: PROJECT_NAME
        })
      ).toThrowError(/Could not parse angular.json/);
    });

    it("Should throw if specified project does not exist ", async () => {
      const tree = Tree.empty();
      tree.create("angular.json", JSON.stringify({ projects: {} }));
      expect(() =>
        ngAdd(tree, {
          firebaseProject: FIREBASE_PROJECT,
          project: PROJECT_NAME
        })
      ).toThrowError(/Project is not defined in this workspace/);
    });

    it("Should throw if specified project is not application", async () => {
      const tree = Tree.empty();
      tree.create(
        "angular.json",
        JSON.stringify({
          projects: { [PROJECT_NAME]: { projectType: "pokemon" } }
        })
      );
      expect(() =>
        ngAdd(tree, {
          firebaseProject: FIREBASE_PROJECT,
          project: PROJECT_NAME
        })
      ).toThrowError(/Deploy requires a project type of "application"/);
    });

    it("Should throw if app does not have architect configured", async () => {
      const tree = Tree.empty();
      tree.create(
        "angular.json",
        JSON.stringify({
          projects: { [PROJECT_NAME]: { projectType: "application" } }
        })
      );
      expect(() =>
        ngAdd(tree, {
          firebaseProject: FIREBASE_PROJECT,
          project: PROJECT_NAME
        })
      ).toThrowError(/Cannot read the output path/);
    });

    it("Should throw if firebase.json has the project already", async () => {
      const tree = Tree.empty();
      tree.create("angular.json", JSON.stringify(generateAngularJson()));
      const tempTree = ngAdd(tree, {
        firebaseProject: FIREBASE_PROJECT,
        project: PROJECT_NAME
      });

      expect(() =>
        ngAdd(tempTree, {
          firebaseProject: FIREBASE_PROJECT,
          project: PROJECT_NAME
        })
      ).toThrowError(/already exists in firebase.json/);
    });

    it("Should throw if firebase.json is broken", async () => {
      const tree = Tree.empty();
      tree.create("angular.json", JSON.stringify(generateAngularJson()));
      tree.create("firebase.json", "I'm broken 😔");
      expect(() =>
        ngAdd(tree, {
          firebaseProject: FIREBASE_PROJECT,
          project: PROJECT_NAME
        })
      ).toThrowError(/firebase.json: Unexpected token/);
    });

    it("Should throw if .firebaserc is broken", async () => {
      const tree = Tree.empty();
      tree.create("angular.json", JSON.stringify(generateAngularJson()));
      tree.create(".firebaserc", "I'm broken 😔");
      expect(() =>
        ngAdd(tree, {
          firebaseProject: FIREBASE_PROJECT,
          project: PROJECT_NAME
        })
      ).toThrowError(/.firebaserc: Unexpected token/);
    });

    it("Should throw if firebase.json has the project already", async () => {
      const tree = Tree.empty();
      tree.create("angular.json", JSON.stringify(generateAngularJson()));
      const tempTree = ngAdd(tree, {
        firebaseProject: FIREBASE_PROJECT,
        project: PROJECT_NAME
      });

      expect(() =>
        ngAdd(tempTree, {
          firebaseProject: FIREBASE_PROJECT,
          project: OTHER_PROJECT_NAME
        })
      ).toThrowError(/ already defined in .firebaserc/);
    });

    it("Should throw if firebase.json is broken", async () => {
      const tree = Tree.empty();
      tree.create("angular.json", JSON.stringify(generateAngularJson()));

      const tempTree = ngAdd(tree, {
        firebaseProject: FIREBASE_PROJECT,
        project: PROJECT_NAME
      });

      expect(() =>
        ngAdd(tempTree, {
          firebaseProject: FIREBASE_PROJECT,
          project: OTHER_PROJECT_NAME
        })
      ).toThrowError(/ already defined in .firebaserc/);
    });
  });
});

function generateAngularJson() {
  return {
    defaultProject: PROJECT_NAME,
    projects: {
      [PROJECT_NAME]: {
        projectType: "application",
        root: PROJECT_ROOT,
        architect: {
          build: {
            options: {
              outputPath: "dist/ikachu"
            }
          }
        }
      },
      [OTHER_PROJECT_NAME]: {
        projectType: "application",
        root: PROJECT_ROOT,
        architect: {
          build: {
            options: {
              outputPath: "dist/ikachu"
            }
          }
        }
      }
    }
  };
}

const initialFirebaseJson = `{
  \"hosting\": [
    {
      \"target\": \"pie-ka-chu\",
      \"public\": \"dist/ikachu\",
      \"ignore\": [
        \"firebase.json\",
        \"**/.*\",
        \"**/node_modules/**\"
      ],
      \"rewrites\": [
        {
          \"source\": \"**\",
          \"destination\": \"/index.html\"
        }
      ]
    }
  ]
}`;

const initialFirebaserc = `{
  \"targets\": {
    \"pirojok-111e3\": {
      \"hosting\": {
        \"pie-ka-chu\": [
          \"pirojok-111e3\"
        ]
      }
    }
  }
}`;

const initialAngularJson = `{
  \"defaultProject\": \"pie-ka-chu\",
  \"projects\": {
    \"pie-ka-chu\": {
      \"projectType\": \"application\",
      \"root\": \"pirojok\",
      \"architect\": {
        \"build\": {
          \"options\": {
            \"outputPath\": \"dist/ikachu\"
          }
        },
        \"deploy\": {
          \"builder\": \"@angular/fire:deploy\",
          \"options\": {}
        }
      }
    },
    \"pi-catch-you\": {
      \"projectType\": \"application\",
      \"root\": \"pirojok\",
      \"architect\": {
        \"build\": {
          \"options\": {
            \"outputPath\": \"dist/ikachu\"
          }
        }
      }
    }
  }
}`;

const overwriteFirebaseJson = `{
  \"hosting\": [
    {
      \"target\": \"pie-ka-chu\",
      \"public\": \"dist/ikachu\",
      \"ignore\": [
        \"firebase.json\",
        \"**/.*\",
        \"**/node_modules/**\"
      ],
      \"rewrites\": [
        {
          \"source\": \"**\",
          \"destination\": \"/index.html\"
        }
      ]
    }
  ]
}`;

const overwriteFirebaserc = `{
  \"targets\": {
    \"pirojok-111e3\": {
      \"hosting\": {
        \"pie-ka-chu\": [
          \"pirojok-111e3\"
        ]
      }
    }
  }
}`;

const overwriteAngularJson = `{
  \"defaultProject\": \"pie-ka-chu\",
  \"projects\": {
    \"pie-ka-chu\": {
      \"projectType\": \"application\",
      \"root\": \"pirojok\",
      \"architect\": {
        \"build\": {
          \"options\": {
            \"outputPath\": \"dist/ikachu\"
          }
        },
        \"deploy\": {
          \"builder\": \"@angular/fire:deploy\",
          \"options\": {}
        }
      }
    },
    \"pi-catch-you\": {
      \"projectType\": \"application\",
      \"root\": \"pirojok\",
      \"architect\": {
        \"build\": {
          \"options\": {
            \"outputPath\": \"dist/ikachu\"
          }
        }
      }
    }
  }
}`;

const projectFirebaseJson = `{
  \"hosting\": [
    {
      \"target\": \"pie-ka-chu\",
      \"public\": \"dist/ikachu\",
      \"ignore\": [
        \"firebase.json\",
        \"**/.*\",
        \"**/node_modules/**\"
      ],
      \"rewrites\": [
        {
          \"source\": \"**\",
          \"destination\": \"/index.html\"
        }
      ]
    },
    {
      \"target\": \"pi-catch-you\",
      \"public\": \"dist/ikachu\",
      \"ignore\": [
        \"firebase.json\",
        \"**/.*\",
        \"**/node_modules/**\"
      ],
      \"rewrites\": [
        {
          \"source\": \"**\",
          \"destination\": \"/index.html\"
        }
      ]
    }
  ]
}`;

const projectFirebaserc = `{
  \"targets\": {
    \"pirojok-111e3\": {
      \"hosting\": {
        \"pie-ka-chu\": [
          \"pirojok-111e3\"
        ]
      }
    },
    \"bi-catch-you-77e7e\": {
      \"hosting\": {
        \"pi-catch-you\": [
          \"bi-catch-you-77e7e\"
        ]
      }
    }
  }
}`;

const projectAngularJson = `{
  \"defaultProject\": \"pie-ka-chu\",
  \"projects\": {
    \"pie-ka-chu\": {
      \"projectType\": \"application\",
      \"root\": \"pirojok\",
      \"architect\": {
        \"build\": {
          \"options\": {
            \"outputPath\": \"dist/ikachu\"
          }
        },
        \"deploy\": {
          \"builder\": \"@angular/fire:deploy\",
          \"options\": {}
        }
      }
    },
    \"pi-catch-you\": {
      \"projectType\": \"application\",
      \"root\": \"pirojok\",
      \"architect\": {
        \"build\": {
          \"options\": {
            \"outputPath\": \"dist/ikachu\"
          }
        },
        \"deploy\": {
          \"builder\": \"@angular/fire:deploy\",
          \"options\": {}
        }
      }
    }
  }
}`;
