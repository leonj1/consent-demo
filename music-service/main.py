from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db, create_tables

app = FastAPI(
    title="Music Playlist API",
    description="A simple API to manage music playlists",
    version="1.0.0"
)

# Create tables on startup
create_tables()

# Playlist endpoints
@app.post("/playlists/", response_model=schemas.Playlist)
def create_playlist(playlist: schemas.PlaylistCreate, db: Session = Depends(get_db)):
    db_playlist = models.Playlist(**playlist.dict())
    db.add(db_playlist)
    db.commit()
    db.refresh(db_playlist)
    return db_playlist

@app.get("/playlists/", response_model=List[schemas.Playlist])
def get_playlists(db: Session = Depends(get_db)):
    return db.query(models.Playlist).all()

@app.get("/playlists/{playlist_id}", response_model=schemas.Playlist)
def get_playlist(playlist_id: int, db: Session = Depends(get_db)):
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@app.put("/playlists/{playlist_id}", response_model=schemas.Playlist)
def update_playlist(playlist_id: int, playlist: schemas.PlaylistCreate, db: Session = Depends(get_db)):
    db_playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    if not db_playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    for key, value in playlist.dict().items():
        setattr(db_playlist, key, value)
    
    db.commit()
    db.refresh(db_playlist)
    return db_playlist

@app.delete("/playlists/{playlist_id}")
def delete_playlist(playlist_id: int, db: Session = Depends(get_db)):
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    db.delete(playlist)
    db.commit()
    return {"message": "Playlist deleted successfully"}

# Song endpoints
@app.post("/playlists/{playlist_id}/songs/", response_model=schemas.Song)
def add_song_to_playlist(playlist_id: int, song: schemas.SongCreate, db: Session = Depends(get_db)):
    # Check if playlist exists
    playlist = db.query(models.Playlist).filter(models.Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    db_song = models.Song(**song.dict(), playlist_id=playlist_id)
    db.add(db_song)
    db.commit()
    db.refresh(db_song)
    return db_song

@app.get("/songs/", response_model=List[schemas.Song])
def get_all_songs(db: Session = Depends(get_db)):
    return db.query(models.Song).all()

@app.get("/playlists/{playlist_id}/songs/", response_model=List[schemas.Song])
def get_playlist_songs(playlist_id: int, db: Session = Depends(get_db)):
    return db.query(models.Song).filter(models.Song.playlist_id == playlist_id).all()

@app.delete("/songs/{song_id}")
def delete_song(song_id: int, db: Session = Depends(get_db)):
    song = db.query(models.Song).filter(models.Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    db.delete(song)
    db.commit()
    return {"message": "Song deleted successfully"}

@app.get("/")
def root():
    return {"message": "Welcome to Music Playlist API! Visit /docs for Swagger documentation"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)