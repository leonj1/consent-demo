from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SongBase(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None
    duration: Optional[int] = None

class SongCreate(SongBase):
    pass

class Song(SongBase):
    id: int
    playlist_id: int
    
    class Config:
        from_attributes = True

class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None

class PlaylistCreate(PlaylistBase):
    pass

class Playlist(PlaylistBase):
    id: int
    created_at: datetime
    songs: List[Song] = []
    
    class Config:
        from_attributes = True