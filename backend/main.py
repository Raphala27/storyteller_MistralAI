from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage

load_dotenv()

app = FastAPI(title="AI Story Generator API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
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

class StoryContinuation(BaseModel):
    story_so_far: str
    chosen_option: str

class StoryEnd(BaseModel):
    story_so_far: str

class StoryResponse(BaseModel):
    story_text: str
    options: List[str]
    is_complete: bool = False

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
def get_suggestions():
    return {
        "genres": GENRE_SUGGESTIONS,
        "characters": CHARACTER_SUGGESTIONS,
        "opening_lines": OPENING_LINE_SUGGESTIONS
    }

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
        
        prompt += """\nWrite a compelling opening paragraph (3-4 sentences maximum) that sets the scene and hooks the reader.
Then suggest exactly 3 different ways the story could continue next. Format your response as:

STORY:
[Your opening paragraph here]

OPTIONS:
1. [First possible continuation]
2. [Second possible continuation]
3. [Third possible continuation]"""

        messages = [
            ChatMessage(role="user", content=prompt)
        ]

        response = mistral_client.chat(
            model="mistral-small-latest",
            messages=messages,
            temperature=0.8,
            max_tokens=400
        )

        content = response.choices[0].message.content
        
        # Parse the response
        story_text, options = parse_story_response(content)
        
        return StoryResponse(
            story_text=story_text,
            options=options,
            is_complete=False
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

Write the next part of the story (3-4 sentences maximum) based on this choice.
Then suggest exactly 3 different ways the story could continue next.

Format your response as:

STORY:
[Your continuation paragraph here]

OPTIONS:
1. [First possible continuation]
2. [Second possible continuation]
3. [Third possible continuation]"""

        messages = [
            ChatMessage(role="user", content=prompt)
        ]

        response = mistral_client.chat(
            model="mistral-small-latest",
            messages=messages,
            temperature=0.8,
            max_tokens=400
        )

        content = response.choices[0].message.content
        
        # Parse the response
        story_text, options = parse_story_response(content)
        
        return StoryResponse(
            story_text=story_text,
            options=options,
            is_complete=False
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error continuing story: {str(e)}")

@app.post("/end-story", response_model=StoryResponse)
async def end_story(story_end: StoryEnd):
    """Generate an ending for the story"""
    try:
        prompt = f"""You are concluding a story. Here's what has happened so far:

{story_end.story_so_far}

Write a satisfying conclusion to this story in 4-5 sentences. Make it meaningful and bring closure to the narrative.

Format your response as:

STORY:
[Your conclusion here]"""

        messages = [
            ChatMessage(role="user", content=prompt)
        ]

        response = mistral_client.chat(
            model="mistral-small-latest",
            messages=messages,
            temperature=0.7,
            max_tokens=300
        )

        content = response.choices[0].message.content
        
        # Extract just the story part
        if "STORY:" in content:
            story_text = content.split("STORY:")[1].strip()
        else:
            story_text = content.strip()
        
        return StoryResponse(
            story_text=story_text,
            options=[],
            is_complete=True
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
