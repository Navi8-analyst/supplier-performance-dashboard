# 🏨 Hotel Booking App - Pan India

A full-stack hotel booking application built with Node.js, React, PostgreSQL, and Prisma ORM. This application allows users to search, view, and book hotels across India with a modern, responsive interface.

## 🚀 Features

### User Features
- **Hotel Search**: Search hotels by city, price range, and rating
- **Room Availability**: Check room availability for specific dates
- **Booking Management**: Create, view, and cancel bookings
- **User Authentication**: Secure login and registration
- **Profile Management**: Update personal information
- **Responsive Design**: Works on desktop, tablet, and mobile

### Admin Features
- **Hotel Management**: Add, edit, and delete hotels
- **Room Management**: Manage room types and availability
- **Booking Management**: View and manage all bookings
- **User Management**: Manage user accounts and roles
- **Dashboard**: Analytics and statistics

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** - Database
- **Prisma** - ORM and database toolkit
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **React Icons** - Icon library
- **React DatePicker** - Date selection
- **React Toastify** - Notifications
- **Axios** - HTTP client

## 📁 Project Structure

```
hotel-booking-app/
├── backend/
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── hotels.js
│   │   ├── rooms.js
│   │   ├── bookings.js
│   │   └── users.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── .env.example
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   ├── tailwind.config.js
│   └── package.json
├── deploy.sh
├── package.json
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16 or higher
- npm or yarn
- PostgreSQL 12 or higher

### Quick Start (Automated)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hotel-booking-app
   ```

2. **Run the deployment script**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Follow the prompts** to set up the database and seed data

### Manual Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd hotel-booking-app
   npm install
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

3. **Configure Environment Variables**
   
   Edit `backend/.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/hotel_booking_db"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Setup Database**
   ```bash
   # Create database (replace with your credentials)
   createdb hotel_booking_db
   
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed with sample data
   npm run seed
   ```

5. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

6. **Start Development Servers**
   ```bash
   # From root directory
   npm run dev
   ```

## 📚 Available Scripts

### Root Level
- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build frontend for production
- `npm start` - Start production server
- `npm run setup` - Install dependencies for both backend and frontend

### Backend
- `npm run dev` - Start backend development server
- `npm start` - Start backend production server
- `npm run seed` - Seed database with sample data
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database

### Frontend
- `npm start` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm test` - Run tests

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Hotels
- `GET /api/hotels` - Get all hotels (with search/filter)
- `GET /api/hotels/:id` - Get hotel by ID
- `POST /api/hotels` - Create hotel (Admin only)
- `PUT /api/hotels/:id` - Update hotel (Admin only)
- `DELETE /api/hotels/:id` - Delete hotel (Admin only)

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `GET /api/rooms/:id/availability` - Check room availability
- `POST /api/rooms` - Create room (Admin only)
- `PUT /api/rooms/:id` - Update room (Admin only)
- `DELETE /api/rooms/:id` - Delete room (Admin only)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/all` - Get all bookings (Admin only)

## 🗄️ Database Schema

### Users
- `id` - Unique identifier
- `name` - Full name
- `email` - Email address (unique)
- `phone` - Phone number
- `password` - Hashed password
- `role` - USER or ADMIN

### Hotels
- `id` - Unique identifier
- `name` - Hotel name
- `city` - City location
- `address` - Full address
- `rating` - Hotel rating (0-5)
- `description` - Hotel description
- `image` - Hotel image URL

### Rooms
- `id` - Unique identifier
- `hotelId` - Reference to hotel
- `type` - Room type (Single, Double, Suite, etc.)
- `price` - Price per night
- `totalRooms` - Total number of rooms
- `availableRooms` - Currently available rooms
- `description` - Room description
- `amenities` - List of amenities
- `images` - List of room images

### Bookings
- `id` - Unique identifier
- `userId` - Reference to user
- `roomId` - Reference to room
- `checkinDate` - Check-in date
- `checkoutDate` - Check-out date
- `totalPrice` - Total booking price
- `status` - PENDING, CONFIRMED, CANCELLED, COMPLETED
- `guests` - Number of guests

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Tokens expire in 7 days by default
- Tokens are stored in localStorage
- Protected routes require valid tokens
- Admin routes require admin role

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Production with System Service
```bash
./deploy.sh --production
sudo systemctl start hotel-booking
sudo systemctl enable hotel-booking
```

## 🌟 Sample Data

The application includes sample data for:
- 50 hotels across 30 major Indian cities
- 200+ rooms with different types and amenities
- 20 sample users
- 100 sample bookings
- 1 admin user

### Default Credentials

**Admin User:**
- Email: `admin@hotelbooking.com`
- Password: `admin123`

**Sample User:**
- Email: `user1@example.com`
- Password: `user1123`

## 🎯 Usage Examples

### Searching Hotels
```javascript
// Search hotels by city
GET /api/hotels?city=Mumbai

// Search with date range
GET /api/hotels?city=Delhi&checkinDate=2024-01-15&checkoutDate=2024-01-18

// Search with price range
GET /api/hotels?minPrice=2000&maxPrice=5000

// Search with rating filter
GET /api/hotels?minRating=4.0
```

### Creating a Booking
```javascript
POST /api/bookings
{
  "roomId": "room-id-here",
  "checkinDate": "2024-01-15",
  "checkoutDate": "2024-01-18",
  "guests": 2
}
```

## 🔍 Features in Detail

### Hotel Search
- **City-based Search**: Find hotels in specific cities
- **Date Range**: Check availability for specific dates
- **Price Filtering**: Filter by price range
- **Rating Filter**: Filter by hotel ratings
- **Pagination**: Navigate through search results

### Booking System
- **Real-time Availability**: Check room availability
- **Booking Validation**: Prevent double bookings
- **Status Management**: Track booking status
- **Cancellation**: Cancel bookings with validation

### Admin Dashboard
- **Hotel Management**: CRUD operations for hotels
- **Room Management**: Manage room inventory
- **Booking Overview**: View all bookings
- **User Management**: Manage user accounts
- **Statistics**: View booking and revenue statistics

## 🛡️ Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive input validation
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configure allowed origins
- **SQL Injection Prevention**: Prisma ORM protection

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## � Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure database exists

2. **JWT Token Error**
   - Check JWT_SECRET in .env
   - Clear localStorage and login again

3. **Port Already in Use**
   - Change PORT in .env
   - Kill existing processes: `lsof -ti:5000 | xargs kill`

4. **Dependencies Not Installing**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by leading hotel booking platforms
- Designed for the Indian market
- Open source and free to use

---

**Happy Booking! 🏨✨**
