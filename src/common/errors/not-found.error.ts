import CustomAPIError from "./custom-error.js";

export default class NotFoundError extends CustomAPIError {
  constructor(message: string) {
    super(message, 404);
  }
}
