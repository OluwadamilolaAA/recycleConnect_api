import CustomAPIError from "./custom-error.js";

export default class ForbiddenError extends CustomAPIError {
  constructor(message: string) {
    super(message, 403);
  }
}
