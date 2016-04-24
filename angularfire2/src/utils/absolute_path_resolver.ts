export function absolutePathResolver (rootUrl:string, providedPath:string): string {
  return providedPath.indexOf('/') === 0 ? `${rootUrl}${providedPath}` : providedPath;
}
