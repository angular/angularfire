import { projectFromRc } from './utils';

describe('projectFromRc()', () => {
  it('Given `projects.default`, should return default project', () => {
    const FIRE_BASE_RC = `{
      "targets": {
        "project_prod": {
          "hosting": {
            "app_1": [
              "target_1_prod"
            ],
            "app_2": [
              "target_2_prod"
            ]
          }
        },
        "project_stg": {
          "hosting": {
            "app_1": [
              "target_1_stg"
            ],
            "app_2": [
              "target_2_stg"
            ]
          }
        }
      },
      "projects": {
        "default": "project_stg"
      }
    }`;
    expect(projectFromRc(JSON.parse(FIRE_BASE_RC), 'app_1')).toEqual(['project_stg', 'target_1_stg']);
  });

  it('Given no `projects.default`, should return first matched project', () => {
    const FIRE_BASE_RC = `{
      "targets": {
        "project_prod": {
          "hosting": {
            "app_1": [
              "target_1_prod"
            ],
            "app_2": [
              "target_2_prod"
            ]
          }
        },
        "project_stg": {
          "hosting": {
            "app_1": [
              "target_1_stg"
            ],
            "app_2": [
              "target_2_stg"
            ]
          }
        }
      }
    }`;
    expect(projectFromRc(JSON.parse(FIRE_BASE_RC), 'app_1')).toEqual(['project_prod', 'target_1_prod']);
  });

  it('Given empty targets, return [undefined, undefined]', () => {
    const FIRE_BASE_RC = `{
      "targets": {}
    }`;
    expect(projectFromRc(JSON.parse(FIRE_BASE_RC), 'app_1')).toEqual([undefined, undefined]);
  });
});
