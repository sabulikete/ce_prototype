import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Globe, Lock } from 'lucide-react';
import './AdminAnnouncements.css';

const AdminAnnouncements = () => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'General',
        visibility: 'MEMBERS_ONLY'
    });

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/announcements');
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
        if (!confirm('Delete this announcement?')) return;
        await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
        setPosts(posts.filter(p => p.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const newPost = await res.json();
            setPosts([newPost, ...posts]);
            setShowModal(false);
            setFormData({ title: '', content: '', category: 'General', visibility: 'MEMBERS_ONLY' });
        } catch (err) {
            alert('Failed to post');
        }
    };

    return (
        <div className="admin-announcements fade-in">
            <header className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Announcements</h1>
                    <p className="text-muted">Broadcast updates to members or public</p>
                </div>
            </header>

            <div className="content-block glass-panel">
                <div className="table-header-actions">
                    <h2 className="text-lg font-semibold">Post History</h2>
                    <button className="btn-primary flex-center gap-2" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> New Post
                    </button>
                </div>

                <div className="feed-grid">
                    {posts.map(post => (
                        <div key={post.id} className="post-item border-b border-light p-4 flex-row justify-between">
                            <div>
                                <div className="flex-center gap-2 mb-1" style={{ justifyContent: 'flex-start' }}>
                                    <span className={`tag ${post.category.toLowerCase()}`}>{post.category}</span>
                                    {post.visibility === 'PUBLIC' ?
                                        <span className="vis-badge public"><Globe size={12} /> Public</span> :
                                        <span className="vis-badge private"><Lock size={12} /> Members Only</span>
                                    }
                                    <span className="text-xs text-muted">{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-lg">{post.title}</h3>
                                <p className="text-muted text-sm mt-1">{post.content}</p>
                            </div>
                            <button className="btn-ghost text-error" onClick={() => handleDelete(post.id)}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {posts.length === 0 && !isLoading && <p className="p-8 text-center text-muted">No announcements yet.</p>}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay flex-center">
                    <div className="modal glass-panel">
                        <h2 className="mb-4">Create Announcement</h2>
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

                            <div className="flex-row gap-4">
                                <div className="form-group flex-1">
                                    <label>Category</label>
                                    <select
                                        className="input-field"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option>General</option>
                                        <option>Maintenance</option>
                                        <option>Event</option>
                                        <option>Alert</option>
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Visibility</label>
                                    <select
                                        className="input-field"
                                        value={formData.visibility}
                                        onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                    >
                                        <option value="MEMBERS_ONLY">Members Only</option>
                                        <option value="PUBLIC">Public</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex-row gap-2 mt-2">
                                <button type="button" className="btn-ghost flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Post</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnnouncements;
