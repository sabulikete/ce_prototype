import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchContentById } from '../services/api';
import './PostDetail.css';

interface Content {
  id: number;
  title: string;
  body: string;
  type: string;
  published_at: string;
  event?: {
    start_at: string;
    end_at: string;
    location: string;
  };
}

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchContentById(parseInt(id));
        setContent(data);
      } catch (error) {
        console.error(error);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!content) return <p>Content not found</p>;

  return (
    <div className="post-detail">
      <Link to="/" className="back-link">← Back to Home</Link>
      <article>
        <header>
          <span className="badge type">{content.type}</span>
          <h1>{content.title}</h1>
          <p className="date">{new Date(content.published_at).toLocaleDateString()}</p>
        </header>

        {content.event && (
          <div className="event-details">
            <p><strong>Start:</strong> {new Date(content.event.start_at).toLocaleString()}</p>
            <p><strong>End:</strong> {new Date(content.event.end_at).toLocaleString()}</p>
            <p><strong>Location:</strong> {content.event.location}</p>
          </div>
        )}

        <div className="body" dangerouslySetInnerHTML={{ __html: content.body }} />
      </article>
    </div>
  );
};

export default PostDetail;
