import { NativeModules, Platform } from 'react-native';

const API_PORT = 3000;
const ANDROID_EMULATOR_HOST = '10.0.2.2';
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function parseHostFromScriptUrl(scriptUrl: string | undefined): string | null {
  if (!scriptUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(scriptUrl);
    const host = parsedUrl.hostname.trim();
    if (host) {
      return host;
    }
  } catch {
    // Fall back to regex parsing for non-standard URLs.
  }

  const match = scriptUrl.match(/^https?:\/\/([^/:]+)/i);
  const host = match?.[1]?.trim();
  if (!host) {
    return null;
  }

  return host;
}

function getBundleHost(): string | null {
  const sourceCodeModule = NativeModules.SourceCode as
    | { scriptURL?: string }
    | undefined;

  return parseHostFromScriptUrl(sourceCodeModule?.scriptURL);
}

function resolveApiHost(): string {
  const bundleHost = getBundleHost();
  if (bundleHost) {
    if (Platform.OS === 'android' && LOOPBACK_HOSTS.has(bundleHost)) {
      return ANDROID_EMULATOR_HOST;
    }

    return bundleHost;
  }

  if (Platform.OS === 'android') {
    return ANDROID_EMULATOR_HOST;
  }

  return 'localhost';
}

export function getApiBaseUrl(): string {
  return `http://${resolveApiHost()}:${API_PORT}`;
}
