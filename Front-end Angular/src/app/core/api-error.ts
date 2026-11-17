import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  apiName = 'Laravel',
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 0) {
    return `Impossible de joindre l’API ${apiName}. Vérifiez que le serveur est démarré.`;
  }

  const body: unknown = error.error;
  if (body && typeof body === 'object') {
    const response = body as Record<string, unknown>;
    const errors = response['errors'];

    if (errors && typeof errors === 'object') {
      const firstError = Object.values(errors as Record<string, unknown>)
        .flatMap((messages) => Array.isArray(messages) ? messages : [])
        .find((message): message is string => typeof message === 'string');

      if (firstError) {
        return firstError;
      }
    }

    const message = response['message'];
    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}
