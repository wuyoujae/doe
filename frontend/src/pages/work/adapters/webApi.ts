/** Shared error shape used by the original editor's local image picker. */
export class WebApiRequestError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'WebApiRequestError';
  }
}
