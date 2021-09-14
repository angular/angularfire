import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { setupProject } from '@angular/fire/schematics/setup';
import 'jasmine';
import { join as pathJoin } from 'path';
import { FEATURES, PROJECT_TYPE } from './interfaces';

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

function generatePackageJson() {
  return {
    name: 'foo',
    private: true,
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
  },
  \"projects\": {
    \"default\": \"pirojok-111e3\"
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
          \"options\": {
            \"prerender\": false,
            \"ssr\": false,
            \"firebaseProject\": \"pirojok-111e3\"
          }
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
  },
  \"projects\": {
    \"default\": \"pirojok-111e3\"
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
          \"options\": {
            \"prerender\": false,
            \"ssr\": false,
            \"firebaseProject\": \"pirojok-111e3\"
          }
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
  },
  \"projects\": {
    \"default\": \"bi-catch-you-77e7e\"
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
          \"options\": {
            \"prerender": false,
            \"ssr\": false,
            \"firebaseProject\": \"pirojok-111e3\"
          }
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
          \"options\": {
            \"prerender\": false,
            \"ssr\": false,
            \"firebaseProject\": \"bi-catch-you-77e7e\"
          }
        }
      }
    }
  }
}`;

const universalFirebaseJson = {
  hosting: [{
    target: 'pie-ka-chu',
    public: 'dist/ikachu',
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
        function: 'ssr_pie-ka-chu'
      }
    ]
  }],
  functions: {
    source: 'dist/pie-ka-chu/functions'
  }
};

describe('ng-add', () => {
  describe('generating files', () => {
    let tree: Tree;

    beforeEach(() => {
      tree = Tree.empty();
      tree.create('angular.json', JSON.stringify(generateAngularJson()));
      tree.create('package.json', JSON.stringify(generatePackageJson()));
    });

    it('generates new files if starting from scratch', async () => {
      const result = await setupProject(tree, {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: FIREBASE_PROJECT } as any,
        projectType: PROJECT_TYPE.Static,
        project: PROJECT_NAME,
        prerender: false,
      });
      expect(result.read('firebase.json').toString()).toEqual(initialFirebaseJson);
      expect(result.read('.firebaserc').toString()).toEqual(initialFirebaserc);
      expect(result.read('angular.json').toString()).toEqual(initialAngularJson);
    });

    it('uses default project', async () => {
      const result = await setupProject(tree, {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: FIREBASE_PROJECT } as any,
        projectType: PROJECT_TYPE.Static,
        project: undefined,
        prerender: false,
      });
      expect(result.read('firebase.json').toString()).toEqual(overwriteFirebaseJson);
      expect(result.read('.firebaserc').toString()).toEqual(overwriteFirebaserc);
      expect(result.read('angular.json').toString()).toEqual(overwriteAngularJson);
    });

    it('overrides existing files', async () => {
      const tempTree = await setupProject(tree, {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: FIREBASE_PROJECT } as any,
        projectType: PROJECT_TYPE.Static,
        project: PROJECT_NAME,
        prerender: false,
      });
      const result = await setupProject(tree, {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: OTHER_FIREBASE_PROJECT_NAME } as any,
        projectType: PROJECT_TYPE.Static,
        project: OTHER_PROJECT_NAME,
        prerender: false,
      });
      expect(result.read('firebase.json').toString()).toEqual(projectFirebaseJson);
      expect(result.read('.firebaserc').toString()).toEqual(projectFirebaserc);
      expect(result.read('angular.json').toString()).toEqual(projectAngularJson);
    });
  });

  describe('error handling', () => {
    it('fails if project not defined', async () => {
      const tree = Tree.empty();
      const angularJSON = generateAngularJson();
      delete angularJSON.defaultProject;
      tree.create('angular.json', JSON.stringify(angularJSON));
      tree.create('package.json', JSON.stringify(generatePackageJson()));
      await expectAsync(setupProject(tree, {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: FIREBASE_PROJECT } as any,
        projectType: PROJECT_TYPE.Static,
        project: undefined,
        prerender: false,
      })).toBeRejectedWith(
        new SchematicsException('No Angular project selected and no default project in the workspace')
      );
    });

    it('Should throw if angular.json not found', async () => {
      await expectAsync(setupProject(Tree.empty(), {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: FIREBASE_PROJECT } as any,
        projectType: PROJECT_TYPE.Static,
        project: PROJECT_NAME,
        prerender: false,
      })).toBeRejectedWith(new SchematicsException('Could not find angular.json'));
    });

    it('Should throw if angular.json  can not be parsed', async () => {
      const tree = Tree.empty();
      tree.create('angular.json', 'hi');
      tree.create('package.json', JSON.stringify(generatePackageJson()));
      await expectAsync(setupProject(tree, {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: FIREBASE_PROJECT } as any,
        projectType: PROJECT_TYPE.Static,
        project: PROJECT_NAME,
        prerender: false,
      })).toBeRejectedWith(new SchematicsException('Could not parse angular.json'));
    });

    it('Should throw if specified project does not exist ', async () => {
      const tree = Tree.empty();
      tree.create('angular.json', JSON.stringify({ projects: {} }));
      tree.create('package.json', JSON.stringify(generatePackageJson()));
      await expectAsync(setupProject(tree, {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: FIREBASE_PROJECT } as any,
        projectType: PROJECT_TYPE.Static,
        project: PROJECT_NAME,
        prerender: false,
      })).toBeRejectedWith(new SchematicsException('The specified Angular project is not defined in this workspace'));
    });

    it('Should throw if specified project is not application', async () => {
      const tree = Tree.empty();
      tree.create(
        'angular.json',
        JSON.stringify({
          projects: { [PROJECT_NAME]: { projectType: 'pokemon' } }
        })
      );
      tree.create('package.json', JSON.stringify(generatePackageJson()));
      await expectAsync(setupProject(tree, {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: FIREBASE_PROJECT } as any,
        projectType: PROJECT_TYPE.Static,
        project: PROJECT_NAME,
        prerender: false,
      })).toBeRejectedWith(new SchematicsException('Deploy requires an Angular project type of "application" in angular.json'));
    });

    it('Should throw if app does not have architect configured', async () => {
      const tree = Tree.empty();
      tree.create(
        'angular.json',
        JSON.stringify({
          projects: { [PROJECT_NAME]: { projectType: 'application' } }
        })
      );
      tree.create('package.json', JSON.stringify(generatePackageJson()));
      await expectAsync(setupProject(tree, {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: FIREBASE_PROJECT } as any,
        projectType: PROJECT_TYPE.Static,
        project: PROJECT_NAME,
        prerender: false,
      })).toBeRejectedWith(
        new SchematicsException('Cannot read the output path (architect.build.options.outputPath) of the Angular project "pie-ka-chu" in angular.json')
      );
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
      tree.create('package.json', JSON.stringify(generatePackageJson()));
      tree.create('.firebaserc', `I'm broken 😔`);
      await expectAsync(setupProject(tree, {} as any, [FEATURES.Hosting], {
        firebaseProject: { projectId: FIREBASE_PROJECT } as any,
        projectType: PROJECT_TYPE.Static,
        project: PROJECT_NAME,
        prerender: false,
      })).toBeRejectedWith(
        new SchematicsException('Error when parsing .firebaserc: Unexpected token I in JSON at position 0')
      );
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
        tree.create('package.json', JSON.stringify(generatePackageJson()));

        await expectAsync(setupProject(tree, {} as any, [FEATURES.Hosting], {
          firebaseProject: { projectId: FIREBASE_PROJECT } as any,
          projectType: PROJECT_TYPE.CloudFunctions,
          project: PROJECT_NAME,
          prerender: false,
        })).toBeRejectedWith(
          new SchematicsException('Cannot read the output path (architect.server.options.outputPath) of the Angular project "pie-ka-chu" in angular.json')
        );
      });

      it('should add a @angular/fire builder', async () => {
        const tree = Tree.empty();
        tree.create('angular.json', JSON.stringify(generateAngularJsonWithServer()));
        tree.create('package.json', JSON.stringify(generatePackageJson()));

        // TODO mock addTask
        const result = await setupProject(tree, {addTask: () => {}} as any, [FEATURES.Hosting], {
          firebaseProject: { projectId: FIREBASE_PROJECT } as any,
          projectType: PROJECT_TYPE.CloudFunctions,
          project: PROJECT_NAME,
          prerender: false,
        });

        const workspace = JSON.parse((await result.read('angular.json')).toString());
        expect(workspace.projects['pie-ka-chu'].architect.deploy.options.ssr).toEqual('cloud-functions');
      });

      it('should configure firebase.json', async () => {
        const tree = Tree.empty();
        tree.create('angular.json', JSON.stringify(generateAngularJsonWithServer()));
        tree.create('package.json', JSON.stringify(generatePackageJson()));

        // TODO mock addTask
        const result = await setupProject(tree, {addTask: () => {}} as any, [FEATURES.Hosting], {
          firebaseProject: { projectId: FIREBASE_PROJECT } as any,
          projectType: PROJECT_TYPE.CloudFunctions,
          project: PROJECT_NAME,
          prerender: false,
        });

        const firebaseJson = JSON.parse((await result.read('firebase.json')).toString());
        expect(firebaseJson).toEqual(universalFirebaseJson);
      });
    });
  });
});
