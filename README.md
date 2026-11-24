# TrustLink Project

## Overview
TrustLink is a real-time application designed to facilitate job postings, bidding, and contract management with a focus on spatial data and trust scoring. The application utilizes Express for the server framework and Socket.io for real-time communication.

## Project Structure
The project is organized into the following main directories and files:

- **.env.example**: Contains example environment variables for configuration, such as database connection strings and API keys.
- **package.json**: Configuration file for npm, listing dependencies, scripts, and metadata for the project.
- **src/**: Contains the main application code, organized into subdirectories:
  - **app.js**: Entry point of the application, configuring the Express app and initializing routes.
  - **server.js**: Initializes the HTTP server and sets up Socket.io for real-time communication.
  - **config/**: Contains configuration files:
    - **db.js**: Exports a MySQL2 connection pool with spatial helpers for database interactions.
    - **constants.js**: Exports system-wide status enums and configuration constants.
  - **middleware/**: Contains middleware functions:
    - **auth.middleware.js**: JWT authentication middleware for protected routes.
    - **error.middleware.js**: Centralized error handler for processing application errors.
  - **sockets/**: Contains WebSocket-related files:
    - **index.js**: Real-time WebSocket connection engine.
    - **socketEmitter.js**: Helper function for targeted event dispatching.
  - **services/**: Contains business logic:
    - **spatial.service.js**: Functions for executing ST_Distance_Sphere queries.
    - **trustScore.service.js**: Functions for calculating deterministic trust scores.
  - **controllers/**: Contains controller files for handling requests:
    - **job.controller.js**: Manages job postings and spatial broadcasts.
    - **bid.controller.js**: Handles reverse-bidding submissions.
    - **contract.controller.js**: Manages ACID transactions for contracts.
  - **routes/**: Contains route definitions:
    - **job.routes.js**: Routes related to job operations.
    - **bid.routes.js**: Routes related to bidding operations.
    - **contract.routes.js**: Routes related to contract operations.
    - **index.js**: Aggregates and exports all routes.
  - **workers/**: Contains background jobs:
    - **radiusExpander.worker.js**: Cron job that expands the radius from 5 km to 10 km after 5 minutes.

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd trustlink
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and fill in the required environment variables.

4. Start the application:
   ```
   npm start
   ```

## Usage Guidelines
- The application supports real-time job postings and bidding.
- Ensure that the database is properly configured and running before starting the application.
- Use the provided API endpoints to interact with the application features.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.
