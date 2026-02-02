import { Request } from 'express-serve-static-core';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
