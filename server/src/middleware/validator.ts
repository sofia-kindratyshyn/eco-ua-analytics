import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../utils/errors";

export function validateRequest(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        next(
          new ValidationError(`Validation error: ${JSON.stringify(messages)}`)
        );
      } else {
        next(error);
      }
    }
  };
}
