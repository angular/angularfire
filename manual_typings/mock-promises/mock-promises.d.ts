interface MockPromises {
  executeForPromise(p: Promise <any>): void;
  reset(): void;
  getMockPromise(p: any): any;
}

declare var mockPromises: MockPromises;

declare module 'mock-promises' {
	export = mockPromises;
}
