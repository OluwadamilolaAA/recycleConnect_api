import type { z } from "zod";

import type { registerSchema } from "./auth.schema.js";

export type RegisterInput = z.infer<typeof registerSchema>;