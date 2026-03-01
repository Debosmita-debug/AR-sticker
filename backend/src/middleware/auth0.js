import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import logger from '../utils/logger.js';

const auth0Domain = process.env.AUTH0_DOMAIN || '';
const auth0Audience = process.env.AUTH0_AUDIENCE || 'http://localhost:5000';

// Create JWKS client for Auth0
const client = auth0Domain ? jwksClient({
  jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
}) : null;

/**
 * Verify Auth0 JWT token
 * Extracts public key from Auth0 and verifies the token
 */
async function verifyToken(token) {
  if (!client) {
    logger.warn('[Auth0] JWKS client not initialized - Auth0 not configured');
    return null;
  }

  try {
    // Get the key id from the token header
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    const keyId = decoded.header.kid;
    if (!keyId) {
      throw new Error('No key ID in token header');
    }

    // Get the public key from Auth0
    const key = await client.getSigningKey(keyId);
    const publicKey = key.getPublicKey();

    // Verify the token
    const verified = jwt.verify(token, publicKey, {
      audience: auth0Audience,
      issuer: `https://${auth0Domain}/`,
      algorithms: ['RS256'],
    });

    logger.info(`[Auth0] ✓ Token verified for user: ${verified.sub}`);
    return verified;
  } catch (error) {
    logger.warn(`[Auth0] Token verification failed: ${error.message}`);
    return null;
  }
}

/**
 * Express middleware to check Auth0 JWT token
 * Usage: app.use('/api/protected', auth0Middleware);
 */
export const auth0Middleware = async (req, res, next) => {
  if (!client) {
    // Auth0 not configured - skip middleware
    logger.debug('[Auth0] Skipping auth - not configured');
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_AUTH',
          message: 'Missing or invalid authorization header. Use: Authorization: Bearer <token>',
        },
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const verified = await verifyToken(token);

    if (!verified) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }

    // Attach user info to request
    req.user = {
      id: verified.sub,
      email: verified.email,
      name: verified.name,
    };

    next();
  } catch (error) {
    logger.error(`[Auth0 Middleware] Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
      },
    });
  }
};

/**
 * Optional middleware - doesn't block if token is missing/invalid
 * Extracts user info if valid token is present
 */
export const auth0OptionalMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const verified = await verifyToken(token);
      if (verified) {
        req.user = {
          id: verified.sub,
          email: verified.email,
          name: verified.name,
        };
      }
    }
  } catch (error) {
    logger.debug(`[Auth0 Optional] No auth: ${error.message}`);
  }
  next();
};

/**
 * Check if Auth0 is configured
 */
export function isAuth0Configured() {
  return Boolean(auth0Domain && client);
}

export default {
  verifyToken,
  auth0Middleware,
  auth0OptionalMiddleware,
  isAuth0Configured,
};
