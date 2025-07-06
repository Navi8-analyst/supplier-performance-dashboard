const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Sample data for seeding
const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 
  'Nagpur', 'Visakhapatnam', 'Indore', 'Thane', 'Bhopal', 'Patna',
  'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Varanasi', 'Srinagar'
];

const hotelNames = [
  'Grand Palace', 'Royal Inn', 'Luxury Suites', 'Crown Plaza', 'Golden Heights',
  'Silver Star', 'Diamond Resort', 'Emerald Hotel', 'Sapphire Lodge', 'Ruby Residency',
  'Pearl Continental', 'Opal Inn', 'Jade Palace', 'Amber Hotel', 'Crystal Resort',
  'Platinum Suites', 'Titanium Heights', 'Cobalt Hotel', 'Copper Lodge', 'Bronze Palace',
  'Ivory Resort', 'Marble Inn', 'Granite Hotel', 'Quartz Lodge', 'Onyx Palace'
];

const roomTypes = ['Single', 'Double', 'Suite', 'Deluxe', 'Presidential'];

const amenities = [
  'Free WiFi', 'Air Conditioning', 'Room Service', 'Mini Bar', 'Television',
  'Balcony', 'Sea View', 'City View', 'Jacuzzi', 'Kitchenette',
  'Safe', 'Workspace', 'Complimentary Breakfast', 'Spa Access', 'Gym Access'
];

const sampleDescriptions = [
  'Experience luxury and comfort in our beautifully appointed rooms.',
  'Enjoy a perfect blend of modern amenities and traditional hospitality.',
  'Spacious accommodations with stunning views and premium facilities.',
  'Elegant rooms designed for both business and leisure travelers.',
  'Contemporary design meets exceptional service in our premium rooms.'
];

const sampleHotelDescriptions = [
  'A premier destination for luxury accommodation with world-class amenities.',
  'Experience unparalleled comfort and service in the heart of the city.',
  'Modern elegance meets traditional hospitality at our renowned establishment.',
  'Discover the perfect blend of luxury, comfort, and convenience.',
  'Your gateway to an unforgettable stay with exceptional amenities and service.'
];

// Helper function to get random item from array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get random items from array
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to generate random price
const getRandomPrice = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to generate random rating
const getRandomRating = () => {
  return Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 to 5.0
};

// Helper function to generate random date
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.booking.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.hotel.deleteMany({});
  await prisma.user.deleteMany({});

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@hotelbooking.com',
      phone: '+91-9876543210',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create regular users
  console.log('👥 Creating regular users...');
  const userPromises = [];
  for (let i = 1; i <= 20; i++) {
    const password = await bcrypt.hash(`user${i}123`, 12);
    userPromises.push(
      prisma.user.create({
        data: {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          phone: `+91-${9000000000 + i}`,
          password,
          role: 'USER'
        }
      })
    );
  }
  const users = await Promise.all(userPromises);

  // Create hotels
  console.log('🏨 Creating hotels...');
  const hotelPromises = [];
  for (let i = 0; i < 50; i++) {
    const city = getRandomItem(cities);
    const name = `${getRandomItem(hotelNames)} ${city}`;
    const rating = getRandomRating();
    
    hotelPromises.push(
      prisma.hotel.create({
        data: {
          name,
          city,
          address: `${Math.floor(Math.random() * 999) + 1}, ${getRandomItem(['MG Road', 'Main Street', 'Park Avenue', 'Mall Road', 'Station Road'])}, ${city}`,
          rating,
          description: getRandomItem(sampleHotelDescriptions),
          image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=300&fit=crop`
        }
      })
    );
  }
  const hotels = await Promise.all(hotelPromises);

  // Create rooms
  console.log('🛏️ Creating rooms...');
  const roomPromises = [];
  for (const hotel of hotels) {
    const roomCount = Math.floor(Math.random() * 5) + 3; // 3-7 rooms per hotel
    
    for (let i = 0; i < roomCount; i++) {
      const type = getRandomItem(roomTypes);
      const basePrice = {
        'Single': getRandomPrice(1500, 3000),
        'Double': getRandomPrice(2500, 5000),
        'Suite': getRandomPrice(5000, 8000),
        'Deluxe': getRandomPrice(4000, 7000),
        'Presidential': getRandomPrice(10000, 20000)
      };
      
      const price = basePrice[type];
      const totalRooms = Math.floor(Math.random() * 10) + 5; // 5-14 rooms
      const availableRooms = Math.floor(Math.random() * totalRooms) + 1; // 1 to totalRooms
      
      roomPromises.push(
        prisma.room.create({
          data: {
            hotelId: hotel.id,
            type,
            price,
            totalRooms,
            availableRooms,
            description: getRandomItem(sampleDescriptions),
            amenities: getRandomItems(amenities, Math.floor(Math.random() * 8) + 3),
            images: [
              `https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=300&fit=crop`,
              `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&h=300&fit=crop`,
              `https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&h=300&fit=crop`
            ]
          }
        })
      );
    }
  }
  const rooms = await Promise.all(roomPromises);

  // Create bookings
  console.log('📅 Creating bookings...');
  const bookingPromises = [];
  const statuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
  
  for (let i = 0; i < 100; i++) {
    const user = getRandomItem(users);
    const room = getRandomItem(rooms);
    const status = getRandomItem(statuses);
    
    // Generate random dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60)); // Past 60 days
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days stay
    
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * nights;
    const guests = Math.floor(Math.random() * 4) + 1; // 1-4 guests
    
    bookingPromises.push(
      prisma.booking.create({
        data: {
          userId: user.id,
          roomId: room.id,
          checkinDate: startDate,
          checkoutDate: endDate,
          totalPrice,
          status,
          guests
        }
      })
    );
  }
  await Promise.all(bookingPromises);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Seeding Summary:');
  console.log(`- 1 Admin user created`);
  console.log(`- 20 Regular users created`);
  console.log(`- 50 Hotels created across ${cities.length} cities`);
  console.log(`- ${rooms.length} Rooms created`);
  console.log(`- 100 Bookings created`);
  console.log('\n🔑 Admin Login Credentials:');
  console.log('Email: admin@hotelbooking.com');
  console.log('Password: admin123');
  console.log('\n🔑 Sample User Login Credentials:');
  console.log('Email: user1@example.com');
  console.log('Password: user1123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });