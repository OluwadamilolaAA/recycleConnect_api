import CustomAPIError from "./custom-error.js";

export default class BadRequestError extends CustomAPIError {
  constructor(message: string) {
    super(message, 400);
  }
}
