import pytest
from fastapi.testclient import TestClient

def test_create_playlist(client: TestClient, sample_playlist_data):
    response = client.post("/playlists/", json=sample_playlist_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sample_playlist_data["name"]
    assert data["description"] == sample_playlist_data["description"]
    assert "id" in data
    assert "created_at" in data
    assert data["songs"] == []

def test_get_playlists_empty(client: TestClient):
    response = client.get("/playlists/")
    assert response.status_code == 200
    assert response.json() == []

def test_get_playlists(client: TestClient, sample_playlist_data):
    # Create a playlist first
    create_response = client.post("/playlists/", json=sample_playlist_data)
    assert create_response.status_code == 200
    
    # Get all playlists
    response = client.get("/playlists/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == sample_playlist_data["name"]

def test_get_playlist_by_id(client: TestClient, sample_playlist_data):
    # Create a playlist first
    create_response = client.post("/playlists/", json=sample_playlist_data)
    playlist_id = create_response.json()["id"]
    
    # Get playlist by ID
    response = client.get(f"/playlists/{playlist_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == playlist_id
    assert data["name"] == sample_playlist_data["name"]

def test_get_playlist_not_found(client: TestClient):
    response = client.get("/playlists/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Playlist not found"

def test_update_playlist(client: TestClient, sample_playlist_data):
    # Create a playlist first
    create_response = client.post("/playlists/", json=sample_playlist_data)
    playlist_id = create_response.json()["id"]
    
    # Update the playlist
    updated_data = {
        "name": "Updated Playlist Name",
        "description": "Updated description"
    }
    response = client.put(f"/playlists/{playlist_id}", json=updated_data)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == playlist_id
    assert data["name"] == updated_data["name"]
    assert data["description"] == updated_data["description"]

def test_update_playlist_not_found(client: TestClient):
    updated_data = {
        "name": "Non-existent Playlist",
        "description": "This should fail"
    }
    response = client.put("/playlists/999", json=updated_data)
    assert response.status_code == 404
    assert response.json()["detail"] == "Playlist not found"

def test_delete_playlist(client: TestClient, sample_playlist_data):
    # Create a playlist first
    create_response = client.post("/playlists/", json=sample_playlist_data)
    playlist_id = create_response.json()["id"]
    
    # Delete the playlist
    response = client.delete(f"/playlists/{playlist_id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Playlist deleted successfully"
    
    # Verify playlist is deleted
    get_response = client.get(f"/playlists/{playlist_id}")
    assert get_response.status_code == 404

def test_delete_playlist_not_found(client: TestClient):
    response = client.delete("/playlists/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Playlist not found"

def test_create_playlist_minimal_data(client: TestClient):
    minimal_data = {"name": "Simple Playlist"}
    response = client.post("/playlists/", json=minimal_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == minimal_data["name"]
    assert data["description"] is None

def test_create_multiple_playlists(client: TestClient):
    playlists = [
        {"name": "Rock Playlist", "description": "Rock music"},
        {"name": "Jazz Playlist", "description": "Jazz music"},
        {"name": "Classical Playlist", "description": "Classical music"}
    ]
    
    created_ids = []
    for playlist_data in playlists:
        response = client.post("/playlists/", json=playlist_data)
        assert response.status_code == 200
        created_ids.append(response.json()["id"])
    
    # Get all playlists
    response = client.get("/playlists/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    
    # Verify all playlists are present
    playlist_names = [p["name"] for p in data]
    assert "Rock Playlist" in playlist_names
    assert "Jazz Playlist" in playlist_names
    assert "Classical Playlist" in playlist_names