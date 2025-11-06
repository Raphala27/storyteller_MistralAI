# 📖 AI Story Generator

An interactive storytelling application powered by MistralAI that generates creative stories based on user inputs. Users can guide the narrative by choosing from multiple story continuation options at each step.

## ✨ Features

- **Interactive Story Generation**: Start with a genre, characters, or opening line
- **Branching Narratives**: Choose from 3 different options at each step to guide your story
- **AI-Powered**: Uses MistralAI's language model for creative story generation
- **Dynamic Suggestions**: AI-generated suggestions for genres, characters, and opening lines that change with each session
- **Story Persistence**: Save, load, continue, and delete your stories
- **Markdown Formatting**: Stories support **bold**, *italic*, and other markdown formatting for enhanced readability
- **Modern UI**: Beautiful, responsive interface built with React
- **Complete Stories**: Generate satisfying conclusions on demand

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MistralAI SDK**: AI model integration for story generation
- **Python 3.8+**: Programming language

### Frontend
- **React**: UI library
- **Vite**: Build tool and development server
- **Axios**: HTTP client for API calls
- **React Markdown**: Markdown rendering support
- **Modern CSS**: Responsive design with animations

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn
- MistralAI API key (get one at [https://console.mistral.ai/](https://console.mistral.ai/))

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd storyteller_MistralAI
```

### 2. Backend Setup

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your MistralAI API key
cp .env.example .env
# Edit .env and add your MISTRAL_API_KEY
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

## 🎮 Running the Application

### Start the Backend Server

```bash
cd backend
source venv/bin/activate  # Activate venv if not already activated
python main.py
```

The backend will start at `http://localhost:8000`

You can verify it's running by visiting: `http://localhost:8000` or `http://localhost:8000/docs` for API documentation.

### Start the Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start at `http://localhost:5173`

Open your browser and navigate to `http://localhost:5173` to use the application.

## 📖 How to Use

1. **Start a Story**:
   - Enter a genre (required)
   - Optionally add characters and/or an opening line
   - Click "Start Story" to generate the opening

2. **Continue the Story**:
   - Read the generated story segment
   - Choose one of three continuation options
   - The story will expand based on your choice

3. **End the Story**:
   - Click "End Story" when you want to conclude
   - The AI will generate a satisfying ending
   - Or click "Start Over" to create a new story

## 🎯 API Endpoints

- `GET /` - Health check
- `GET /suggestions` - Get AI-generated suggestions for genres, characters, and opening lines (dynamic)
- `POST /start-story` - Start a new story (automatically saved)
- `POST /continue-story` - Continue an existing story
- `POST /end-story` - Generate an ending for the story
- `GET /stories` - List all saved stories
- `GET /stories/{id}` - Get a specific story by ID
- `DELETE /stories/{id}` - Delete a story

## 🎨 Customization

### Modifying Story Length

In `backend/main.py`, adjust the `max_tokens` parameter in the MistralAI client calls:

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

### Customizing Suggestions

Edit the suggestion arrays in `backend/main.py`:

```python
GENRE_SUGGESTIONS = [...]
CHARACTER_SUGGESTIONS = [...]
OPENING_LINE_SUGGESTIONS = [...]
```

### Styling

Modify `frontend/src/App.css` to change colors, layouts, and animations.

## 🐛 Troubleshooting

### Backend Issues

- **"MISTRAL_API_KEY not found"**: Ensure your `.env` file exists and contains a valid API key
- **Import errors**: Verify all packages are installed with `pip install -r requirements.txt`
- **CORS errors**: Check that the frontend URL is listed in the CORS middleware configuration

### Frontend Issues

- **Can't connect to backend**: Ensure the backend is running on port 8000
- **Dependencies not found**: Run `npm install` in the frontend directory

## 📝 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- [MistralAI](https://mistral.ai/) for the powerful language model
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent web framework
- [React](https://react.dev/) and [Vite](https://vitejs.dev/) for the frontend tools
