import pytest
from fastapi.testclient import TestClient

def create_playlist_and_get_id(client: TestClient, playlist_data):
    """Helper function to create a playlist and return its ID"""
    response = client.post("/playlists/", json=playlist_data)
    assert response.status_code == 200
    return response.json()["id"]

def test_add_song_to_playlist(client: TestClient, sample_playlist_data, sample_song_data):
    # Create playlist first
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    
    # Add song to playlist
    response = client.post(f"/playlists/{playlist_id}/songs/", json=sample_song_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == sample_song_data["title"]
    assert data["artist"] == sample_song_data["artist"]
    assert data["album"] == sample_song_data["album"]
    assert data["duration"] == sample_song_data["duration"]
    assert data["playlist_id"] == playlist_id
    assert "id" in data

def test_add_song_to_nonexistent_playlist(client: TestClient, sample_song_data):
    response = client.post("/playlists/999/songs/", json=sample_song_data)
    assert response.status_code == 404
    assert response.json()["detail"] == "Playlist not found"

def test_get_all_songs(client: TestClient, sample_playlist_data, sample_song_data):
    # Create playlist and add song
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    client.post(f"/playlists/{playlist_id}/songs/", json=sample_song_data)
    
    # Get all songs
    response = client.get("/songs/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == sample_song_data["title"]

def test_get_all_songs_empty(client: TestClient):
    response = client.get("/songs/")
    assert response.status_code == 200
    assert response.json() == []

def test_get_playlist_songs(client: TestClient, sample_playlist_data, sample_song_data):
    # Create playlist and add song
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    client.post(f"/playlists/{playlist_id}/songs/", json=sample_song_data)
    
    # Get songs from specific playlist
    response = client.get(f"/playlists/{playlist_id}/songs/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == sample_song_data["title"]
    assert data[0]["playlist_id"] == playlist_id

def test_get_playlist_songs_empty(client: TestClient, sample_playlist_data):
    # Create empty playlist
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    
    # Get songs from empty playlist
    response = client.get(f"/playlists/{playlist_id}/songs/")
    assert response.status_code == 200
    assert response.json() == []

def test_delete_song(client: TestClient, sample_playlist_data, sample_song_data):
    # Create playlist and add song
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    song_response = client.post(f"/playlists/{playlist_id}/songs/", json=sample_song_data)
    song_id = song_response.json()["id"]
    
    # Delete the song
    response = client.delete(f"/songs/{song_id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Song deleted successfully"
    
    # Verify song is deleted
    get_response = client.get(f"/playlists/{playlist_id}/songs/")
    assert get_response.status_code == 200
    assert get_response.json() == []

def test_delete_song_not_found(client: TestClient):
    response = client.delete("/songs/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Song not found"

def test_add_multiple_songs_to_playlist(client: TestClient, sample_playlist_data):
    # Create playlist
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    
    # Add multiple songs
    songs = [
        {"title": "Bohemian Rhapsody", "artist": "Queen", "album": "A Night at the Opera", "duration": 355},
        {"title": "Stairway to Heaven", "artist": "Led Zeppelin", "album": "Led Zeppelin IV", "duration": 482},
        {"title": "Hotel California", "artist": "Eagles", "album": "Hotel California", "duration": 391}
    ]
    
    for song in songs:
        response = client.post(f"/playlists/{playlist_id}/songs/", json=song)
        assert response.status_code == 200
    
    # Get all songs from playlist
    response = client.get(f"/playlists/{playlist_id}/songs/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    
    # Verify all songs are present
    song_titles = [s["title"] for s in data]
    assert "Bohemian Rhapsody" in song_titles
    assert "Stairway to Heaven" in song_titles
    assert "Hotel California" in song_titles

def test_add_song_with_minimal_data(client: TestClient, sample_playlist_data):
    # Create playlist
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    
    # Add song with only required fields
    minimal_song = {"title": "Test Song", "artist": "Test Artist"}
    response = client.post(f"/playlists/{playlist_id}/songs/", json=minimal_song)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == minimal_song["title"]
    assert data["artist"] == minimal_song["artist"]
    assert data["album"] is None
    assert data["duration"] is None

def test_songs_across_multiple_playlists(client: TestClient):
    # Create two playlists
    playlist1_data = {"name": "Rock Playlist"}
    playlist2_data = {"name": "Pop Playlist"}
    
    playlist1_id = create_playlist_and_get_id(client, playlist1_data)
    playlist2_id = create_playlist_and_get_id(client, playlist2_data)
    
    # Add songs to each playlist
    rock_song = {"title": "Thunderstruck", "artist": "AC/DC"}
    pop_song = {"title": "Shape of You", "artist": "Ed Sheeran"}
    
    client.post(f"/playlists/{playlist1_id}/songs/", json=rock_song)
    client.post(f"/playlists/{playlist2_id}/songs/", json=pop_song)
    
    # Verify songs are in correct playlists
    rock_response = client.get(f"/playlists/{playlist1_id}/songs/")
    pop_response = client.get(f"/playlists/{playlist2_id}/songs/")
    
    assert len(rock_response.json()) == 1
    assert len(pop_response.json()) == 1
    assert rock_response.json()[0]["title"] == "Thunderstruck"
    assert pop_response.json()[0]["title"] == "Shape of You"
    
    # Verify total songs count
    all_songs_response = client.get("/songs/")
    assert len(all_songs_response.json()) == 2