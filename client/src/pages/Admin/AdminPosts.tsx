import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Globe, Lock, Pin, Eye, EyeOff, Edit, Calendar, FileText, Info } from 'lucide-react';
import { fetchContent, createContent, updateContent, deleteContent, updateContentStatus, pinContent } from '../../services/api';
import './AdminPosts.css';

interface Post {
  id: number;
  title: string;
  body: string;
  type: 'ANNOUNCEMENT' | 'EVENT' | 'MEMO';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'MEMBER';
  is_pinned: boolean;
  published_at: string | null;
  event?: {
    start_at: string;
    end_at: string;
    location: string;
  };
}

const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [previousVisibility, setPreviousVisibility] = useState<'PUBLIC' | 'MEMBER'>('PUBLIC');

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'ANNOUNCEMENT',
    visibility: 'MEMBER',
    status: 'PUBLISHED',
    is_pinned: false,
    event_start_at: '',
    event_end_at: '',
    location: '',
  });

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const data = await fetchContent(filterType === 'ALL' ? undefined : filterType);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [filterType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle type changes with visibility management
    if (name === 'type') {
      const currentType = formData.type;
      const newType = value;
      
      // Switching TO MEMO: save current visibility and set to MEMBER
      if (newType === 'MEMO' && currentType !== 'MEMO') {
        setPreviousVisibility(formData.visibility as 'PUBLIC' | 'MEMBER');
        setFormData(prev => ({ ...prev, type: newType, visibility: 'MEMBER' }));
      }
      // Switching FROM MEMO to non-MEMO: restore previous visibility
      else if (currentType === 'MEMO' && newType !== 'MEMO') {
        setFormData(prev => ({ ...prev, type: newType, visibility: previousVisibility }));
      }
      // Other type changes: just update type
      else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        title: formData.title,
        body: formData.body,
        type: formData.type,
        visibility: formData.visibility,
        status: formData.status,
        is_pinned: formData.is_pinned,
      };

      if (formData.type === 'EVENT') {
        payload.event = {
          start_at: new Date(formData.event_start_at).toISOString(),
          end_at: new Date(formData.event_end_at).toISOString(),
          location: formData.location,
        };
      }

      if (isEditing && editId) {
        await updateContent(editId, payload);
      } else {
        await createContent(payload);
      }
      
      setShowModal(false);
      resetForm();
      loadPosts();
    } catch (error) {
      console.error('Failed to save post', error);
      alert('Failed to save post');
    }
  };

  const handleEdit = (post: Post) => {
    setIsEditing(true);
    setEditId(post.id);
    setFormData({
      title: post.title,
      body: post.body,
      type: post.type,
      visibility: post.visibility,
      status: post.status,
      is_pinned: post.is_pinned,
      event_start_at: post.event ? new Date(post.event.start_at).toISOString().slice(0, 16) : '',
      event_end_at: post.event ? new Date(post.event.end_at).toISOString().slice(0, 16) : '',
      location: post.event?.location || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteContent(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete post', error);
    }
  };

  const handleTogglePin = async (post: Post) => {
    try {
      await pinContent(post.id, !post.is_pinned);
      loadPosts();
    } catch (error) {
      console.error('Failed to toggle pin', error);
    }
  };

  const handleToggleStatus = async (post: Post) => {
    const newStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await updateContentStatus(post.id, newStatus);
      loadPosts();
    } catch (error) {
      console.error('Failed to toggle status', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      type: 'ANNOUNCEMENT',
      visibility: 'MEMBER',
      status: 'PUBLISHED',
      is_pinned: false,
      event_start_at: '',
      event_end_at: '',
      location: '',
    });
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div className="admin-posts-container">
      <div className="admin-header">
        <h1>Content Management</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} /> New Post
        </button>
      </div>

      <div className="admin-filters">
        <button className={filterType === 'ALL' ? 'active' : ''} onClick={() => setFilterType('ALL')}>All</button>
        <button className={filterType === 'ANNOUNCEMENT' ? 'active' : ''} onClick={() => setFilterType('ANNOUNCEMENT')}>Announcements</button>
        <button className={filterType === 'EVENT' ? 'active' : ''} onClick={() => setFilterType('EVENT')}>Events</button>
        <button className={filterType === 'MEMO' ? 'active' : ''} onClick={() => setFilterType('MEMO')}>Memorandum</button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="posts-list">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Visibility</th>
                <th>Status</th>
                <th>Pinned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td>
                    <span className={`type-badge ${post.type.toLowerCase()}`}>
                      {post.type === 'ANNOUNCEMENT' && <Megaphone size={14} />}
                      {post.type === 'EVENT' && <Calendar size={14} />}
                      {post.type === 'MEMO' && <FileText size={14} />}
                      {post.type === 'ANNOUNCEMENT' ? 'Announcement' : post.type === 'EVENT' ? 'Event' : post.type === 'MEMO' ? 'Memorandum' : post.type}
                    </span>
                  </td>
                  <td>{post.title}</td>
                  <td>
                    <span className="vis-badge">
                      {post.visibility === 'PUBLIC' ? <Globe size={14} /> : <Lock size={14} />}
                      {post.visibility}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${post.status.toLowerCase()}`}>
                      {post.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={`icon-btn ${post.is_pinned ? 'active' : ''}`}
                      onClick={() => handleTogglePin(post)}
                      title="Toggle Pin"
                    >
                      <Pin size={18} />
                    </button>
                  </td>
                  <td className="actions-cell">
                    <button className="icon-btn" onClick={() => handleToggleStatus(post)} title={post.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}>
                      {post.status === 'PUBLISHED' ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button className="icon-btn" onClick={() => handleEdit(post)} title="Edit">
                      <Edit size={18} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(post.id)} title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? 'Edit Post' : 'New Post'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange} disabled={isEditing}>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="EVENT">Event</option>
                  <option value="MEMO">Memorandum</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea 
                  name="body" 
                  value={formData.body} 
                  onChange={handleInputChange} 
                  rows={5}
                  required 
                />
              </div>

              {formData.type === 'EVENT' && (
                <div className="event-fields">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input 
                      type="datetime-local" 
                      name="event_start_at" 
                      value={formData.event_start_at} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input 
                      type="datetime-local" 
                      name="event_end_at" 
                      value={formData.event_end_at} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input 
                      type="text" 
                      name="location" 
                      value={formData.location} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Visibility</label>
                  <select 
                    name="visibility" 
                    value={formData.visibility} 
                    onChange={handleInputChange}
                    disabled={formData.type === 'MEMO'}
                    aria-label={formData.type === 'MEMO' ? 'Visibility (disabled for Memorandum - always member-only)' : 'Visibility'}
                    title={formData.type === 'MEMO' ? 'Memorandum posts are always member-only' : ''}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="MEMBER">Member Only</option>
                  </select>
                  {formData.type === 'MEMO' && (
                    <div className="helper-note">
                      <Info size={14} className="icon" />
                      Memorandum posts are member-only
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input 
                    type="checkbox" 
                    name="is_pinned" 
                    checked={formData.is_pinned} 
                    onChange={handleCheckboxChange} 
                  />
                  Pin to top
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;