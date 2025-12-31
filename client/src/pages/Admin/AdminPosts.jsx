import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Globe, Lock, Pin, Eye, EyeOff } from 'lucide-react';
import './AdminAnnouncements.css';

const AdminPosts = () => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('announcement'); // announcement, event, memo
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'announcement',
        visibility: 'member',
        status: 'published',
        is_pinned: false,
        event_start_at: '',
        event_end_at: '',
        location: '',
        image_url: ''
    });

    const fetchPosts = async () => {
        try {
            // Fetch all posts (admin can see drafts too, but for now get all published)
            const res = await fetch('/api/posts');
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Delete this post?')) return;
        await fetch(`/api/posts/${id}`, { method: 'DELETE' });
        setPosts(posts.filter(p => p.id !== id));
    };

    const handleTogglePin = async (post) => {
        try {
            const res = await fetch(`/api/posts/${post.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_pinned: !post.is_pinned })
            });
            const updated = await res.json();
            setPosts(posts.map(p => p.id === post.id ? updated : p));
        } catch (err) {
            alert('Failed to toggle pin');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, type: activeTab };

            // Clear event fields if not event type
            if (activeTab !== 'event') {
                delete payload.event_start_at;
                delete payload.event_end_at;
                delete payload.location;
                delete payload.image_url; // Only events can have images for now
            }

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message);
            }

            const newPost = await res.json();
            setPosts([newPost, ...posts]);
            setShowModal(false);
            setFormData({
                title: '',
                content: '',
                type: 'announcement',
                visibility: 'member',
                status: 'published',
                is_pinned: false,
                event_start_at: '',
                event_end_at: '',
                location: '',
                image_url: ''
            });
        } catch (err) {
            alert(err.message || 'Failed to post');
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, image_url: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const filteredPosts = posts.filter(p => p.type === activeTab);

    return (
        <div className="admin-announcements fade-in">
            <header className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Content Manager</h1>
                    <p className="text-muted">Manage announcements, events, and memos</p>
                </div>
            </header>

            <div className="content-block glass-panel">
                <div className="table-header-actions">
                    <div className="tab-switcher-inline">
                        <button
                            className={`tab-btn-sm ${activeTab === 'announcement' ? 'active' : ''}`}
                            onClick={() => setActiveTab('announcement')}
                        >
                            Announcements
                        </button>
                        <button
                            className={`tab-btn-sm ${activeTab === 'event' ? 'active' : ''}`}
                            onClick={() => setActiveTab('event')}
                        >
                            Events
                        </button>
                        <button
                            className={`tab-btn-sm ${activeTab === 'memo' ? 'active' : ''}`}
                            onClick={() => setActiveTab('memo')}
                        >
                            Memos
                        </button>
                    </div>
                    <button className="btn-primary flex-center gap-2" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </button>
                </div>

                <div className="feed-grid">
                    {filteredPosts.map(post => (
                        <div key={post.id} className="post-item border-b border-light p-4 flex-row justify-between">
                            <div className="flex-1">
                                <div className="flex-center gap-2 mb-1" style={{ justifyContent: 'flex-start' }}>
                                    {post.is_pinned && <Pin size={14} className="text-primary" />}
                                    {post.visibility === 'public' ?
                                        <span className="vis-badge public"><Globe size={12} /> Public</span> :
                                        <span className="vis-badge private"><Lock size={12} /> Members</span>
                                    }
                                    {post.status === 'draft' && <span className="status-badge draft">Draft</span>}
                                    {post.status === 'archived' && <span className="status-badge archived">Archived</span>}
                                    <span className="text-xs text-muted">{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-lg">{post.title}</h3>
                                <p className="text-muted text-sm mt-1">{post.content}</p>
                                {post.type === 'event' && post.event_start_at && (
                                    <p className="text-primary text-sm mt-2">
                                        📅 {new Date(post.event_start_at).toLocaleString()} • {post.location}
                                    </p>
                                )}
                            </div>
                            <div className="flex-center gap-2">
                                <button
                                    className="btn-ghost"
                                    onClick={() => handleTogglePin(post)}
                                    title={post.is_pinned ? 'Unpin' : 'Pin'}
                                >
                                    <Pin size={16} className={post.is_pinned ? 'text-primary' : ''} />
                                </button>
                                <button className="btn-ghost text-error" onClick={() => handleDelete(post.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredPosts.length === 0 && !isLoading && (
                        <p className="p-8 text-center text-muted">No {activeTab}s yet.</p>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay flex-center">
                    <div className="modal glass-panel" style={{ maxWidth: '600px' }}>
                        <h2 className="mb-4">Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                        <form onSubmit={handleSubmit} className="flex-col gap-4">
                            <input
                                className="input-field"
                                placeholder="Title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            <textarea
                                className="input-field"
                                placeholder="Content..."
                                rows={4}
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                required
                            />

                            {activeTab === 'event' && (
                                <>
                                    <div className="flex-row gap-4">
                                        <div className="form-group flex-1">
                                            <label>Start Date & Time *</label>
                                            <input
                                                type="datetime-local"
                                                className="input-field"
                                                value={formData.event_start_at}
                                                onChange={e => setFormData({ ...formData, event_start_at: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label>End Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                className="input-field"
                                                value={formData.event_end_at}
                                                onChange={e => setFormData({ ...formData, event_end_at: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <input
                                        className="input-field"
                                        placeholder="Location"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />

                                    <div className="form-group">
                                        <label>Event Image (Optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="input-field"
                                            onChange={handleImageUpload}
                                        />
                                        {formData.image_url && (
                                            <div className="image-preview mt-2">
                                                <img src={formData.image_url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="flex-row gap-4">
                                <div className="form-group flex-1">
                                    <label>Visibility</label>
                                    <select
                                        className="input-field"
                                        value={formData.visibility}
                                        onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                    >
                                        <option value="member">Members Only</option>
                                        <option value="public">Public</option>
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Status</label>
                                    <select
                                        className="input-field"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <label className="flex-center gap-2" style={{ justifyContent: 'flex-start', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_pinned}
                                    onChange={e => setFormData({ ...formData, is_pinned: e.target.checked })}
                                />
                                <span>Pin this post</span>
                            </label>

                            <div className="flex-row gap-2 mt-2">
                                <button type="button" className="btn-ghost flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Publish</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPosts;
