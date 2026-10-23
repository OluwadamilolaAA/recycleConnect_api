import CustomAPIError from "./custom-error.js";

export default class ConflictError extends CustomAPIError {
  constructor(message: string) {
    super(message, 409);
  }
}
