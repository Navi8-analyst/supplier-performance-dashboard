const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors.array()
    });
  }
  next();
};

// Auth validation rules
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Hotel validation rules
const validateHotel = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hotel name must be between 2 and 100 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  handleValidationErrors
];

// Room validation rules
const validateRoom = [
  body('hotelId')
    .isString()
    .notEmpty()
    .withMessage('Hotel ID is required'),
  body('type')
    .trim()
    .isIn(['Single', 'Double', 'Suite', 'Deluxe', 'Presidential'])
    .withMessage('Room type must be one of: Single, Double, Suite, Deluxe, Presidential'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('totalRooms')
    .isInt({ min: 1 })
    .withMessage('Total rooms must be at least 1'),
  body('availableRooms')
    .isInt({ min: 0 })
    .withMessage('Available rooms must be non-negative'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  handleValidationErrors
];

// Booking validation rules
const validateBooking = [
  body('roomId')
    .isString()
    .notEmpty()
    .withMessage('Room ID is required'),
  body('checkinDate')
    .isISO8601()
    .custom((value) => {
      const checkinDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (checkinDate < today) {
        throw new Error('Check-in date cannot be in the past');
      }
      return true;
    }),
  body('checkoutDate')
    .isISO8601()
    .custom((value, { req }) => {
      const checkoutDate = new Date(value);
      const checkinDate = new Date(req.body.checkinDate);
      if (checkoutDate <= checkinDate) {
        throw new Error('Check-out date must be after check-in date');
      }
      return true;
    }),
  body('guests')
    .isInt({ min: 1, max: 10 })
    .withMessage('Number of guests must be between 1 and 10'),
  handleValidationErrors
];

// Search validation rules
const validateSearch = [
  query('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  query('checkinDate')
    .optional()
    .isISO8601()
    .withMessage('Check-in date must be a valid date'),
  query('checkoutDate')
    .optional()
    .isISO8601()
    .withMessage('Check-out date must be a valid date'),
  query('guests')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Number of guests must be between 1 and 10'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be non-negative'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be non-negative'),
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// ID validation rules
const validateId = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('ID is required'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateHotel,
  validateRoom,
  validateBooking,
  validateSearch,
  validateId,
  handleValidationErrors
};