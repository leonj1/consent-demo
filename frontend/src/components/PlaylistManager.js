import React, { useState, useEffect } from 'react';
import { fetchPlaylists, createPlaylist, updatePlaylist, deletePlaylist } from '../services/api';

const PlaylistManager = ({ onPlaylistSelect, refreshTrigger, onPlaylistUpdate }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadPlaylists();
  }, [refreshTrigger]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPlaylists();
      setPlaylists(data);
    } catch (err) {
      setError('Failed to load playlists');
      console.error('Error loading playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setLoading(true);
      if (editingPlaylist) {
        await updatePlaylist(editingPlaylist.id, formData);
      } else {
        await createPlaylist(formData);
      }
      
      setFormData({ name: '', description: '' });
      setShowForm(false);
      setEditingPlaylist(null);
      loadPlaylists();
      onPlaylistUpdate();
    } catch (err) {
      setError('Failed to save playlist');
      console.error('Error saving playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;

    try {
      setLoading(true);
      await deletePlaylist(playlistId);
      loadPlaylists();
      onPlaylistUpdate();
    } catch (err) {
      setError('Failed to delete playlist');
      console.error('Error deleting playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setShowForm(false);
    setEditingPlaylist(null);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Playlists</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
            disabled={loading}
          >
            {showForm ? 'Cancel' : '+ New Playlist'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-700 rounded-lg">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-100 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter playlist name"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-100 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field w-full h-20 resize-none"
                  placeholder="Enter playlist description"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !formData.name.trim()}
                >
                  {loading ? 'Saving...' : editingPlaylist ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {loading && !showForm && (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading playlists...</div>
          </div>
        )}

        <div className="space-y-3">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-opacity-80 transition-all duration-200 cursor-pointer"
              onClick={() => onPlaylistSelect(playlist)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-100">{playlist.name}</h3>
                  {playlist.description && (
                    <p className="text-sm text-gray-400 mt-1">{playlist.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {playlist.songs?.length || 0} songs
                  </p>
                </div>
                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(playlist)}
                    className="text-blue-400 hover:text-blue-300 p-1"
                    title="Edit playlist"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(playlist.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete playlist"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && playlists.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400">No playlists found</div>
              <p className="text-sm text-gray-400 mt-2">Create your first playlist to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistManager;