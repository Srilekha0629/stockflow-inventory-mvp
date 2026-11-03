import { registerUserAndOrganization } from '../services/auth.service.js';

/**
 * Handles user registration and organization creation.
 * POST /api/auth/signup
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, organizationName } = req.body;

    // 1. Presence validation
    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, password, organizationName.',
      });
    }

    // 2. Type validation
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof organizationName !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field types. All fields must be strings.',
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOrg = organizationName.trim();

    // 3. Length validation for name and organization
    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long.',
      });
    }

    if (trimmedOrg.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Organization name must be at least 2 characters long.',
      });
    }

    // 4. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 5. Password minimum length validation (enforce at least 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // 6. Execute atomic creation via service
    const registrationResult = await registerUserAndOrganization({
      name: trimmedName,
      email: trimmedEmail,
      password,
      organizationName: trimmedOrg,
    });

    return res.status(201).json({
      success: true,
      message: 'User and organization registered successfully.',
      data: registrationResult,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
