import { useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import './App.css'
import mistralLogo from './assets/mistral-rainbow-white.png'
import { useAuth } from './contexts/AuthContext'
import AuthModal from './components/AuthModal'
import UserMenu from './components/UserMenu'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [view, setView] = useState('new') // new, saved
  const [stage, setStage] = useState('input') // input, story, ended
  const [storyId, setStoryId] = useState(null)
  const [genre, setGenre] = useState('')
  const [characters, setCharacters] = useState('')
  const [openingLine, setOpeningLine] = useState('')
  const [story, setStory] = useState('')
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [savedStories, setSavedStories] = useState([])
  const [suggestions, setSuggestions] = useState({
    genres: [],
    characters: [],
    opening_lines: []
  })

  // Fetch suggestions from AI
  const loadSuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const response = await axios.get(`${API_URL}/suggestions`)
      setSuggestions(response.data)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Load suggestions on mount
  useState(() => {
    loadSuggestions()
  }, [])

  // Fetch saved stories when switching to saved view
  const loadSavedStories = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }
    
    try {
      const response = await axios.get(`${API_URL}/stories`)
      setSavedStories(response.data)
    } catch (error) {
      console.error('Error loading saved stories:', error)
      if (error.response?.status === 401) {
        setShowAuthModal(true)
      }
    }
  }

  // Load a saved story
  const loadStory = async (id) => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }
    
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/stories/${id}`)
      const storyData = response.data
      
      setStoryId(id)
      setGenre(storyData.genre)
      
      // Reconstruct full story from segments
      const fullStory = storyData.segments.map(seg => seg.text).join('\n\n')
      setStory(fullStory)
      
      // If story is complete, go to ended stage
      if (storyData.is_complete) {
        setOptions([])
        setStage('ended')
      } else {
        // Get options from last segment
        const lastSegment = storyData.segments[storyData.segments.length - 1]
        setOptions(lastSegment.options || [])
        setStage('story')
      }
      
      setView('new')
    } catch (error) {
      console.error('Error loading story:', error)
      alert('Error loading story. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Delete a saved story
  const deleteStory = async (id) => {
    if (!confirm('Are you sure you want to delete this story?')) {
      return
    }
    
    try {
      await axios.delete(`${API_URL}/stories/${id}`)
      loadSavedStories()
    } catch (error) {
      console.error('Error deleting story:', error)
      alert('Error deleting story. Please try again.')
    }
  }

  const startStory = async () => {
    if (!genre.trim()) {
      alert('Please enter a genre!')
      return
    }

    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/start-story`, {
        genre,
        characters: characters || null,
        opening_line: openingLine || null
      })

      setStoryId(response.data.story_id)
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
        story_id: storyId,
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
        story_id: storyId,
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
    setStoryId(null)
    setGenre('')
    setCharacters('')
    setOpeningLine('')
    setStory('')
    setOptions([])
    // Reload suggestions for a fresh start
    loadSuggestions()
  }

  const switchToSavedView = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }
    setView('saved')
    loadSavedStories()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      
      <UserMenu onOpenAuth={() => setShowAuthModal(true)} />
      
      <header className="header">
        <h1>AI Story Generator</h1>
        <div className="subtitle-container">
          <p className="subtitle">Create your own interactive story with</p>
          <img src={mistralLogo} alt="Mistral AI" className="mistral-logo" />
        </div>
        <div className="nav-buttons">
          <button 
            onClick={() => { setView('new'); resetStory(); }} 
            className={`nav-button ${view === 'new' ? 'active' : ''}`}
          >
            ✨ New Story
          </button>
          <button 
            onClick={switchToSavedView} 
            className={`nav-button ${view === 'saved' ? 'active' : ''}`}
          >
            📚 My Stories
          </button>
        </div>
      </header>

      {view === 'saved' && (
        <div className="saved-stories-container">
          <h2>Your Saved Stories</h2>
          {savedStories.length === 0 ? (
            <div className="empty-state">
              <p>No saved stories yet. Create your first story!</p>
              <button onClick={() => setView('new')} className="primary-button">
                ✨ Start Writing
              </button>
            </div>
          ) : (
            <div className="stories-grid">
              {savedStories.map((storyItem) => (
                <div key={storyItem.story_id} className="story-card">
                  <div className="story-card-header">
                    <h3>{storyItem.title}</h3>
                    <span className={`status-badge ${storyItem.is_complete ? 'complete' : 'incomplete'}`}>
                      {storyItem.is_complete ? '✓ Complete' : '📝 In Progress'}
                    </span>
                  </div>
                  <div className="story-card-body">
                    <p className="story-genre">Genre: {storyItem.genre}</p>
                    <p className="story-meta">
                      {storyItem.segment_count} segment{storyItem.segment_count !== 1 ? 's' : ''}
                    </p>
                    <p className="story-date">
                      Last updated: {formatDate(storyItem.updated_at)}
                    </p>
                  </div>
                  <div className="story-card-actions">
                    <button 
                      onClick={() => loadStory(storyItem.story_id)} 
                      className="load-button"
                    >
                      {storyItem.is_complete ? '👁️ Read' : '▶️ Continue'}
                    </button>
                    <button 
                      onClick={() => deleteStory(storyItem.story_id)} 
                      className="delete-button"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'new' && stage === 'input' && (
        <div className="input-container">
          <div className="suggestions-header">
            <h3>✨ Get Inspired</h3>
            <button 
              onClick={loadSuggestions} 
              disabled={loadingSuggestions}
              className="refresh-suggestions-button"
              title="Generate new suggestions"
            >
              {loadingSuggestions ? '🔄 Generating...' : '🔄 New Suggestions'}
            </button>
          </div>

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

      {view === 'new' && stage === 'story' && (
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

      {view === 'new' && stage === 'ended' && (
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
