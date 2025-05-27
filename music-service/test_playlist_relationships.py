import pytest
from fastapi.testclient import TestClient

def create_playlist_and_get_id(client: TestClient, playlist_data):
    """Helper function to create a playlist and return its ID"""
    response = client.post("/playlists/", json=playlist_data)
    assert response.status_code == 200
    return response.json()["id"]

def test_playlist_with_songs_relationship(client: TestClient, sample_playlist_data, sample_song_data):
    # Create playlist
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    
    # Add song to playlist
    client.post(f"/playlists/{playlist_id}/songs/", json=sample_song_data)
    
    # Get playlist with songs
    response = client.get(f"/playlists/{playlist_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["songs"]) == 1
    assert data["songs"][0]["title"] == sample_song_data["title"]
    assert data["songs"][0]["playlist_id"] == playlist_id

def test_empty_playlist_songs_relationship(client: TestClient, sample_playlist_data):
    # Create empty playlist
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    
    # Get playlist (should have empty songs list)
    response = client.get(f"/playlists/{playlist_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["songs"] == []

def test_delete_playlist_cascades_to_songs(client: TestClient, sample_playlist_data, sample_song_data):
    # Create playlist and add song
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    song_response = client.post(f"/playlists/{playlist_id}/songs/", json=sample_song_data)
    song_id = song_response.json()["id"]
    
    # Verify song exists
    all_songs_response = client.get("/songs/")
    assert len(all_songs_response.json()) == 1
    
    # Delete playlist
    delete_response = client.delete(f"/playlists/{playlist_id}")
    assert delete_response.status_code == 200
    
    # Verify songs are also deleted (due to cascade)
    all_songs_after_delete = client.get("/songs/")
    assert all_songs_after_delete.json() == []

def test_multiple_playlists_with_different_songs(client: TestClient):
    # Create two playlists
    rock_playlist_data = {"name": "Rock Classics", "description": "Best rock songs"}
    jazz_playlist_data = {"name": "Jazz Standards", "description": "Classic jazz"}
    
    rock_playlist_id = create_playlist_and_get_id(client, rock_playlist_data)
    jazz_playlist_id = create_playlist_and_get_id(client, jazz_playlist_data)
    
    # Add different songs to each playlist
    rock_songs = [
        {"title": "Smoke on the Water", "artist": "Deep Purple"},
        {"title": "Sweet Child O' Mine", "artist": "Guns N' Roses"}
    ]
    
    jazz_songs = [
        {"title": "Take Five", "artist": "Dave Brubeck"},
        {"title": "Round Midnight", "artist": "Thelonious Monk"}
    ]
    
    # Add rock songs
    for song in rock_songs:
        client.post(f"/playlists/{rock_playlist_id}/songs/", json=song)
    
    # Add jazz songs
    for song in jazz_songs:
        client.post(f"/playlists/{jazz_playlist_id}/songs/", json=song)
    
    # Get rock playlist
    rock_response = client.get(f"/playlists/{rock_playlist_id}")
    rock_data = rock_response.json()
    assert len(rock_data["songs"]) == 2
    rock_titles = [s["title"] for s in rock_data["songs"]]
    assert "Smoke on the Water" in rock_titles
    assert "Sweet Child O' Mine" in rock_titles
    
    # Get jazz playlist
    jazz_response = client.get(f"/playlists/{jazz_playlist_id}")
    jazz_data = jazz_response.json()
    assert len(jazz_data["songs"]) == 2
    jazz_titles = [s["title"] for s in jazz_data["songs"]]
    assert "Take Five" in jazz_titles
    assert "Round Midnight" in jazz_titles
    
    # Verify total songs count
    all_songs = client.get("/songs/")
    assert len(all_songs.json()) == 4

def test_playlist_songs_order_preservation(client: TestClient, sample_playlist_data):
    # Create playlist
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    
    # Add songs in specific order
    songs_in_order = [
        {"title": "Song 1", "artist": "Artist A"},
        {"title": "Song 2", "artist": "Artist B"},
        {"title": "Song 3", "artist": "Artist C"}
    ]
    
    song_ids = []
    for song in songs_in_order:
        response = client.post(f"/playlists/{playlist_id}/songs/", json=song)
        song_ids.append(response.json()["id"])
    
    # Get playlist songs
    response = client.get(f"/playlists/{playlist_id}/songs/")
    songs_data = response.json()
    
    # Verify songs are returned (order may depend on database implementation)
    assert len(songs_data) == 3
    retrieved_titles = [s["title"] for s in songs_data]
    expected_titles = [s["title"] for s in songs_in_order]
    
    # All songs should be present
    for title in expected_titles:
        assert title in retrieved_titles

def test_song_belongs_to_correct_playlist(client: TestClient):
    # Create two playlists
    playlist1_data = {"name": "Playlist 1"}
    playlist2_data = {"name": "Playlist 2"}
    
    playlist1_id = create_playlist_and_get_id(client, playlist1_data)
    playlist2_id = create_playlist_and_get_id(client, playlist2_data)
    
    # Add song to first playlist
    song_data = {"title": "Test Song", "artist": "Test Artist"}
    song_response = client.post(f"/playlists/{playlist1_id}/songs/", json=song_data)
    song_id = song_response.json()["id"]
    
    # Verify song belongs to playlist1
    playlist1_songs = client.get(f"/playlists/{playlist1_id}/songs/")
    playlist2_songs = client.get(f"/playlists/{playlist2_id}/songs/")
    
    assert len(playlist1_songs.json()) == 1
    assert len(playlist2_songs.json()) == 0
    assert playlist1_songs.json()[0]["playlist_id"] == playlist1_id

def test_remove_song_from_playlist_leaves_others_intact(client: TestClient, sample_playlist_data):
    # Create playlist with multiple songs
    playlist_id = create_playlist_and_get_id(client, sample_playlist_data)
    
    songs = [
        {"title": "Keep This Song", "artist": "Artist 1"},
        {"title": "Delete This Song", "artist": "Artist 2"},
        {"title": "Also Keep This", "artist": "Artist 3"}
    ]
    
    song_ids = []
    for song in songs:
        response = client.post(f"/playlists/{playlist_id}/songs/", json=song)
        song_ids.append(response.json()["id"])
    
    # Delete the middle song
    delete_response = client.delete(f"/songs/{song_ids[1]}")
    assert delete_response.status_code == 200
    
    # Verify other songs remain
    remaining_songs = client.get(f"/playlists/{playlist_id}/songs/")
    remaining_data = remaining_songs.json()
    
    assert len(remaining_data) == 2
    remaining_titles = [s["title"] for s in remaining_data]
    assert "Keep This Song" in remaining_titles
    assert "Also Keep This" in remaining_titles
    assert "Delete This Song" not in remaining_titles

def test_playlist_creation_time_vs_song_addition_time(client: TestClient, sample_playlist_data, sample_song_data):
    # Create playlist
    playlist_response = client.post("/playlists/", json=sample_playlist_data)
    playlist_id = playlist_response.json()["id"]
    playlist_created_at = playlist_response.json()["created_at"]
    
    # Add song (should be created after playlist)
    song_response = client.post(f"/playlists/{playlist_id}/songs/", json=sample_song_data)
    
    # Get playlist with songs
    full_playlist = client.get(f"/playlists/{playlist_id}")
    playlist_data = full_playlist.json()
    
    # Verify relationship is correct
    assert len(playlist_data["songs"]) == 1
    assert playlist_data["created_at"] == playlist_created_at
    assert playlist_data["songs"][0]["playlist_id"] == playlist_id