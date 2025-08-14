/*
 * Global network interceptor for React Native
 * Logs outgoing requests and incoming responses for fetch and XMLHttpRequest
 */

type InstallOptions = {
  logRequestHeaders?: boolean;
  logRequestBody?: boolean;
  logResponseHeaders?: boolean;
  logResponseBody?: boolean;
  bodyCharLimit?: number;
};

type LoggerConfig = {
  logRequestHeaders: boolean;
  logRequestBody: boolean;
  logResponseHeaders: boolean;
  logResponseBody: boolean;
  bodyCharLimit: number;
};

function safeSerializeBody(body: any, limit: number): string | undefined {
  try {
    if (body == null) return undefined;
    if (typeof body === 'string') return body.length > limit ? body.slice(0, limit) + '…[truncated]' : body;
    if (typeof body === 'object') {
      if (typeof FormData !== 'undefined' && body instanceof FormData) return '[FormData]';
      if (typeof Blob !== 'undefined' && body instanceof Blob) return `[Blob size=${body.size}]`;
      if (Array.isArray(body)) return JSON.stringify(body).slice(0, limit);
      return JSON.stringify(body).slice(0, limit);
    }
    return String(body).slice(0, limit);
  } catch {
    return '[Unserializable body]';
  }
}

function headersToObject(headers: any): Record<string, string> | undefined {
  try {
    const out: Record<string, string> = {};
    if (!headers) return undefined;
    if (typeof Headers !== 'undefined' && headers instanceof Headers) {
      headers.forEach((value: string, key: string) => {
        out[key] = value;
      });
      return out;
    }
    if (typeof headers === 'object') return headers as Record<string, string>;
    return undefined;
  } catch {
    return undefined;
  }
}

let installed = false;

export default function installNetworkLogger(options: InstallOptions = {}): void {
  if (installed) return;
  installed = true;

  const config: LoggerConfig = {
    logRequestHeaders: options.logRequestHeaders ?? true,
    logRequestBody: options.logRequestBody ?? true,
    logResponseHeaders: options.logResponseHeaders ?? false,
    logResponseBody: options.logResponseBody ?? false,
    bodyCharLimit: options.bodyCharLimit ?? 2000,
  };

  let requestCounter = 0;
  const nextRequestId = () => ++requestCounter;

  interceptFetch(config, nextRequestId);

  interceptXhr(config, nextRequestId);
}



function interceptFetch(config: LoggerConfig, getNextId: () => number): void {
  const originalFetch: typeof fetch | undefined = (global as any).fetch;
  if (!originalFetch) return;

  (global as any).fetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    const startTime = Date.now();
    const requestId = getNextId();

    let url: string = '';
    let method: string = 'GET';
    let headers: any;
    let body: any;

    try {
      ({ url, method, headers, body } = extractFetchRequestParts(input, init));
      const requestLog = buildFetchRequestLog(requestId, method, url, headers, body, config);
      // eslint-disable-next-line no-console
      console.log('[HTTP]', requestLog);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[HTTP] Failed to log request', { id: requestId, error: String(e) });
    }

    try {
      const response = await originalFetch(input as any, init as any);
      const durationMs = Date.now() - startTime;

      try {
        const responseLog = await buildFetchResponseLog(requestId, method, url, response, durationMs, config);
        // eslint-disable-next-line no-console
        console.log('[HTTP]', responseLog);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('[HTTP] Failed to log response', { id: requestId, error: String(e) });
      }

      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorLog = buildFetchErrorLog(requestId, method, url, durationMs, error);
      // eslint-disable-next-line no-console
      console.log('[HTTP]', errorLog);
      throw error;
    }
  };
}

function extractFetchRequestParts(input: RequestInfo, init?: RequestInit): { url: string; method: string; headers: any; body: any } {
  let url = '';
  let method = 'GET';
  let headers: any;
  let body: any;
  if (typeof input === 'string') {
    url = input;
    method = (init?.method || 'GET').toUpperCase();
    headers = init?.headers;
    body = init?.body as any;
  } else {
    url = input.url;
    method = (input.method || 'GET').toUpperCase();
    headers = init?.headers ?? (input as any).headers;
    body = init?.body ?? (input as any)._bodyInit ?? (input as any).body;
  }
  return { url, method, headers, body };
}

