import { Tree } from '@angular-devkit/schematics';
import { setupProject } from './add/setup';
import 'jasmine';
import { join as pathJoin } from 'path';

const PROJECT_NAME = 'pie-ka-chu';
const PROJECT_ROOT = 'pirojok';
const FIREBASE_PROJECT = 'pirojok-111e3';
const OTHER_PROJECT_NAME = 'pi-catch-you';
const OTHER_FIREBASE_PROJECT_NAME = 'bi-catch-you-77e7e';

function generateAngularJson() {
  return {
    defaultProject: PROJECT_NAME,
    projects: {
      [PROJECT_NAME]: {
        projectType: 'application',
        root: PROJECT_ROOT,
        architect: {
          build: {
            options: {
              outputPath: 'dist/ikachu'
            }
          }
        }
      },
      [OTHER_PROJECT_NAME]: {
        projectType: 'application',
        root: PROJECT_ROOT,
        architect: {
          build: {
            options: {
              outputPath: 'dist/ikachu'
            }
          }
        }
      }
    }
  };
}

function generateAngularJsonWithServer() {
  return {
    defaultProject: PROJECT_NAME,
    projects: {
      [PROJECT_NAME]: {
        projectType: 'application',
        root: PROJECT_ROOT,
        architect: {
          build: {
            options: {
              outputPath: 'dist/ikachu'
            }
          },
          server: {
            options: {
              outputPath: 'dist/server'
            }
          }
        }
      },
      [OTHER_PROJECT_NAME]: {
        projectType: 'application',
        root: PROJECT_ROOT,
        architect: {
          build: {
            options: {
              outputPath: 'dist/ikachu'
            }
          },
          server: {
            options: {
              outputPath: 'dist/server'
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
        \"**/.*\"
      ],
      \"headers\": [
        {
          \"source\": \"*.[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].+(css|js)\",
          \"headers\": [
            {
              \"key\": \"Cache-Control\",
              \"value\": \"public,max-age=31536000,immutable\"
            }
          ]
        }
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
        \"**/.*\"
      ],
      \"headers\": [
        {
          \"source\": \"*.[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].+(css|js)\",
          \"headers\": [
            {
              \"key\": \"Cache-Control\",
              \"value\": \"public,max-age=31536000,immutable\"
            }
          ]
        }
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
        \"**/.*\"
      ],
      \"headers\": [
        {
          \"source\": \"*.[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].+(css|js)\",
          \"headers\": [
            {
              \"key\": \"Cache-Control\",
              \"value\": \"public,max-age=31536000,immutable\"
            }
          ]
        }
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
        \"**/.*\"
      ],
      \"headers\": [
        {
          \"source\": \"*.[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].+(css|js)\",
          \"headers\": [
            {
              \"key\": \"Cache-Control\",
              \"value\": \"public,max-age=31536000,immutable\"
            }
          ]
        }
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

const universalFirebaseJson = {
  hosting: [{
    target: 'pie-ka-chu',
    public: pathJoin('dist', 'dist', 'ikachu'),
    ignore: [
      '**/.*'
    ],
    headers: [{
      source: '*.[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].+(css|js)',
      headers: [{
        key: 'Cache-Control',
        value: 'public,max-age=31536000,immutable'
      }]
    }],
    rewrites: [
      {
        source: '**',
        function: 'ssr'
      }
    ]
  }],
  functions: {
    source: 'dist'
  }
};

