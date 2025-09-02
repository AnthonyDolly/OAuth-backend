import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

export function validate(schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate((req as any)[property], { abortEarly: false, stripUnknown: true, convert: true });
    if (error) {
      return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.details });
    }
    // Don't try to overwrite req.query as it's read-only in Express
    // For body and params, we can safely overwrite
    if (property === 'query') {
      // Store validated query params in a separate property
      (req as any).validatedQuery = value;
    } else {
      (req as any)[property] = value;
    }
    next();
  };
}

// Validate multiple request properties (params, body, query)
export function validateMultiple(schemas: { params?: Joi.ObjectSchema; body?: Joi.ObjectSchema; query?: Joi.ObjectSchema }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: any[] = [];
    
    // Validate params if schema provided
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, { abortEarly: false, stripUnknown: true, convert: true });
      if (error) {
        errors.push(...error.details);
      } else {
        req.params = value;
      }
    }
    
    // Validate body if schema provided
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, { abortEarly: false, stripUnknown: true, convert: true });
      if (error) {
        errors.push(...error.details);
      } else {
        req.body = value;
      }
    }
    
    // Validate query if schema provided
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, { abortEarly: false, stripUnknown: true, convert: true });
      if (error) {
        errors.push(...error.details);
      }
      // Don't try to overwrite req.query as it's read-only in Express
      // Store validated query params in a separate property
      (req as any).validatedQuery = value;
    }
    
    if (errors.length > 0) {
      return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors });
    }
    
    next();
  };
}


