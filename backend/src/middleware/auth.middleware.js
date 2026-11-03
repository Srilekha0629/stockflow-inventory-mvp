import jwt from 'jsonwebtoken';

/**
 * Authentication middleware that verifies JWT from Authorization header.
 * Attaches decoded user payload ({ userId, organizationId, email }) to req.user.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET || 'stockflow_dev_secret_key_2026';
    const decoded = jwt.verify(token, jwtSecret);

    // Verify token contains required claims
    if (!decoded.userId || !decoded.organizationId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token structure. Missing organization context.',
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};
