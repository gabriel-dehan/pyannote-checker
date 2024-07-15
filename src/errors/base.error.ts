// Additional information on errors that will be used for logging
export class BaseError extends Error {
  name: string;
  statusCode: number;

  constructor(message: string) {
    super(message);

    Object.defineProperty(this, 'name', {
      value: 'InternalServerError',
      configurable: true,
    });

    Object.defineProperty(this, 'statusCode', {
      value: 500,
      configurable: true,
    });
  }
}
