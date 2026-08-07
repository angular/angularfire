import { ConnectorConfig } from './interfaces.js';
import {
  connectorConfigObjectLiteral,
  isValidPackageSpecifier,
  resolveDataConnectProviderConfig,
} from './utils.js';
import 'jasmine';

// eslint-disable-next-line @typescript-eslint/no-implied-eval
const evalObjectLiteral = (literal: string) => new Function(`return (${literal});`)();

describe('connectorConfigObjectLiteral', () => {

  it('escapes a quote-bearing value so it round-trips as inert string data', () => {
    const injectionAttempt = 'us-central1"; console.log("INJECTED"); const _z="x';
    const literal = connectorConfigObjectLiteral({
      location: injectionAttempt,
      connector: 'my-connector',
      service: 'my-service',
    } as ConnectorConfig);
    const evaluated = evalObjectLiteral(literal);
    expect(evaluated.location).toBe(injectionAttempt);
  });

  it('coerces a non-string value from an unquoted yaml scalar to a string', () => {
    const literal = connectorConfigObjectLiteral({
      location: 'us-central1',
      connector: 'my-connector',
      service: 123,
    } as unknown as ConnectorConfig);
    const evaluated = evalObjectLiteral(literal);
    expect(evaluated.service).toBe('123');
    expect(typeof evaluated.service).toBe('string');
  });

  it('coerces a boolean-like yaml scalar to a string', () => {
    const literal = connectorConfigObjectLiteral({
      location: 'us-central1',
      connector: true,
      service: 'my-service',
    } as unknown as ConnectorConfig);
    const evaluated = evalObjectLiteral(literal);
    expect(evaluated.connector).toBe('true');
    expect(typeof evaluated.connector).toBe('string');
  });

});

describe('isValidPackageSpecifier', () => {

  it('accepts a normal scoped package specifier', () => {
    expect(isValidPackageSpecifier('@my-org/my-connector')).toBeTrue();
  });

  it('rejects a value containing a double quote', () => {
    expect(isValidPackageSpecifier('foo"; console.log("INJECTED"); const _z="x')).toBeFalse();
  });

  it('rejects a value containing a backslash', () => {
    expect(isValidPackageSpecifier('foo\\bar')).toBeFalse();
  });

  it('rejects a value containing a newline', () => {
    expect(isValidPackageSpecifier('foo\nbar')).toBeFalse();
  });

});

describe('resolveDataConnectProviderConfig', () => {

  it('resolves to the connectorConfig object literal when there is no package', () => {
    const resolution = resolveDataConnectProviderConfig({
      connectorYaml: { connectorId: 'my-connector' },
      connectorConfig: {
        location: 'us-central1',
        connector: 'my-connector',
        service: 'my-service',
      },
    });
    expect(resolution.kind).toBe('literal');
  });

  it('resolves to an external import when package is a valid specifier', () => {
    const resolution = resolveDataConnectProviderConfig({
      connectorYaml: { connectorId: 'my-connector' },
      connectorConfig: {
        location: 'us-central1',
        connector: 'my-connector',
        service: 'my-service',
      },
      package: '@my-org/my-connector',
    });
    expect(resolution).toEqual({ kind: 'external', package: '@my-org/my-connector' });
  });

  it('falls back to the connectorConfig literal when package is not a valid specifier', () => {
    const resolution = resolveDataConnectProviderConfig({
      connectorYaml: { connectorId: 'my-connector' },
      connectorConfig: {
        location: 'us-central1',
        connector: 'my-connector',
        service: 'my-service',
      },
      package: 'foo"; console.log("INJECTED")',
    });
    expect(resolution.kind).toBe('literal');
  });

  it('does not throw and falls back to an empty literal when there is no javascriptSdk config', () => {
    expect(() => resolveDataConnectProviderConfig({
      connectorYaml: { connectorId: 'my-connector' },
    })).not.toThrow();
    expect(resolveDataConnectProviderConfig({
      connectorYaml: { connectorId: 'my-connector' },
    })).toEqual({ kind: 'literal', literal: '{}' });
  });

  it('does not throw and falls back to an empty literal when config is null', () => {
    expect(() => resolveDataConnectProviderConfig(null)).not.toThrow();
    expect(resolveDataConnectProviderConfig(null)).toEqual({ kind: 'literal', literal: '{}' });
  });

});
