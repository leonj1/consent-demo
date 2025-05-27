import pytest
from fastapi.testclient import TestClient

def test_root_endpoint(client: TestClient):
    """Test the root endpoint returns welcome message"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Welcome to Music Playlist API" in data["message"]
    assert "/docs" in data["message"]

def test_invalid_playlist_id_type(client: TestClient):
    """Test that non-integer playlist IDs return proper error"""
    response = client.get("/playlists/not_a_number")
    assert response.status_code == 422  # Validation error

def test_invalid_song_id_type(client: TestClient):
    """Test that non-integer song IDs return proper error"""
    response = client.delete("/songs/not_a_number")
    assert response.status_code == 422  # Validation error

def test_empty_playlist_name(client: TestClient):
    """Test creating playlist with empty name"""
    empty_name_data = {"name": "", "description": "Test description"}
    response = client.post("/playlists/", json=empty_name_data)
    # Should still work as empty string is valid, just not ideal
    assert response.status_code == 200

def test_missing_required_playlist_fields(client: TestClient):
    """Test creating playlist without required name field"""
    incomplete_data = {"description": "Missing name field"}
    response = client.post("/playlists/", json=incomplete_data)
    assert response.status_code == 422  # Validation error

def test_missing_required_song_fields(client: TestClient, sample_playlist_data):
    """Test adding song without required fields"""
    # Create playlist first
    playlist_response = client.post("/playlists/", json=sample_playlist_data)
    playlist_id = playlist_response.json()["id"]
    
    # Try to add song without title
    incomplete_song = {"artist": "Test Artist"}
    response = client.post(f"/playlists/{playlist_id}/songs/", json=incomplete_song)
    assert response.status_code == 422  # Validation error
    
    # Try to add song without artist
    incomplete_song2 = {"title": "Test Title"}
    response2 = client.post(f"/playlists/{playlist_id}/songs/", json=incomplete_song2)
    assert response2.status_code == 422  # Validation error

def test_invalid_json_payload(client: TestClient):
    """Test sending invalid JSON"""
    # This would typically be handled by FastAPI automatically
    # but we can test malformed requests
    headers = {"content-type": "application/json"}
    response = client.post("/playlists/", data="invalid json", headers=headers)
    assert response.status_code == 422

def test_negative_song_duration(client: TestClient, sample_playlist_data):
    """Test adding song with negative duration"""
    # Create playlist first
    playlist_response = client.post("/playlists/", json=sample_playlist_data)
    playlist_id = playlist_response.json()["id"]
    
    # Add song with negative duration (should be allowed as Optional field)
    song_with_negative_duration = {
        "title": "Test Song",
        "artist": "Test Artist",
        "duration": -100
    }
    response = client.post(f"/playlists/{playlist_id}/songs/", json=song_with_negative_duration)
    # This should work as duration validation is not implemented
    assert response.status_code == 200

def test_very_long_strings(client: TestClient, sample_playlist_data):
    """Test with very long string inputs"""
    # Create playlist with very long name
    long_string = "x" * 1000
    long_name_playlist = {"name": long_string, "description": "Test"}
    response = client.post("/playlists/", json=long_name_playlist)
    # Should work unless database has length constraints
    assert response.status_code == 200
    
    playlist_id = response.json()["id"]
    
    # Add song with very long title
    long_title_song = {
        "title": long_string,
        "artist": "Test Artist"
    }
    song_response = client.post(f"/playlists/{playlist_id}/songs/", json=long_title_song)
    assert song_response.status_code == 200

def test_special_characters_in_strings(client: TestClient, sample_playlist_data):
    """Test with special characters in input"""
    # Create playlist first
    playlist_response = client.post("/playlists/", json=sample_playlist_data)
    playlist_id = playlist_response.json()["id"]
    
    # Add song with special characters
    special_chars_song = {
        "title": "Test Song with émojis 🎵 and spëcial chars!",
        "artist": "Artíst with açcénts & symbols @#$%",
        "album": "Album (2023) [Remastered] - Special Edition"
    }
    response = client.post(f"/playlists/{playlist_id}/songs/", json=special_chars_song)
    assert response.status_code == 200
    
    # Verify special characters are preserved
    data = response.json()
    assert "🎵" in data["title"]
    assert "açcénts" in data["artist"]

def test_null_values_in_optional_fields(client: TestClient, sample_playlist_data):
    """Test explicitly setting optional fields to null"""
    # Create playlist first
    playlist_response = client.post("/playlists/", json=sample_playlist_data)
    playlist_id = playlist_response.json()["id"]
    
    # Add song with explicit null values
    song_with_nulls = {
        "title": "Test Song",
        "artist": "Test Artist",
        "album": None,
        "duration": None
    }
    response = client.post(f"/playlists/{playlist_id}/songs/", json=song_with_nulls)
    assert response.status_code == 200
    
    data = response.json()
    assert data["album"] is None
    assert data["duration"] is None

def test_concurrent_operations_simulation(client: TestClient, sample_playlist_data):
    """Test rapid successive operations to check for race conditions"""
    # Create playlist
    playlist_response = client.post("/playlists/", json=sample_playlist_data)
    playlist_id = playlist_response.json()["id"]
    
    # Rapidly add multiple songs
    songs = []
    for i in range(10):
        song = {"title": f"Song {i}", "artist": f"Artist {i}"}
        response = client.post(f"/playlists/{playlist_id}/songs/", json=song)
        assert response.status_code == 200
        songs.append(response.json()["id"])
    
    # Verify all songs were added
    get_response = client.get(f"/playlists/{playlist_id}/songs/")
    assert len(get_response.json()) == 10
    
    # Rapidly delete some songs
    for song_id in songs[:5]:
        delete_response = client.delete(f"/songs/{song_id}")
        assert delete_response.status_code == 200
    
    # Verify correct number remain
    final_response = client.get(f"/playlists/{playlist_id}/songs/")
    assert len(final_response.json()) == 5

def test_update_with_invalid_data_types(client: TestClient, sample_playlist_data):
    """Test updating playlist with wrong data types"""
    # Create playlist first
    playlist_response = client.post("/playlists/", json=sample_playlist_data)
    playlist_id = playlist_response.json()["id"]
    
    # Try to update with wrong data types
    invalid_update = {
        "name": 123,  # Should be string
        "description": ["not", "a", "string"]  # Should be string
    }
    response = client.put(f"/playlists/{playlist_id}", json=invalid_update)
    assert response.status_code == 422  # Validation error