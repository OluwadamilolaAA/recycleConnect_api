import CustomAPIError from "./custom-error.js";

export default class UnauthorizedError extends CustomAPIError {
  constructor(message: string) {
    super(message, 401);
  }
}
