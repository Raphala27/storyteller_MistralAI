# 📖 AI Story Generator

An interactive storytelling application powered by MistralAI that generates creative stories based on user inputs. Users can guide the narrative by choosing from multiple story continuation options at each step.

## ✨ Features

- **Interactive Story Generation**: Start with a genre, characters, or opening line
- **AI-Powered**: Uses MistralAI's language model for creative story generation
- **Dynamic Suggestions**: AI-generated suggestions for genres, characters, and opening lines that change with each session
- **PostgreSQL Database**: Stories are persisted in PostgreSQL for reliable storage
- **Story Management**: Save, load, continue, and delete your stories
- **Markdown Formatting**: Stories support **bold**, *italic*, and other markdown formatting for enhanced readability
- **Modern UI**: Beautiful, responsive interface built with React
- **Complete Stories**: Generate satisfying conclusions on demand
- **🔒 Rate Limiting**: Production-ready rate limiting with Redis to protect API resources and prevent abuse
- **👤 User Authentication**: JWT-based authentication with secure password hashing

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Reliable database for story persistence
- **Redis**: Rate limiting and caching layer
- **SQLAlchemy 2.0**: Modern Python ORM with sync support
- **psycopg3**: PostgreSQL adapter (Python 3.13 compatible)
- **MistralAI SDK**: AI model integration for story generation
- **JWT**: Secure authentication tokens
- **Python 3.13**: Latest Python version

### Frontend
- **React**: UI library
- **Vite**: Build tool and development server
- **Axios**: HTTP client for API calls

## 📋 Prerequisites

