const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateHotel, validateSearch, validateId } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get all hotels with search and filter functionality
router.get('/', optionalAuth, validateSearch, async (req, res) => {
  try {
    const {
      city,
      checkinDate,
      checkoutDate,
      guests = 1,
      minPrice,
      maxPrice,
      minRating,
      page = 1,
      limit = 10
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive'
      };
    }
    if (minRating) {
      where.rating = {
        gte: parseFloat(minRating)
      };
    }

    // Build include clause with room filtering
    const include = {
      rooms: {
        where: {
          ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
          ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
          ...(checkinDate && checkoutDate && {
            // Check room availability for the given dates
            OR: [
              { availableRooms: { gt: 0 } },
              {
                bookings: {
                  none: {
                    OR: [
                      {
                        AND: [
                          { checkinDate: { lte: new Date(checkinDate) } },
                          { checkoutDate: { gte: new Date(checkinDate) } }
                        ]
                      },
                      {
                        AND: [
                          { checkinDate: { lte: new Date(checkoutDate) } },
                          { checkoutDate: { gte: new Date(checkoutDate) } }
                        ]
                      },
                      {
                        AND: [
                          { checkinDate: { gte: new Date(checkinDate) } },
                          { checkoutDate: { lte: new Date(checkoutDate) } }
                        ]
                      }
                    ]
                  }
                }
              }
            ]
          })
        },
        select: {
          id: true,
          type: true,
          price: true,
          totalRooms: true,
          availableRooms: true,
          description: true,
          amenities: true,
          images: true
        }
      }
    };

    // Get hotels
    const hotels = await prisma.hotel.findMany({
      where,
      include,
      skip,
      take: parseInt(limit),
      orderBy: {
        rating: 'desc'
      }
    });

    // Filter out hotels with no available rooms if dates are specified
    let filteredHotels = hotels;
    if (checkinDate && checkoutDate) {
      filteredHotels = hotels.filter(hotel => hotel.rooms.length > 0);
    }

    // Get total count for pagination
    const totalHotels = await prisma.hotel.count({ where });

    res.json({
      message: 'Hotels retrieved successfully',
      hotels: filteredHotels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalHotels,
        pages: Math.ceil(totalHotels / parseInt(limit))
      },
      filters: {
        city,
        checkinDate,
        checkoutDate,
        guests,
        minPrice,
        maxPrice,
        minRating
      }
    });
  } catch (error) {
    console.error('Hotels retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve hotels'
    });
  }
});

// Get hotel by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        rooms: {
          select: {
            id: true,
            type: true,
            price: true,
            totalRooms: true,
            availableRooms: true,
            description: true,
            amenities: true,
            images: true
          }
        }
      }
    });

    if (!hotel) {
      return res.status(404).json({
        error: 'Hotel Not Found',
        message: 'Hotel not found'
      });
    }

    res.json({
      message: 'Hotel retrieved successfully',
      hotel
    });
  } catch (error) {
    console.error('Hotel retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve hotel'
    });
  }
});

// Create new hotel (Admin only)
router.post('/', authenticateToken, requireAdmin, validateHotel, async (req, res) => {
  try {
    const { name, city, address, rating, description, image } = req.body;

    const hotel = await prisma.hotel.create({
      data: {
        name,
        city,
        address,
        rating: rating || 0,
        description,
        image
      },
      include: {
        rooms: true
      }
    });

    res.status(201).json({
      message: 'Hotel created successfully',
      hotel
    });
  } catch (error) {
    console.error('Hotel creation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create hotel'
    });
  }
});

// Update hotel (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateId, validateHotel, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, address, rating, description, image } = req.body;

    const hotel = await prisma.hotel.update({
      where: { id },
      data: {
        name,
        city,
        address,
        rating,
        description,
        image
      },
      include: {
        rooms: true
      }
    });

    res.json({
      message: 'Hotel updated successfully',
      hotel
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Hotel Not Found',
        message: 'Hotel not found'
      });
    }
    console.error('Hotel update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update hotel'
    });
  }
});

// Delete hotel (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.hotel.delete({
      where: { id }
    });

    res.json({
      message: 'Hotel deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Hotel Not Found',
        message: 'Hotel not found'
      });
    }
    console.error('Hotel deletion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete hotel'
    });
  }
});

// Get popular cities
router.get('/data/popular-cities', async (req, res) => {
  try {
    const cities = await prisma.hotel.groupBy({
      by: ['city'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    const popularCities = cities.map(city => ({
      city: city.city,
      hotelCount: city._count.id
    }));

    res.json({
      message: 'Popular cities retrieved successfully',
      cities: popularCities
    });
  } catch (error) {
    console.error('Popular cities error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve popular cities'
    });
  }
});

module.exports = router;