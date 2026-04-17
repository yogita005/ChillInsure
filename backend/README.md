# 🧊 ChillInsure Backend - Setup & Run Instructions

## ✅ Quick Start

### 1️⃣ Backend Setup (Python)

```bash
# Navigate to backend directory
cd c:\Users\yogit\OneDrive\Desktop\devtrails\ChillInsure-consolidated\backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
copy .env.example .env

# Update .env with your actual credentials
# (Database, API keys, etc.)

# Run the backend server
python main.py
```

**Backend will start on:** `http://localhost:3001`

---

### 2️⃣ Frontend Setup (React)

```bash
# Navigate to frontend directory
cd c:\Users\yogit\OneDrive\Desktop\devtrails\ChillInsure-consolidated\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will start on:** `http://localhost:5173` (or `http://localhost:8081`)

---

## 🌐 API Endpoints

Once backend is running, test endpoints:

### Health Check
```bash
curl http://localhost:3001/
curl http://localhost:3001/health
curl http://localhost:3001/api/status
```

### Authentication
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"9876543210"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Risk Scoring (GigScore)
```bash
# Calculate GigScore
curl -X POST http://localhost:3001/api/gigscore/calculate \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","platform":"Zomato"}'
```

### Weekly Policy
```bash
# Create weekly policy
curl -X POST http://localhost:3001/api/policy/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"userId":"user123","zoneId":"zone456","coverageAmount":2000}'

# Get policy details
curl http://localhost:3001/api/policy/policy123
```

---

## 📚 API Documentation

Visit **Swagger UI** for interactive documentation:
```
http://localhost:3001/docs
```

Or **ReDoc** for alternative view:
```
http://localhost:3001/redoc
```

---

## 📂 Project Structure

```
backend/
├── controllers/         # Business logic
│   ├── auth_controller.py
│   ├── gigscore_engine_controller.py
│   └── policy_controller.py
├── models/             # Data models
│   ├── user_model.py
│   ├── gigscore_model.py
│   └── policy_model.py
├── routes/             # API routes
│   ├── auth_route.py
│   ├── gigscore_route.py
│   └── policy_route.py
├── services/           # External services
│   ├── weather_service.py
│   ├── payout_service.py
│   └── zone_risk_service.py
├── db/                 # Database
│   └── supabase_client.py
├── core/               # Config & dependencies
│   ├── config.py
│   └── dependencies.py
├── main.py             # FastAPI app
├── requirements.txt    # Dependencies
├── .env.example        # Environment template
└── __init__.py
```

---

## ⚙️ Configuration

### Database (Supabase)
1. Create Supabase project: https://supabase.com
2. Get your `SUPABASE_URL` and `SUPABASE_KEY`
3. Update `.env` file:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_key
   ```

### Weather API (OpenWeather)
1. Sign up: https://openweathermap.org/api
2. Get API key
3. Update `.env`:
   ```env
   WEATHER_API_KEY=your_api_key
   ```

### Payment Gateway (Razorpay)
1. Sign up: https://razorpay.com
2. Get API credentials
3. Update `.env`:
   ```env
   PAYMENT_API_KEY=your_key
   PAYMENT_API_SECRET=your_secret
   ```

---

## 🧪 Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# With coverage
pytest --cov=. --cov-report=html
```

---

## 🐛 Common Issues

### ❌ `ModuleNotFoundError: No module named 'fastapi'`
**Solution:** Install dependencies
```bash
pip install -r requirements.txt
```

### ❌ `Port 3001 already in use`
**Solution:** Kill process on port or change port in `main.py`
```bash
# On Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### ❌ `SUPABASE_URL not set`
**Solution:** Create `.env` file with configuration
```bash
copy .env.example .env
# Then edit .env with your credentials
```

### ❌ `SSL: CERTIFICATE_VERIFY_FAILED`
**Solution:** Add to `.env`
```
SSL_VERIFY=False
```

---

## 📋 Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/` | Health check |
| `GET` | `/health` | Health status |
| `GET` | `/api/status` | All services status |
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/gigscore/calculate` | Calculate GigScore |
| `GET` | `/api/gigscore/:userId` | Get GigScore |
| `POST` | `/api/policy/create` | Create weekly policy |
| `GET` | `/api/policy/:policyId` | Get policy details |
| `POST` | `/api/policy/renew` | Renew weekly policy |

---

## 🚀 Deployment

### Local Development
```bash
python main.py
```

### Production (Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:3001 main:app
```

### Docker (Coming Soon)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001"]
```

---

## 📞 Support

For issues or questions:
1. Check API docs: http://localhost:3001/docs
2. Review logs in terminal
3. Check `.env` configuration
4. Verify API keys and credentials

---

## ✅ Status

Backend consolidated from 5 branches:
- ✅ sg-backend (auth, gigscore)
- ✅ Saswat-BackEnd (policy)
- ✅ manya-patch-1 (weather)
- ✅ manya-patch-2 (payout)
- ✅ manya-patch-3 (zone-risk)

**Status:** Ready for development! 🎯