describe('ng-add', () => {
  describe('generating files', () => {
    let tree: Tree;

    beforeEach(() => {
      tree = Tree.empty();
      tree.create('angular.json', JSON.stringify(generateAngularJson()));
    });

    it('generates new files if starting from scratch', async () => {
      const result = await setupProject(tree, {
        firebaseProject: FIREBASE_PROJECT,
        universalProject: false,
        project: PROJECT_NAME
      });
      expect(result.read('firebase.json').toString()).toEqual(initialFirebaseJson);
      expect(result.read('.firebaserc').toString()).toEqual(initialFirebaserc);
      expect(result.read('angular.json').toString()).toEqual(initialAngularJson);
    });

    it('uses default project', async () => {
      const result = await setupProject(tree, {
        firebaseProject: FIREBASE_PROJECT,
        universalProject: false,
        project: undefined
      });
      expect(result.read('firebase.json').toString()).toEqual(overwriteFirebaseJson);
      expect(result.read('.firebaserc').toString()).toEqual(overwriteFirebaserc);
      expect(result.read('angular.json').toString()).toEqual(overwriteAngularJson);
    });

    it('overrides existing files', async () => {
      const tempTree = await setupProject(tree, {
        firebaseProject: FIREBASE_PROJECT,
        universalProject: false, project: PROJECT_NAME
      });
      const result = await setupProject(tempTree, {
        firebaseProject: OTHER_FIREBASE_PROJECT_NAME,
        project: OTHER_PROJECT_NAME,
        universalProject: false
      });
      expect(result.read('firebase.json').toString()).toEqual(projectFirebaseJson);
      expect(result.read('.firebaserc').toString()).toEqual(projectFirebaserc);
      expect(result.read('angular.json').toString()).toEqual(projectAngularJson);
    });
  });

  describe('error handling', () => {
    it('fails if project not defined', () => {
      const tree = Tree.empty();
      const angularJSON = generateAngularJson();
      delete angularJSON.defaultProject;
      tree.create('angular.json', JSON.stringify(angularJSON));
      expect(() =>
        setupProject(tree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: undefined
        })
      ).toThrowError(
        /No Angular project selected and no default project in the workspace/
      );
    });

    it('Should throw if angular.json not found', async () => {
      expect(() =>
        setupProject(Tree.empty(), {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: PROJECT_NAME
        })
      ).toThrowError(/Could not find angular.json/);
    });

    it('Should throw if angular.json  can not be parsed', async () => {
      const tree = Tree.empty();
      tree.create('angular.json', 'hi');
      expect(() =>
        setupProject(tree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: PROJECT_NAME
        })
      ).toThrowError(/Could not parse angular.json/);
    });

    it('Should throw if specified project does not exist ', async () => {
      const tree = Tree.empty();
      tree.create('angular.json', JSON.stringify({ projects: {} }));
      expect(() =>
        setupProject(tree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: PROJECT_NAME
        })
      ).toThrowError(/The specified Angular project is not defined in this workspace/);
    });

    it('Should throw if specified project is not application', async () => {
      const tree = Tree.empty();
      tree.create(
        'angular.json',
        JSON.stringify({
          projects: { [PROJECT_NAME]: { projectType: 'pokemon' } }
        })
      );
      expect(() =>
        setupProject(tree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: PROJECT_NAME
        })
      ).toThrowError(/Deploy requires an Angular project type of "application" in angular.json/);
    });

    it('Should throw if app does not have architect configured', async () => {
      const tree = Tree.empty();
      tree.create(
        'angular.json',
        JSON.stringify({
          projects: { [PROJECT_NAME]: { projectType: 'application' } }
        })
      );
      expect(() =>
        setupProject(tree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: PROJECT_NAME
        })
      ).toThrowError(/Cannot read the output path/);
    });

    /* TODO do something other than throw
    it('Should throw if firebase.json has the project already', async () => {
      const tree = Tree.empty();
      tree.create('angular.json', JSON.stringify(generateAngularJson()));
      const tempTree = await setupProject(tree, {
        firebaseProject: FIREBASE_PROJECT,
        universalProject: false,
        project: PROJECT_NAME
      });

      expect(() =>
        setupProject(tempTree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: PROJECT_NAME
        })
      ).toThrowError(/already exists in firebase.json/);
    });

    it('Should throw if firebase.json is broken', async () => {
      const tree = Tree.empty();
      tree.create('angular.json', JSON.stringify(generateAngularJson()));
      tree.create('firebase.json', `I'm broken 😔`);
      expect(() =>
        setupProject(tree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: PROJECT_NAME
        })
      ).toThrowError(/firebase.json: Unexpected token/);
    });*/

    it('Should throw if .firebaserc is broken', async () => {
      const tree = Tree.empty();
      tree.create('angular.json', JSON.stringify(generateAngularJson()));
      tree.create('.firebaserc', `I'm broken 😔`);
      expect(() =>
        setupProject(tree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: PROJECT_NAME
        })
      ).toThrowError(/.firebaserc: Unexpected token/);
    });

    /* TODO do something else

    it('Should throw if firebase.json has the project already', async () => {
      const tree = Tree.empty();
      tree.create('angular.json', JSON.stringify(generateAngularJson()));
      const tempTree = await setupProject(tree, {
        firebaseProject: FIREBASE_PROJECT,
        universalProject: false,
        project: PROJECT_NAME
      });

      expect(() =>
        setupProject(tempTree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: OTHER_PROJECT_NAME
        })
      ).toThrowError(/ already defined in .firebaserc/);
    });

    it('Should throw if firebase.json is broken', async () => {
      const tree = Tree.empty();
      tree.create('angular.json', JSON.stringify(generateAngularJson()));

      const tempTree = await setupProject(tree, {
        firebaseProject: FIREBASE_PROJECT,
        universalProject: false,
        project: PROJECT_NAME
      });

      expect(() =>
        setupProject(tempTree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: false,
          project: OTHER_PROJECT_NAME
        })
      ).toThrowError(/ already defined in .firebaserc/);
    }); */

    describe('universal app', () => {
      it('should fail without a server project', async () => {
        const tree = Tree.empty();
        tree.create('angular.json', JSON.stringify(generateAngularJson()));

        expect(() => setupProject(tree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: true,
          project: PROJECT_NAME
        })).toThrowError(/\(architect.server.options.outputPath\) of the Angular project "pie-ka-chu" in angular.json/);
      });

      it('should add a @angular/fire builder', async () => {
        const tree = Tree.empty();
        tree.create('angular.json', JSON.stringify(generateAngularJsonWithServer()));

        const result = await setupProject(tree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: true,
          project: PROJECT_NAME
        });

        const workspace = JSON.parse((await result.read('angular.json')).toString());
        expect(workspace.projects['pie-ka-chu'].architect.deploy.options.ssr).toBeTrue();
      });

      it('should configure firebase.json', async () => {
        const tree = Tree.empty();
        tree.create('angular.json', JSON.stringify(generateAngularJsonWithServer()));

        const result = await setupProject(tree, {
          firebaseProject: FIREBASE_PROJECT,
          universalProject: true,
          project: PROJECT_NAME
        });

        const firebaseJson = JSON.parse((await result.read('firebase.json')).toString());
        expect(firebaseJson).toEqual(universalFirebaseJson);
      });
    });
  });
});