- Python 3.13 (or 3.11+)
- PostgreSQL 14 or higher
- Redis (optional, for rate limiting - see [Rate Limiting Setup](docs/RATE_LIMITING_QUICKSTART.md))
- Node.js 16 or higher
- npm or yarn
- MistralAI API key (get one at [https://console.mistral.ai/](https://console.mistral.ai/))

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd storyteller_MistralAI

# Setup PostgreSQL database
bash scripts/setup_postgres.sh

# Edit backend/.env and add your MISTRAL_API_KEY

# Start the application
bash scripts/start.sh
```

### Option 2: Manual Setup

See the detailed installation instructions below.

## 📂 Project Structure

```
storyteller_MistralAI/
├── backend/              # FastAPI backend
│   ├── database.py      # Database configuration
│   ├── models.py        # SQLAlchemy ORM models
│   ├── storage_postgres.py  # PostgreSQL storage layer
│   ├── main.py          # Main application
│   └── requirements.txt # Python dependencies
├── frontend/            # React frontend
│   └── src/            # Frontend source code
├── docs/               # Documentation
│   ├── README.md       # Documentation index
│   ├── ARCHITECTURE.md # Project architecture
│   ├── DATABASE_README.md  # Database guide
│   └── POSTGRES_QUICKSTART.md  # PostgreSQL quick start
└── scripts/            # Utility scripts
    ├── README.md       # Scripts documentation
    ├── start.sh        # Start both servers
    └── setup_postgres.sh  # Database setup
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd storyteller_MistralAI
```

### 2. PostgreSQL Setup

Install PostgreSQL if not already installed:

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

Then run the setup script:
```bash
bash scripts/setup_postgres.sh
```

### 3. Backend Setup

```bash
cd backend

# The setup script already created the venv, but if needed:
# python -m venv venv
# source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies (done by setup script, but if needed:)
pip install -r requirements.txt

# Edit .env and add your MISTRAL_API_KEY
nano .env  # or use your preferred editor
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Easy Way: Use the Start Script

```bash
# From project root
bash scripts/start.sh
```

This will start both backend (port 8000) and frontend (port 5173) servers.

### Manual Way

**Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
```

**Frontend (in a new terminal):**
```bash
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173`

## 📚 Documentation

- **[Getting Started](docs/POSTGRES_QUICKSTART.md)** - Quick start guide
- **[Architecture](docs/ARCHITECTURE.md)** - Project structure and design
- **[Database Guide](docs/DATABASE_README.md)** - PostgreSQL setup and usage
- **[Rate Limiting Guide](docs/RATE_LIMITING.md)** - Complete rate limiting documentation
- **[Rate Limiting Quick Start](docs/RATE_LIMITING_QUICKSTART.md)** - Quick Redis setup
- **[Rate Limiting Config](docs/RATE_LIMITING_CONFIG.md)** - Configuration examples
- **[Scripts Documentation](scripts/README.md)** - Available scripts and usage

## 🔒 Rate Limiting

This project implements **production-ready rate limiting** using Redis and the token bucket algorithm:

- **AI Endpoints** (MistralAI calls): 2 req/sec for authenticated, 0.5 req/sec for anonymous
- **API Endpoints**: 10 req/sec for authenticated, 5 req/sec for anonymous  
- **Auth Endpoints**: 0.5 req/sec (brute force protection)

### Quick Setup

```powershell
# Start Redis (Docker - easiest)
docker run -d --name storyteller-redis -p 6379:6379 redis:7-alpine

# Or use cloud Redis (Upstash, Render, etc.) - see docs
```

**Rate limiting will automatically disable if Redis is unavailable** - your app will still work!

📖 **[Full Rate Limiting Documentation →](docs/RATE_LIMITING.md)**

## 🎯 API Endpoints

- `GET /` - Health check
- `POST /signup` - Create user account 🔒
- `POST /login` - User authentication 🔒
- `GET /me` - Get current user info 🔒
- `GET /suggestions` - Get AI-generated suggestions ⚡
- `POST /start-story` - Start a new story ⚡
- `POST /continue-story` - Continue an existing story ⚡
- `POST /end-story` - Generate an ending ⚡
- `GET /stories` - List all saved stories 🔒
- `GET /stories/{id}` - Get a specific story 🔒
- `DELETE /stories/{id}` - Delete a story 🔒

Legend: 🔒 = Rate limited | ⚡ = AI endpoint (stricter limits)

API Documentation available at: `http://localhost:8000/docs`

## 📖 How to Use

1. **Start a Story**:
   - Enter a genre (required)
   - Optionally add characters and/or an opening line
   - Click "Start Story" to generate the opening
   - Story is automatically saved to PostgreSQL

2. **Continue the Story**:
   - Read the generated story segment
   - Choose one of three continuation options
   - The story expands based on your choice
   - Each segment is saved automatically

3. **End the Story**:
   - Click "End Story" when you want to conclude
   - The AI generates a satisfying ending
   - Or click "Start Over" to create a new story

4. **Manage Stories**:
   - View all saved stories in the list
   - Load and continue previous stories
   - Delete stories you no longer want

## 🐛 Troubleshooting

### Backend Issues

- **"MISTRAL_API_KEY not found"**: Ensure `backend/.env` contains your API key
- **Database connection errors**: Run `bash scripts/setup_postgres.sh` to setup the database
- **Import errors**: Verify all packages are installed with `pip install -r requirements.txt`
- **Python 3.13 compatibility**: The project uses synchronous psycopg3 for compatibility

### Frontend Issues

- **Can't connect to backend**: Ensure the backend is running on port 8000
- **Dependencies not found**: Run `npm install` in the frontend directory

### Database Issues

- **Connection refused**: Make sure PostgreSQL is running
  ```bash
  # macOS
  brew services start postgresql@14
  # Ubuntu/Debian
  sudo systemctl start postgresql
  ```
- **Database doesn't exist**: Run `bash scripts/setup_postgres.sh`

For more troubleshooting, see [docs/DATABASE_README.md](docs/DATABASE_README.md)

## Customization

### Modifying Story Length

In `backend/main.py`, adjust the `max_tokens` parameter:

```python
response = mistral_client.chat(
    model="mistral-small-latest",
    messages=messages,
    temperature=0.8,
    max_tokens=400  # Adjust this value
)
```

### Changing AI Model

Replace `"mistral-small-latest"` with other Mistral models like:
- `"mistral-medium-latest"`
- `"mistral-large-latest"`

### Database Configuration

Edit `backend/.env` to change database settings:
```bash
DATABASE_URL=postgresql+psycopg://localhost/storyteller_db
```

For more details, see [docs/DATABASE_README.md](docs/DATABASE_README.md)

### Styling

Modify `frontend/src/App.css` to change colors, layouts, and animations.

## � Deployment

The application is configured for deployment on Render.com with PostgreSQL.

See [docs/POSTGRES_QUICKSTART.md](docs/POSTGRES_QUICKSTART.md) for deployment instructions.

## 🐛 Troubleshooting

## 📝 License

MIT License
