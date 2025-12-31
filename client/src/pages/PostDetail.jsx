import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowLeft, Clock } from 'lucide-react';
import './PostDetail.css';

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/posts/${id}`);
                if (!res.ok) throw new Error('Post not found');
                const data = await res.json();
                setPost(data);
            } catch (err) {
                console.error(err);
                alert('Post not found');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="post-detail-container flex-center">
                <p>Loading...</p>
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="post-detail-container">
            <div className="post-detail-content">
                <button className="back-btn glass-panel" onClick={() => navigate('/')}>
                    <ArrowLeft size={20} />
                    <span>Back to Home</span>
                </button>

                <article className="post-detail-card glass-panel">
                    {post.image_url && (
                        <div className="post-image-hero">
                            <img src={post.image_url} alt={post.title} />
                        </div>
                    )}

                    <div className="post-detail-body">
                        <div className="post-meta mb-4">
                            <span className="post-type-badge">{post.type}</span>
                            <span className="post-date">{new Date(post.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>

                        <h1 className="post-title">{post.title}</h1>

                        {post.type === 'event' && post.event_start_at && (
                            <div className="event-details-box glass-panel mb-6">
                                <div className="event-detail-item">
                                    <Calendar size={20} className="text-primary" />
                                    <div>
                                        <div className="text-sm text-muted">Date & Time</div>
                                        <div className="font-medium">
                                            {new Date(post.event_start_at).toLocaleString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        {post.event_end_at && (
                                            <div className="text-sm text-muted mt-1">
                                                Until {new Date(post.event_end_at).toLocaleString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {post.location && (
                                    <div className="event-detail-item">
                                        <MapPin size={20} className="text-primary" />
                                        <div>
                                            <div className="text-sm text-muted">Location</div>
                                            <div className="font-medium">{post.location}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="post-content">
                            <p>{post.content}</p>
                        </div>
                    </div>
                </article>
            </div>

            <div className="ambient-light light-1"></div>
            <div className="ambient-light light-2"></div>
        </div>
    );
};

export default PostDetail;
