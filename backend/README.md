
cat > README.md << EOF
# Resume Analyzer Backend

This is the backend service for the Resume Analyzer project.  
It handles:
- Resume upload & parsing
- Integration with Gemini API
- PostgreSQL storage

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_DATABASE=resume_analyzer
   GOOGLE_API_KEY=your_gemini_api_key
   PORT=5000
   ```
4. Run server:
   ```bash
   npm start
   ```

## License
MIT
