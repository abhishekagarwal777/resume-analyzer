
# Resume Analyzer

This project analyzes resumes using PostgreSQL + Gemini API.  
It has a **backend** (Node.js/Express) and can be extended with a frontend later.

## Project Structure
├── backend/        # Express.js backend server  
├── .gitignore      # Git ignore file  
└── README.md       # Project documentation  

## Setup Instructions
1. Navigate to backend:
   ```bash
   cd backend
   npm install
   ```
2. Configure environment variables in `backend/.env`.
3. Run server:
   ```bash
   npm start
   ```

# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm start

# Build frontend
cd frontend
npm run build

# Start backend
cd ../backend
npm start

Create README.md:
bash# In project root
touch README.md

Add Sample Data:
bash# Add some sample resume PDFs to test with
cd sample_data
# Copy your test PDF files here
cd ..

Test Database Connection:
bash# Test if PostgreSQL is running
sudo systemctl status postgresql

# OR for macOS
brew services list | grep postgresql