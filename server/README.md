# 🇺🇦 UA Environment Dashboard - Backend API

RESTful API for the UA Environment Dashboard. Provides air quality data for Ukrainian regions.

## 🚀 Features

- ✅ RESTful API with versioning
- ✅ PostgreSQL database with connection pooling
- ✅ Redis caching for performance
- ✅ TypeScript for type safety
- ✅ Comprehensive error handling
- ✅ Rate limiting & CORS
- ✅ Request validation with Zod
- ✅ Structured logging with Winston
- ✅ Health check endpoints
- ✅ Database migrations
- ✅ Graceful shutdown

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional but recommended)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/sofia-kindratyshyn/eco-ua-analytics.git
cd eco-ua-analytics/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=eco_ua_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# External APIs
SAVEECOBOT_API_KEY=your_key_here
OPENAQ_API_KEY=your_key_here

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Database setup

Create PostgreSQL database:

```bash
createdb eco_ua_db
```

Run migrations:

```bash
npm run migrate
```

Seed initial data:

```bash
npm run seed
```

### 5. Start development server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Endpoints

#### Health Check

```http
GET /health
GET /health/detailed
GET /health/ready
GET /health/live
```

#### Regions

```http
GET    /api/v1/regions              # Get all regions
GET    /api/v1/regions/:id          # Get region by ID
GET    /api/v1/regions/code/:code   # Get region by code
GET    /api/v1/regions/:id/stats    # Get region statistics
POST   /api/v1/regions              # Create region
PUT    /api/v1/regions/:id          # Update region
DELETE /api/v1/regions/:id          # Delete region
```

#### Stations

```http
GET    /api/v1/stations                      # Get all stations
GET    /api/v1/stations/:id                  # Get station by ID
GET    /api/v1/stations/:id/latest           # Get station with latest measurements
GET    /api/v1/regions/:regionId/stations    # Get stations by region
POST   /api/v1/stations                      # Create station
PUT    /api/v1/stations/:id                  # Update station
DELETE /api/v1/stations/:id                  # Delete station
```

#### Air Quality

```http
GET    /api/v1/air-quality                              # Get measurements
GET    /api/v1/air-quality/summary                      # Get summary
GET    /api/v1/air-quality/averages                     # Get averages
GET    /api/v1/stations/:stationId/air-quality/latest   # Latest by station
GET    /api/v1/regions/:regionId/air-quality/latest     # Latest by region
POST   /api/v1/air-quality/bulk                         # Bulk create
```

### Query Parameters

#### Get Measurements

```
?station_id=1
?region_id=2
?parameter=pm25
?start_date=2024-01-01T00:00:00Z
?end_date=2024-01-31T23:59:59Z
?limit=100
?offset=0
```

#### Get Averages

```
?region_id=1
?parameter=pm25
?start_date=2024-01-01T00:00:00Z
?end_date=2024-01-31T23:59:59Z
?group_by=day  # hour, day, week, month
```

### Response Format

Success response:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "source": "database",
    "count": 10
  }
}
```

Error response:

```json
{
  "success": false,
  "error": "Error message here",
  "statusCode": 400
}
```

## 🗄️ Database Schema

### Regions Table

```sql
regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  name_ua VARCHAR(100),
  code VARCHAR(10) UNIQUE,
  geometry JSONB,
  population INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Stations Table

```sql
stations (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(100),
  name VARCHAR(200),
  region_id INTEGER REFERENCES regions(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  source VARCHAR(50),
  is_active BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Measurements Table

```sql
measurements (
  id BIGSERIAL PRIMARY KEY,
  station_id INTEGER REFERENCES stations(id),
  measured_at TIMESTAMP,
  parameter VARCHAR(20),
  value DECIMAL(10, 4),
  unit VARCHAR(20),
  aqi INTEGER,
  source VARCHAR(50),
  created_at TIMESTAMP
)
```

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Start production server
npm run migrate  # Run database migrations
npm run seed     # Seed initial data
npm run lint     # Run ESLint
npm test         # Run tests (when implemented)
```

### Project Structure

```
src/
├── config/          # Configuration files
│   ├── env.ts
│   ├── database.ts
│   └── redis.ts
├── controllers/     # Route controllers
├── routes/          # API routes
├── models/          # Database models
├── services/        # Business logic
├── middleware/      # Express middleware
├── utils/           # Utility functions
├── types/           # TypeScript types
├── jobs/            # Background jobs
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## 🔧 Configuration

### Environment Variables

| Variable                  | Description                  | Default                 |
| ------------------------- | ---------------------------- | ----------------------- |
| `NODE_ENV`                | Environment                  | `development`           |
| `PORT`                    | Server port                  | `3000`                  |
| `DATABASE_URL`            | PostgreSQL connection string | -                       |
| `DATABASE_HOST`           | Database host                | `localhost`             |
| `DATABASE_PORT`           | Database port                | `5432`                  |
| `DATABASE_NAME`           | Database name                | `eco_ua_db`             |
| `REDIS_URL`               | Redis connection string      | -                       |
| `REDIS_HOST`              | Redis host                   | `localhost`             |
| `REDIS_PORT`              | Redis port                   | `6379`                  |
| `REDIS_TTL`               | Cache TTL in seconds         | `900`                   |
| `ALLOWED_ORIGINS`         | CORS allowed origins         | `http://localhost:5173` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window      | `100`                   |

## 🚀 Deployment

### Using Docker

```bash
docker build -t eco-ua-backend .
docker run -p 3000:3000 --env-file .env eco-ua-backend
```

### Using Docker Compose

```bash
docker-compose up -d
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong database passwords
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS
- [ ] Configure rate limiting
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure logging
- [ ] Set up database backups
- [ ] Configure Redis persistence

## 📊 Monitoring

### Health Check Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/live` - Kubernetes liveness probe

### Logs

Logs are written to:

- Console (development)
- `logs/app.log` (production)
- `logs/error.log` (errors only)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 👥 Author

**Sofia Kindratyshyn**

- GitHub: [@sofia-kindratyshyn](https://github.com/sofia-kindratyshyn)

## 🙏 Acknowledgments

- SaveEcoBot for Ukrainian environmental data
- OpenAQ for global air quality data
- All contributors and supporters

---

Made with ❤️ for a cleaner Ukraine 🇺🇦
