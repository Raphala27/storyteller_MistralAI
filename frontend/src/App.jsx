import { useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import './App.css'

const API_URL = 'http://localhost:8000'

function App() {
  const [stage, setStage] = useState('input') // input, story, ended
  const [genre, setGenre] = useState('')
  const [characters, setCharacters] = useState('')
  const [openingLine, setOpeningLine] = useState('')
  const [story, setStory] = useState('')
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState({
    genres: [],
    characters: [],
    opening_lines: []
  })

  // Fetch suggestions on mount
  useState(() => {
    axios.get(`${API_URL}/suggestions`)
      .then(response => setSuggestions(response.data))
      .catch(error => console.error('Error fetching suggestions:', error))
  }, [])

  const startStory = async () => {
    if (!genre.trim()) {
      alert('Please enter a genre!')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/start-story`, {
        genre,
        characters: characters || null,
        opening_line: openingLine || null
      })

      setStory(response.data.story_text)
      setOptions(response.data.options)
      setStage('story')
    } catch (error) {
      console.error('Error starting story:', error)
      alert('Error starting story. Please check if the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const continueStory = async (chosenOption) => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/continue-story`, {
        story_so_far: story,
        chosen_option: chosenOption
      })

      setStory(story + '\n\n' + response.data.story_text)
      setOptions(response.data.options)
    } catch (error) {
      console.error('Error continuing story:', error)
      alert('Error continuing story. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const endStory = async () => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/end-story`, {
        story_so_far: story
      })

      setStory(story + '\n\n' + response.data.story_text)
      setOptions([])
      setStage('ended')
    } catch (error) {
      console.error('Error ending story:', error)
      alert('Error ending story. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetStory = () => {
    setStage('input')
    setGenre('')
    setCharacters('')
    setOpeningLine('')
    setStory('')
    setOptions([])
  }

  return (
    <div className="App">
      <header className="header">
        <h1>📖 AI Story Generator</h1>
        <p className="subtitle">Create your own interactive story with AI</p>
      </header>

      {stage === 'input' && (
        <div className="input-container">
          <div className="form-section">
            <label htmlFor="genre">Genre *</label>
            <input
              id="genre"
              type="text"
              placeholder="e.g., Fantasy Adventure, Sci-Fi Mystery..."
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="input-field"
            />
            <div className="suggestions">
              {suggestions.genres.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setGenre(suggestion)}
                  className="suggestion-chip"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="characters">Characters (optional)</label>
            <input
              id="characters"
              type="text"
              placeholder="e.g., A brave knight and a cunning thief..."
              value={characters}
              onChange={(e) => setCharacters(e.target.value)}
              className="input-field"
            />
            <div className="suggestions">
              {suggestions.characters.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setCharacters(suggestion)}
                  className="suggestion-chip"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="opening">Opening Line (optional)</label>
            <input
              id="opening"
              type="text"
              placeholder="e.g., The letter arrived on a Tuesday..."
              value={openingLine}
              onChange={(e) => setOpeningLine(e.target.value)}
              className="input-field"
            />
            <div className="suggestions">
              {suggestions.opening_lines.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setOpeningLine(suggestion)}
                  className="suggestion-chip"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startStory}
            disabled={loading}
            className="primary-button"
          >
            {loading ? '✨ Generating...' : '✨ Start Story'}
          </button>
        </div>
      )}

      {stage === 'story' && (
        <div className="story-container">
          <div className="story-text">
            {story.split('\n\n').map((paragraph, index) => (
              <div key={index} className="paragraph">
                <ReactMarkdown>{paragraph}</ReactMarkdown>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Generating next part...</p>
            </div>
          ) : (
            <div className="options-container">
              <h3>What happens next?</h3>
              <div className="options">
                {options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => continueStory(option)}
                    className="option-button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="action-buttons">
                <button onClick={endStory} className="end-button">
                  🏁 End Story
                </button>
                <button onClick={resetStory} className="reset-button">
                  🔄 Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {stage === 'ended' && (
        <div className="story-container">
          <div className="story-text">
            {story.split('\n\n').map((paragraph, index) => (
              <div key={index} className="paragraph">
                <ReactMarkdown>{paragraph}</ReactMarkdown>
              </div>
            ))}
          </div>
          <div className="end-message">
            <h3>✨ The End ✨</h3>
            <button onClick={resetStory} className="primary-button">
              Create Another Story
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
