const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBooking, validateId } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Create new booking
router.post('/', authenticateToken, validateBooking, async (req, res) => {
  try {
    const { roomId, checkinDate, checkoutDate, guests } = req.body;
    const userId = req.user.id;

    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);

    // Calculate number of nights
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));

    // Get room details
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({
        error: 'Room Not Found',
        message: 'Room not found'
      });
    }

    // Check availability
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        OR: [
          {
            AND: [
              { checkinDate: { lte: checkin } },
              { checkoutDate: { gte: checkin } }
            ]
          },
          {
            AND: [
              { checkinDate: { lte: checkout } },
              { checkoutDate: { gte: checkout } }
            ]
          },
          {
            AND: [
              { checkinDate: { gte: checkin } },
              { checkoutDate: { lte: checkout } }
            ]
          }
        ]
      }
    });

    const bookedRooms = conflictingBookings.length;
    const availableRooms = room.availableRooms - bookedRooms;

    if (availableRooms <= 0) {
      return res.status(400).json({
        error: 'Room Not Available',
        message: 'Room is not available for the selected dates'
      });
    }

    // Calculate total price
    const totalPrice = room.price * nights;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        roomId,
        checkinDate: checkin,
        checkoutDate: checkout,
        totalPrice,
        guests,
        status: 'PENDING'
      },
      include: {
        room: {
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create booking'
    });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: {
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                rating: true
              }
            }
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalBookings = await prisma.booking.count({ where });

    res.json({
      message: 'Bookings retrieved successfully',
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalBookings,
        pages: Math.ceil(totalBookings / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Bookings retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve bookings'
    });
  }
});

// Get all bookings (Admin only)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, hotelId, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status.toUpperCase();
    }
    if (hotelId) {
      where.room = {
        hotelId
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: {
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                rating: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalBookings = await prisma.booking.count({ where });

    res.json({
      message: 'All bookings retrieved successfully',
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalBookings,
        pages: Math.ceil(totalBookings / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('All bookings retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve all bookings'
    });
  }
});

// Get booking by ID
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                rating: true,
                description: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking Not Found',
        message: 'Booking not found'
      });
    }

    // Check if user can access this booking
    if (userRole !== 'ADMIN' && booking.userId !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only view your own bookings'
      });
    }

    res.json({
      message: 'Booking retrieved successfully',
      booking
    });
  } catch (error) {
    console.error('Booking retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve booking'
    });
  }
});

// Update booking status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid Status',
        message: 'Status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED'
      });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        room: {
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                rating: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Booking Not Found',
        message: 'Booking not found'
      });
    }
    console.error('Booking status update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update booking status'
    });
  }
});

// Cancel booking (User can cancel their own booking)
router.put('/:id/cancel', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get booking first to check ownership
    const existingBooking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!existingBooking) {
      return res.status(404).json({
        error: 'Booking Not Found',
        message: 'Booking not found'
      });
    }

    // Check if user can cancel this booking
    if (userRole !== 'ADMIN' && existingBooking.userId !== userId) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'You can only cancel your own bookings'
      });
    }

    // Check if booking can be cancelled
    if (existingBooking.status === 'CANCELLED') {
      return res.status(400).json({
        error: 'Already Cancelled',
        message: 'Booking is already cancelled'
      });
    }

    if (existingBooking.status === 'COMPLETED') {
      return res.status(400).json({
        error: 'Cannot Cancel',
        message: 'Cannot cancel a completed booking'
      });
    }

    // Update booking status to cancelled
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        room: {
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                rating: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel booking'
    });
  }
});

// Get booking statistics (Admin only)
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalBookings = await prisma.booking.count();
    const pendingBookings = await prisma.booking.count({
      where: { status: 'PENDING' }
    });
    const confirmedBookings = await prisma.booking.count({
      where: { status: 'CONFIRMED' }
    });
    const cancelledBookings = await prisma.booking.count({
      where: { status: 'CANCELLED' }
    });
    const completedBookings = await prisma.booking.count({
      where: { status: 'COMPLETED' }
    });

    // Get total revenue
    const revenue = await prisma.booking.aggregate({
      where: {
        status: {
          in: ['CONFIRMED', 'COMPLETED']
        }
      },
      _sum: {
        totalPrice: true
      }
    });

    res.json({
      message: 'Booking statistics retrieved successfully',
      stats: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        totalRevenue: revenue._sum.totalPrice || 0
      }
    });
  } catch (error) {
    console.error('Booking statistics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve booking statistics'
    });
  }
});

module.exports = router;