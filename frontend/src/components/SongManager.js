import React, { useState, useEffect } from 'react';
import { fetchPlaylistSongs, addSongToPlaylist, deleteSong } from '../services/api';

const SongManager = ({ selectedPlaylist, onSongUpdate }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    duration: ''
  });

  useEffect(() => {
    if (selectedPlaylist) {
      loadSongs();
    } else {
      setSongs([]);
    }
  }, [selectedPlaylist]);

  const loadSongs = async () => {
    if (!selectedPlaylist) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchPlaylistSongs(selectedPlaylist.id);
      setSongs(data);
    } catch (err) {
      setError('Failed to load songs');
      console.error('Error loading songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.artist.trim() || !selectedPlaylist) return;

    try {
      setLoading(true);
      const songData = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : null
      };
      
      await addSongToPlaylist(selectedPlaylist.id, songData);
      
      setFormData({ title: '', artist: '', album: '', duration: '' });
      setShowForm(false);
      loadSongs();
      onSongUpdate();
    } catch (err) {
      setError('Failed to add song');
      console.error('Error adding song:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (songId) => {
    if (!window.confirm('Are you sure you want to remove this song?')) return;

    try {
      setLoading(true);
      await deleteSong(songId);
      loadSongs();
      onSongUpdate();
    } catch (err) {
      setError('Failed to delete song');
      console.error('Error deleting song:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setFormData({ title: '', artist: '', album: '', duration: '' });
    setShowForm(false);
  };

  if (!selectedPlaylist) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-lg font-medium text-gray-100 mb-2">No Playlist Selected</h3>
          <p className="text-gray-400">Select a playlist to manage its songs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">
              Songs in "{selectedPlaylist.name}"
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {songs.length} song{songs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
            disabled={loading}
          >
            {showForm ? 'Cancel' : '+ Add Song'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-100 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter song title"
                  required
                />
              </div>
              <div>
                <label htmlFor="artist" className="block text-sm font-medium text-gray-100 mb-2">
                  Artist *
                </label>
                <input
                  type="text"
                  id="artist"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter artist name"
                  required
                />
              </div>
              <div>
                <label htmlFor="album" className="block text-sm font-medium text-gray-100 mb-2">
                  Album
                </label>
                <input
                  type="text"
                  id="album"
                  value={formData.album}
                  onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter album name"
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-100 mb-2">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter duration in seconds"
                  min="0"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !formData.title.trim() || !formData.artist.trim()}
              >
                {loading ? 'Adding...' : 'Add Song'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading && !showForm && (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading songs...</div>
          </div>
        )}

        <div className="space-y-3">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-opacity-80 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400 font-mono">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-100">{song.title}</h3>
                      <p className="text-sm text-gray-400">
                        by {song.artist}
                        {song.album && ` • ${song.album}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">
                    {formatDuration(song.duration)}
                  </span>
                  <button
                    onClick={() => handleDelete(song.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Remove song"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && songs.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎶</div>
              <div className="text-gray-400">No songs in this playlist</div>
              <p className="text-sm text-gray-400 mt-2">Add some songs to get started</p>
            </div>
          )}
        </div>

        {songs.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-600">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Total: {songs.length} song{songs.length !== 1 ? 's' : ''}</span>
              <span>
                Duration: {formatDuration(
                  songs.reduce((total, song) => total + (song.duration || 0), 0)
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongManager;