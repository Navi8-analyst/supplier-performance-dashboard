#!/bin/bash

# Hotel Booking App Deployment Script
# This script sets up and deploys the full-stack hotel booking application

echo "🚀 Starting Hotel Booking App Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL is not installed. Please install PostgreSQL 12 or higher."
    print_warning "You can install it using:"
    print_warning "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    print_warning "  CentOS/RHEL: sudo yum install postgresql postgresql-server"
    print_warning "  macOS: brew install postgresql"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Set up environment variables
print_status "Setting up environment variables..."

# Create .env file for backend if it doesn't exist
if [ ! -f "backend/.env" ]; then
    print_status "Creating backend .env file..."
    cp backend/.env.example backend/.env
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your-super-secret-jwt-key-here/$JWT_SECRET/" backend/.env
    
    print_warning "Please update the DATABASE_URL in backend/.env with your PostgreSQL connection string"
    print_warning "Example: postgresql://username:password@localhost:5432/hotel_booking_db"
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Ask user if they want to create/migrate database
read -p "Do you want to create/migrate the database? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Creating/migrating database..."
    npx prisma db push
    
    # Ask user if they want to seed the database
    read -p "Do you want to seed the database with sample data? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Seeding database with sample data..."
        npm run seed
    fi
fi

# Go back to root directory
cd ..

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
print_status "Building frontend..."
npm run build

# Go back to root directory
cd ..

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Create systemd service file for production (optional)
if [ "$1" = "--production" ]; then
    print_status "Creating systemd service file..."
    sudo tee /etc/systemd/system/hotel-booking.service > /dev/null <<EOF
[Unit]
Description=Hotel Booking App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
ExecStart=$(which node) backend/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable hotel-booking
    print_status "Systemd service created. Start with: sudo systemctl start hotel-booking"
fi

# Display success message
print_status "✅ Deployment completed successfully!"
echo ""
echo "🎉 Hotel Booking App is ready!"
echo ""
echo "📋 Quick Start:"
echo "  1. Update backend/.env with your database connection"
echo "  2. For development: npm run dev"
echo "  3. For production: npm start"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo "  API Health: http://localhost:5000/api/health"
echo ""
echo "🔑 Default Admin Credentials:"
echo "  Email: admin@hotelbooking.com"
echo "  Password: admin123"
echo ""
echo "🔑 Sample User Credentials:"
echo "  Email: user1@example.com"
echo "  Password: user1123"
echo ""
echo "📚 Available Commands:"
echo "  npm run dev          - Start development servers"
echo "  npm run build        - Build for production"
echo "  npm start           - Start production server"
echo "  npm run db:migrate  - Migrate database"
echo "  npm run db:seed     - Seed database"
echo ""
echo "🎯 Features Included:"
echo "  ✅ Hotel search by city, price, rating"
echo "  ✅ Room availability checking"
echo "  ✅ Booking management"
echo "  ✅ User authentication"
echo "  ✅ Admin dashboard"
echo "  ✅ Responsive design"
echo "  ✅ Real-time booking status"
echo ""
print_status "Happy coding! 🚀"