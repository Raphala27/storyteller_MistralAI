import { useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import './App.css'
import mistralLogo from './assets/mistral-rainbow-white.png'
import { useAuth } from './contexts/AuthContext'
import AuthModal from './components/AuthModal'
import UserMenu from './components/UserMenu'
import ErrorPopup from './components/ErrorPopup'
import {
  getLocalStories,
  saveLocalStory,
  getLocalStory,
  deleteLocalStory,
  canCreateLocalStory,
  formatLocalStoryForDisplay
} from './utils/localStorageStories'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [errorPopup, setErrorPopup] = useState({ message: '', type: 'error', onConfirm: null })
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
  const [manualRefreshesLeft, setManualRefreshesLeft] = useState(3)

  // Constants for suggestion caching
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds
  const MAX_DAILY_REFRESHES = 3

  // Get cached suggestions from localStorage
  const getCachedSuggestions = () => {
    try {
      const cached = localStorage.getItem('suggestions_cache')
      if (!cached) return null
      
      const { data, timestamp } = JSON.parse(cached)
      const now = Date.now()
      
      // Check if cache is still valid (within 5 minutes)
      if (now - timestamp < CACHE_DURATION) {
        return data
      }
      return null
    } catch (error) {
      console.error('Error reading cached suggestions:', error)
      return null
    }
  }

  // Save suggestions to cache
  const cacheSuggestions = (data) => {
    try {
      localStorage.setItem('suggestions_cache', JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Error caching suggestions:', error)
    }
  }

  // Get today's refresh count
  const getDailyRefreshData = () => {
    try {
      const stored = localStorage.getItem('suggestions_refresh_count')
      if (!stored) return { count: 0, date: new Date().toDateString() }
      
      const { count, date } = JSON.parse(stored)
      const today = new Date().toDateString()
      
      // Reset count if it's a new day
      if (date !== today) {
        return { count: 0, date: today }
      }
      return { count, date }
    } catch (error) {
      console.error('Error reading refresh count:', error)
      return { count: 0, date: new Date().toDateString() }
    }
  }

  // Increment refresh count
  const incrementRefreshCount = () => {
    const { count, date } = getDailyRefreshData()
    const newCount = count + 1
    localStorage.setItem('suggestions_refresh_count', JSON.stringify({
      count: newCount,
      date
    }))
    setManualRefreshesLeft(MAX_DAILY_REFRESHES - newCount)
    return newCount
  }

  // Fetch suggestions from AI
  const loadSuggestions = async (isManual = false) => {
    // Check cache first
    const cached = getCachedSuggestions()
    if (cached && !isManual) {
      setSuggestions(cached)
      return
    }

    // Check daily limit for manual refreshes
    if (isManual) {
      const { count } = getDailyRefreshData()
      if (count >= MAX_DAILY_REFRESHES) {
        showPopup(
          `You've reached your daily limit of ${MAX_DAILY_REFRESHES} manual refreshes. Suggestions will auto-refresh every 5 minutes.`,
          'warning'
        )
        return
      }
    }

    setLoadingSuggestions(true)
    try {
      const response = await axios.get(`${API_URL}/suggestions`)
      setSuggestions(response.data)
      cacheSuggestions(response.data)
      
      if (isManual) {
        incrementRefreshCount()
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      showPopup('Failed to load suggestions. Please try again later.', 'error')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Helper function to show error/warning popup
  const showPopup = (message, type = 'error', onConfirm = null) => {
    setErrorPopup({ message, type, onConfirm })
  }

  const closePopup = () => {
    setErrorPopup({ message: '', type: 'error', onConfirm: null })
  }

  // Load suggestions on mount and update refresh count display
  useEffect(() => {
    loadSuggestions(false) // Auto-load on mount (not manual)
    const { count } = getDailyRefreshData()
    setManualRefreshesLeft(MAX_DAILY_REFRESHES - count)
  }, [])

  // Fetch saved stories when switching to saved view
  const loadSavedStories = async () => {
    if (isAuthenticated) {
      // Load from API for authenticated users
      try {
        const response = await axios.get(`${API_URL}/stories`)
        setSavedStories(response.data)
      } catch (error) {
        console.error('Error loading saved stories:', error)
        if (error.response?.status === 401) {
          setShowAuthModal(true)
        }
      }
    } else {
      // Load from localStorage for non-authenticated users
      const localStories = getLocalStories()
      const formatted = localStories.map(formatLocalStoryForDisplay)
      setSavedStories(formatted)
    }
  }

  // Load a saved story
  const loadStory = async (id, isLocal = false) => {
    setLoading(true)
    try {
      let storyData
      
      if (isLocal) {
        // Load from localStorage
        storyData = getLocalStory(id)
        if (!storyData) {
          showPopup('Story not found', 'warning')
          return
        }
      } else {
        // Load from API
        if (!isAuthenticated) {
          setShowAuthModal(true)
          return
        }
        const response = await axios.get(`${API_URL}/stories/${id}`)
        storyData = response.data
      }
      
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
      showPopup('Error loading story. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Delete a saved story
  const deleteStory = async (id, isLocal = false) => {
    // Show confirmation popup
    showPopup(
      'Are you sure you want to delete this story? This action cannot be undone.',
      'confirm',
      async () => {
        closePopup()
        try {
          if (isLocal) {
            // Delete from localStorage
            deleteLocalStory(id)
          } else {
            // Delete from API
            await axios.delete(`${API_URL}/stories/${id}`)
          }
          loadSavedStories()
        } catch (error) {
          console.error('Error deleting story:', error)
          showPopup('Error deleting story. Please try again.', 'error')
        }
      }
    )
  }

  const startStory = async () => {
    if (!genre.trim()) {
      showPopup('Please enter a genre!', 'warning')
      return
    }

    // Check if non-authenticated user can create more stories
    if (!isAuthenticated && !canCreateLocalStory()) {
      showPopup('You have reached the maximum of 3 stories. Please login to save unlimited stories, or delete an existing story.', 'warning')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/start-story`, {
        genre,
        characters: characters || null,
        opening_line: openingLine || null
      })

      const newStoryId = response.data.story_id
      const storyText = response.data.story_text
      const storyOptions = response.data.options
      
      setStoryId(newStoryId)
      setStory(storyText)
      setOptions(storyOptions)
      setStage('story')
      
      // Save to localStorage if not authenticated
      if (!isAuthenticated) {
        const titleWords = storyText.split(' ').slice(0, 5).join(' ')
        const title = titleWords.length < 50 ? titleWords + '...' : storyText.substring(0, 50) + '...'
        
        saveLocalStory({
          id: newStoryId,
          title: title,
          genre: genre,
          characters: characters,
          opening_line: openingLine,
          segments: [{
            text: storyText,
            options: storyOptions,
            chosen_option: null,
            timestamp: new Date().toISOString()
          }],
          is_complete: false,
          created_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error starting story:', error)
      showPopup('Error starting story. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const continueStory = async (chosenOption) => {
    setLoading(true)
    const existingStory = story
    
    try {
      const response = await axios.post(`${API_URL}/continue-story`, {
        story_id: storyId,
        story_so_far: story,
        chosen_option: chosenOption
      })

      const newText = response.data.story_text
      const newOptions = response.data.options
      
      setStory(existingStory + '\n\n' + newText)
      setOptions(newOptions)
      
      // Update localStorage if not authenticated
      if (!isAuthenticated && storyId) {
        const localStory = getLocalStory(storyId)
        if (localStory) {
          localStory.segments.push({
            text: newText,
            options: newOptions,
            chosen_option: chosenOption,
            timestamp: new Date().toISOString()
          })
          saveLocalStory(localStory)
        }
      }
    } catch (error) {
      console.error('Error continuing story:', error)
      showPopup('Error continuing story. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const endStory = async () => {
    setLoading(true)
    const existingStory = story
    
    try {
      const response = await axios.post(`${API_URL}/end-story`, {
        story_id: storyId,
        story_so_far: story
      })

      const finalText = response.data.story_text
      
      setStory(existingStory + '\n\n' + finalText)
      setOptions([])
      setStage('ended')
      
      // Update localStorage if not authenticated
      if (!isAuthenticated && storyId) {
        const localStory = getLocalStory(storyId)
        if (localStory) {
          localStory.segments.push({
            text: finalText,
            options: [],
            chosen_option: 'End Story',
            timestamp: new Date().toISOString()
          })
          localStory.is_complete = true
          saveLocalStory(localStory)
        }
      }
    } catch (error) {
      console.error('Error ending story:', error)
      showPopup('Error ending story. Please try again.', 'error')
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
    // Don't reload suggestions automatically - use cache or manual refresh
  }

  const switchToSavedView = () => {
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
      {errorPopup.message && (
        <ErrorPopup 
          message={errorPopup.message} 
          type={errorPopup.type}
          onClose={closePopup}
          onConfirm={errorPopup.onConfirm}
        />
      )}
      
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
          {!isAuthenticated && (
            <div className="local-storage-notice">
              <p>📦 Showing local stories (max 3). <button onClick={() => setShowAuthModal(true)} className="link-button">Login</button> to save unlimited stories!</p>
            </div>
          )}
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
                    <div className="story-badges">
                      <span className={`status-badge ${storyItem.is_complete ? 'complete' : 'incomplete'}`}>
                        {storyItem.is_complete ? '✓ Complete' : '📝 In Progress'}
                      </span>
                      {storyItem.isLocal && (
                        <span className="local-badge" title="Stored locally">💾 Local</span>
                      )}
                    </div>
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
                      onClick={() => loadStory(storyItem.story_id, storyItem.isLocal)} 
                      className="load-button"
                    >
                      {storyItem.is_complete ? '👁️ Read' : '▶️ Continue'}
                    </button>
                    <button 
                      onClick={() => deleteStory(storyItem.story_id, storyItem.isLocal)} 
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
              onClick={() => loadSuggestions(true)} // Manual refresh
              disabled={loadingSuggestions || manualRefreshesLeft === 0}
              className="refresh-suggestions-button"
              title={
                manualRefreshesLeft === 0 
                  ? 'Daily limit reached. Auto-refreshes every 5 min' 
                  : `Generate new suggestions (${manualRefreshesLeft} left today)`
              }
            >
              {loadingSuggestions 
                ? '🔄 Generating...' 
                : `🔄 New Suggestions (${manualRefreshesLeft}/3)`
              }
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
          {story ? (
            <div className="story-text">
              {story.split('\n\n').map((paragraph, index) => (
                <div key={index} className="paragraph">
                  <ReactMarkdown>{paragraph}</ReactMarkdown>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">
              <div className="spinner"></div>
              <p>Starting your story...</p>
            </div>
          )}

          {loading && story ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Generating next part...</p>
            </div>
          ) : !loading && options.length > 0 ? (
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
          ) : null}
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