function buildFetchRequestLog(
  id: number,
  method: string,
  url: string,
  headers: any,
  body: any,
  config: LoggerConfig,
): any {
  const log: any = { id, direction: 'OUT', method, url };
  if (config.logRequestHeaders) log.headers = headersToObject(headers);
  if (config.logRequestBody) log.body = safeSerializeBody(body, config.bodyCharLimit);
  return log;
}

async function buildFetchResponseLog(
  id: number,
  method: string,
  url: string,
  response: Response,
  durationMs: number,
  config: LoggerConfig,
): Promise<any> {
  const cloned = response.clone();
  const log: any = {
    id,
    direction: 'IN',
    method,
    url,
    status: cloned.status,
    ok: cloned.ok,
    durationMs,
  };
  if (config.logResponseHeaders) log.headers = headersToObject((cloned as any).headers);
  if (config.logResponseBody) {
    const rawContentType = (cloned.headers && (cloned.headers as any).get)
      ? (cloned.headers as any).get('content-type')
      : undefined;
    const contentType = rawContentType ? String(rawContentType).toLowerCase() : '';

    const isBinaryLike =
      contentType.includes('image/') ||
      contentType.includes('audio/') ||
      contentType.includes('video/') ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('application/zip') ||
      contentType.includes('multipart/form-data');
    const isJsonLike = contentType.includes('application/json') || contentType.includes('+json') || contentType.includes('json');

    if (!isBinaryLike) {
      const text = await cloned.text();
      log.body = text.length > config.bodyCharLimit ? text.slice(0, config.bodyCharLimit) + '…[truncated]' : text;
      if (isJsonLike) {
        try {
          log.bodyJson = JSON.parse(text);
        } catch {
          // keep text-only body on parse errors
        }
      }
    } else {
      log.body = `[${contentType || 'binary'} body omitted]`;
    }
  }
  return log;
}

function buildFetchErrorLog(id: number, method: string, url: string, durationMs: number, error: any): any {
  return { id, direction: 'ERROR', method, url, durationMs, error: String(error) };
}

function interceptXhr(config: LoggerConfig, getNextId: () => number): void {
  const XHR: any = (global as any).XMLHttpRequest;
  if (!XHR || !XHR.prototype) return;

  const originalOpen = XHR.prototype.open;
  const originalSend = XHR.prototype.send;

  XHR.prototype.open = function(method: string, url: string, async?: boolean, user?: string, password?: string) {
    (this as any)._method = method ? method.toUpperCase() : 'GET';
    (this as any)._url = url;
    (this as any)._startTime = Date.now();
    return originalOpen.apply(this, arguments as any);
  };

  XHR.prototype.send = function(data?: any) {
    const requestIdLocal = getNextId();
    try {
      const reqLog: any = { id: requestIdLocal, direction: 'OUT', method: (this as any)._method, url: (this as any)._url };
      if (config.logRequestBody) reqLog.body = safeSerializeBody(data, config.bodyCharLimit);
      // eslint-disable-next-line no-console
      console.log('[HTTP]', reqLog);
    } catch {}

    const onReadyStateChange = () => {
      try {
        if (this.readyState === 4) {
          const durationMs = Date.now() - ((this as any)._startTime || Date.now());
          const resLog: any = {
            id: requestIdLocal,
            direction: 'IN',
            method: (this as any)._method,
            url: (this as any)._url,
            status: this.status,
            ok: this.status >= 200 && this.status < 300,
            durationMs,
          };
          if (config.logResponseBody) {
            const responseText: string = (this.responseText ?? '') as any;
            resLog.body = responseText.length > config.bodyCharLimit ? responseText.slice(0, config.bodyCharLimit) + '…[truncated]' : responseText;
            try {
              const contentTypeHeader = typeof this.getResponseHeader === 'function' ? this.getResponseHeader('content-type') : undefined;
              const ct = contentTypeHeader ? String(contentTypeHeader).toLowerCase() : '';
              if (ct.includes('application/json') || ct.includes('+json') || ct.includes('json')) {
                resLog.bodyJson = JSON.parse(responseText);
              }
            } catch {}
          }
          // eslint-disable-next-line no-console
          console.log('[HTTP]', resLog);
        }
      } catch {}
    };

    this.addEventListener('readystatechange', onReadyStateChange);
    return originalSend.apply(this, arguments as any);
  };
}

