from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import re
from dotenv import load_dotenv
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from datetime import datetime
import uuid
from storage import storage

load_dotenv()

app = FastAPI(title="AI Story Generator API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://storyteller-mistralai.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Mistral client
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY not found in environment variables")

mistral_client = MistralClient(api_key=MISTRAL_API_KEY)

# Models
class StoryStart(BaseModel):
    genre: str
    characters: Optional[str] = None
    opening_line: Optional[str] = None
    story_id: Optional[str] = None  # Optional ID to continue existing story

class StoryContinuation(BaseModel):
    story_so_far: str
    chosen_option: str
    story_id: Optional[str] = None  # Story ID for saving

class StoryEnd(BaseModel):
    story_so_far: str
    story_id: Optional[str] = None  # Story ID for saving

class StoryResponse(BaseModel):
    story_text: str
    options: List[str]
    is_complete: bool = False
    story_id: Optional[str] = None  # Return story ID for frontend

class StorySummary(BaseModel):
    id: str
    title: str
    genre: str
    is_complete: bool
    created_at: str
    updated_at: str
    segment_count: int

class StoryDetail(BaseModel):
    id: str
    title: str
    genre: str
    characters: Optional[str]
    opening_line: Optional[str]
    segments: List[dict]
    is_complete: bool
    created_at: str
    updated_at: str

# Starter suggestions
GENRE_SUGGESTIONS = [
    "Fantasy Adventure",
    "Sci-Fi Mystery",
    "Horror Thriller",
    "Romance Comedy",
    "Detective Noir",
    "Post-Apocalyptic"
]

CHARACTER_SUGGESTIONS = [
    "A brave knight and a cunning thief",
    "An alien scientist and a human astronaut",
    "A ghost hunter and a friendly ghost",
    "A chef and a food critic",
    "A detective and their AI partner",
    "A time traveler and a historian"
]

OPENING_LINE_SUGGESTIONS = [
    "The letter arrived on a Tuesday, written in an alphabet nobody could read.",
    "When the clock struck thirteen, everything changed.",
    "She had always known this day would come, but not like this.",
    "The last human on Earth sat alone in a room. Then came a knock at the door.",
    "I've made a terrible mistake, and now the universe is paying for it.",
    "The map was clear: X marks the spot. The problem? The spot was moving."
]

@app.get("/")
def read_root():
    return {"message": "AI Story Generator API is running"}

@app.get("/suggestions")
async def get_suggestions():
    """Generate dynamic suggestions using MistralAI"""
    try:
        prompt = """Generate creative and diverse suggestions for starting a story. Return ONLY a valid JSON object with exactly this structure, no other text:

{
  "genres": ["genre1", "genre2", "genre3", "genre4", "genre5", "genre6"],
  "characters": ["character1", "character2", "character3", "character4", "character5", "character6"],
  "opening_lines": ["line1", "line2", "line3", "line4", "line5", "line6"]
}

Requirements:
- 6 unique, creative genres (e.g., "Cyberpunk Mystery", "Victorian Horror", "Space Opera")
- 6 character pairs/groups (e.g., "A rebel pilot and a rogue AI", "A vampire chef and a werewolf food critic")
- 6 intriguing opening lines (each 10-20 words, hooks the reader immediately)

Make them diverse, creative, and different from common examples. Return ONLY the JSON, nothing else."""

        messages = [ChatMessage(role="user", content=prompt)]
        
        response = mistral_client.chat(
            model="mistral-small-latest",
            messages=messages,
            temperature=0.9,  # Higher temperature for more creativity
            max_tokens=600
        )
        
        suggestions_text = response.choices[0].message.content.strip()
        
        # Try to extract JSON from the response
        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', suggestions_text, re.DOTALL)
        if json_match:
            suggestions_json = json.loads(json_match.group())
        else:
            suggestions_json = json.loads(suggestions_text)
        
        # Validate the structure
        if not all(key in suggestions_json for key in ["genres", "characters", "opening_lines"]):
            raise ValueError("Invalid suggestions structure")
        
        return suggestions_json
        
    except Exception as e:
        print(f"Error generating suggestions: {e}")
        # Fallback to static suggestions if AI generation fails
        return {
            "genres": GENRE_SUGGESTIONS,
            "characters": CHARACTER_SUGGESTIONS,
            "opening_lines": OPENING_LINE_SUGGESTIONS
        }

@app.get("/stories", response_model=List[StorySummary])
async def list_stories():
    """Get list of all saved stories"""
    stories = storage.list_stories()
    return stories

@app.get("/stories/{story_id}", response_model=StoryDetail)
async def get_story(story_id: str):
    """Get a specific story by ID"""
    story = storage.load_story(story_id)
    
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    return story

@app.delete("/stories/{story_id}")
async def delete_story(story_id: str):
    """Delete a story"""
    success = storage.delete_story(story_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Story not found")
    
    return {"message": "Story deleted successfully"}

@app.post("/start-story", response_model=StoryResponse)
async def start_story(story_start: StoryStart):
    """Start a new story based on user inputs"""
    try:
        # Build the prompt
        prompt = f"""You are a creative storyteller. Generate the opening paragraph of a story with the following details:
Genre: {story_start.genre}
"""
        if story_start.characters:
            prompt += f"Characters: {story_start.characters}\n"
        if story_start.opening_line:
            prompt += f"Opening line: {story_start.opening_line}\n"
        
        prompt += """\nWrite a compelling opening paragraph (10-15 sentences) that sets the scene and hooks the reader. Build atmosphere, introduce key elements naturally, and create vivid imagery.

IMPORTANT: The story paragraph MUST be at least 10-15 complete sentences. Write a full, detailed, immersive opening that develops the scene thoroughly. Do NOT write just 2-3 short paragraphs - expand the story with rich details, character thoughts, atmospheric descriptions, and plot development.

You can use markdown formatting to emphasize parts of the story:
- Use **bold** for emphasis or important elements
- Use *italics* for thoughts or special terms
- Keep it readable and don't overuse formatting

Then suggest exactly 3 different ways the story could continue next. Keep each option SHORT (5-7 words max) - just a brief guideline.

Format your response as:

STORY:
[Your opening paragraph here - MUST be detailed and immersive, at least 10-15 complete sentences with rich development]

OPTIONS:
1. [Short option - 5-7 words]
2. [Short option - 5-7 words]
3. [Short option - 5-7 words]"""

        messages = [
            ChatMessage(role="user", content=prompt)
        ]

        response = mistral_client.chat(
            model="mistral-small-latest",
            messages=messages,
            temperature=0.8,
            max_tokens=2000
        )

        content = response.choices[0].message.content
        
        # Parse the response
        story_text, options = parse_story_response(content)
        
        # Generate story ID and save
        story_id = story_start.story_id or str(uuid.uuid4())
        
        # Generate title from genre and first few words
        title_words = story_text.split()[:5]
        title = ' '.join(title_words) + '...' if len(title_words) == 5 else story_text[:50] + '...'
        
        # Create story data
        story_data = {
            'id': story_id,
            'title': title,
            'genre': story_start.genre,
            'characters': story_start.characters,
            'opening_line': story_start.opening_line,
            'segments': [
                {
                    'text': story_text,
                    'options': options,
                    'chosen_option': None,
                    'timestamp': datetime.now().isoformat()
                }
            ],
            'is_complete': False,
            'created_at': datetime.now().isoformat()
        }
        
        # Save story
        storage.save_story(story_id, story_data)
        
        return StoryResponse(
            story_text=story_text,
            options=options,
            is_complete=False,
            story_id=story_id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating story: {str(e)}")

@app.post("/continue-story", response_model=StoryResponse)
async def continue_story(continuation: StoryContinuation):
    """Continue the story based on the user's chosen option"""
    try:
        prompt = f"""You are continuing a story. Here's what has happened so far:

{continuation.story_so_far}

The reader chose: {continuation.chosen_option}

Write the next part of the story (10-15 sentences) based on this choice. Develop the scene with rich detail, advance the plot meaningfully, and create an immersive experience. Make it substantial and engaging.

IMPORTANT: The story continuation MUST be at least 10-15 complete sentences. Write a full, detailed paragraph that thoroughly develops the scene. Do NOT write just 2-3 short paragraphs - expand with rich details, character emotions, dialogue, atmospheric descriptions, and significant plot progression.

You can use markdown formatting to emphasize parts of the story:
- Use **bold** for emphasis or important elements
- Use *italics* for thoughts or special terms
- Keep it readable and don't overuse formatting

Then suggest exactly 3 different ways the story could continue next. Keep each option SHORT (5-7 words max) - just a brief guideline.

Format your response as:

STORY:
[Your continuation paragraph here - MUST be detailed and immersive, at least 10-15 complete sentences with deep development]

OPTIONS:
1. [Short option - 5-7 words]
2. [Short option - 5-7 words]
3. [Short option - 5-7 words]"""

        messages = [
            ChatMessage(role="user", content=prompt)
        ]

        response = mistral_client.chat(
            model="mistral-small-latest",
            messages=messages,
            temperature=0.8,
            max_tokens=2000
        )

        content = response.choices[0].message.content
        
        # Parse the response
        story_text, options = parse_story_response(content)
        
        # Update story if story_id is provided
        if continuation.story_id:
            story_data = storage.load_story(continuation.story_id)
            
            if story_data:
                # Add new segment
                story_data['segments'].append({
                    'text': story_text,
                    'options': options,
                    'chosen_option': continuation.chosen_option,
                    'timestamp': datetime.now().isoformat()
                })
                
                # Save updated story
                storage.save_story(continuation.story_id, story_data)
        
        return StoryResponse(
            story_text=story_text,
            options=options,
            is_complete=False,
            story_id=continuation.story_id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error continuing story: {str(e)}")

@app.post("/end-story", response_model=StoryResponse)
async def end_story(story_end: StoryEnd):
    """Generate an ending for the story"""
    try:
        prompt = f"""You are concluding a story. Here's what has happened so far:

{story_end.story_so_far}

Write a satisfying conclusion to this story in 12-18 sentences. Make it meaningful, bring closure to the narrative, create emotional impact, and leave a lasting impression. This is the finale - make it memorable and complete.
You can use markdown formatting to emphasize parts of the story:
- Use **bold** for emphasis or important elements
- Use *italics* for thoughts or special terms
- Keep it readable and don't overuse formatting

Format your response as:

STORY:
[Your conclusion here - make it detailed, emotional, and complete]"""

        messages = [
            ChatMessage(role="user", content=prompt)
        ]

        response = mistral_client.chat(
            model="mistral-small-latest",
            messages=messages,
            temperature=0.7,
            max_tokens=2500
        )

        content = response.choices[0].message.content
        
        # Extract just the story part
        if "STORY:" in content:
            story_text = content.split("STORY:")[1].strip()
        else:
            story_text = content.strip()
        
        # Update story if story_id is provided
        if story_end.story_id:
            story_data = storage.load_story(story_end.story_id)
            
            if story_data:
                # Add final segment
                story_data['segments'].append({
                    'text': story_text,
                    'options': [],
                    'chosen_option': 'End Story',
                    'timestamp': datetime.now().isoformat()
                })
                
                # Mark as complete
                story_data['is_complete'] = True
                
                # Save updated story
                storage.save_story(story_end.story_id, story_data)
        
        return StoryResponse(
            story_text=story_text,
            options=[],
            is_complete=True,
            story_id=story_end.story_id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ending story: {str(e)}")

def parse_story_response(content: str) -> tuple[str, List[str]]:
    """Parse the AI response to extract story text and options"""
    try:
        parts = content.split("OPTIONS:")
        story_text = parts[0].replace("STORY:", "").strip()
        
        if len(parts) > 1:
            options_text = parts[1].strip()
            options = []
            for line in options_text.split("\n"):
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith("-")):
                    # Remove numbering and leading characters
                    option = line.lstrip("0123456789.-) ").strip()
                    if option:
                        options.append(option)
            
            # Ensure we have exactly 3 options
            if len(options) < 3:
                options.extend([
                    "Continue with an unexpected twist",
                    "Take a different direction",
                    "Reveal something surprising"
                ][:3 - len(options)])
            
            return story_text, options[:3]
        else:
            # Fallback if format is not as expected
            return content.strip(), [
                "Continue with an unexpected twist",
                "Take a different direction",
                "Reveal something surprising"
            ]
    except Exception as e:
        # Fallback in case of parsing errors
        return content.strip(), [
            "Continue the adventure",
            "Take a different path",
            "Something unexpected happens"
        ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
