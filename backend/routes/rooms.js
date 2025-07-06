const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRoom, validateId } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get all rooms with optional hotel filtering
router.get('/', async (req, res) => {
  try {
    const { hotelId, type, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (hotelId) where.hotelId = hotelId;
    if (type) where.type = type;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const rooms = await prisma.room.findMany({
      where,
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
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        price: 'asc'
      }
    });

    const totalRooms = await prisma.room.count({ where });

    res.json({
      message: 'Rooms retrieved successfully',
      rooms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRooms,
        pages: Math.ceil(totalRooms / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Rooms retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve rooms'
    });
  }
});

// Get room by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            rating: true,
            description: true,
            image: true
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

    res.json({
      message: 'Room retrieved successfully',
      room
    });
  } catch (error) {
    console.error('Room retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve room'
    });
  }
});

// Check room availability for specific dates
router.get('/:id/availability', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    const { checkinDate, checkoutDate } = req.query;

    if (!checkinDate || !checkoutDate) {
      return res.status(400).json({
        error: 'Missing Parameters',
        message: 'Check-in and check-out dates are required'
      });
    }

    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);

    if (checkin >= checkout) {
      return res.status(400).json({
        error: 'Invalid Dates',
        message: 'Check-out date must be after check-in date'
      });
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
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
        }
      }
    });

    if (!room) {
      return res.status(404).json({
        error: 'Room Not Found',
        message: 'Room not found'
      });
    }

    const bookedRooms = room.bookings.length;
    const availableRooms = room.availableRooms - bookedRooms;

    res.json({
      message: 'Room availability checked successfully',
      availability: {
        roomId: room.id,
        checkinDate,
        checkoutDate,
        totalRooms: room.totalRooms,
        bookedRooms,
        availableRooms: Math.max(0, availableRooms),
        isAvailable: availableRooms > 0
      }
    });
  } catch (error) {
    console.error('Room availability error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check room availability'
    });
  }
});

// Create new room (Admin only)
router.post('/', authenticateToken, requireAdmin, validateRoom, async (req, res) => {
  try {
    const { hotelId, type, price, totalRooms, availableRooms, description, amenities, images } = req.body;

    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) {
      return res.status(400).json({
        error: 'Hotel Not Found',
        message: 'Hotel not found'
      });
    }

    const room = await prisma.room.create({
      data: {
        hotelId,
        type,
        price,
        totalRooms,
        availableRooms,
        description,
        amenities: amenities || [],
        images: images || []
      },
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
    });

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create room'
    });
  }
});

// Update room (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateId, validateRoom, async (req, res) => {
  try {
    const { id } = req.params;
    const { hotelId, type, price, totalRooms, availableRooms, description, amenities, images } = req.body;

    // Verify hotel exists if hotelId is being updated
    if (hotelId) {
      const hotel = await prisma.hotel.findUnique({
        where: { id: hotelId }
      });

      if (!hotel) {
        return res.status(400).json({
          error: 'Hotel Not Found',
          message: 'Hotel not found'
        });
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        hotelId,
        type,
        price,
        totalRooms,
        availableRooms,
        description,
        amenities: amenities || [],
        images: images || []
      },
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
    });

    res.json({
      message: 'Room updated successfully',
      room
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Room Not Found',
        message: 'Room not found'
      });
    }
    console.error('Room update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update room'
    });
  }
});

// Delete room (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if room has active bookings
    const activeBookings = await prisma.booking.findMany({
      where: {
        roomId: id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        error: 'Cannot Delete Room',
        message: 'Room has active bookings and cannot be deleted'
      });
    }

    await prisma.room.delete({
      where: { id }
    });

    res.json({
      message: 'Room deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Room Not Found',
        message: 'Room not found'
      });
    }
    console.error('Room deletion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete room'
    });
  }
});

// Get room types
router.get('/data/types', async (req, res) => {
  try {
    const types = await prisma.room.groupBy({
      by: ['type'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    const roomTypes = types.map(type => ({
      type: type.type,
      count: type._count.id
    }));

    res.json({
      message: 'Room types retrieved successfully',
      types: roomTypes
    });
  } catch (error) {
    console.error('Room types error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve room types'
    });
  }
});

module.exports = router;