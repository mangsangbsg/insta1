import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, writeBatch, increment, addDoc, serverTimestamp, where, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Heart, MessageCircle, Send, Bookmark, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {posts.length === 0 ? (
        <div className="text-center text-gray-500 py-10">게시물이 없습니다. 첫 게시물을 작성해보세요!</div>
      ) : (
        posts.map(post => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}

function PostCard({ post }: { post: any; key?: string | number }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  
  const currentUserId = auth.currentUser?.uid;
  const likeId = `${currentUserId}_${post.id}`;

  useEffect(() => {
    if (!currentUserId) return;
    const unsubscribe = onSnapshot(doc(db, 'likes', likeId), (docSnap) => {
      setIsLiked(docSnap.exists());
    });
    return () => unsubscribe();
  }, [likeId, currentUserId]);

  useEffect(() => {
    if (!showComments) return;
    const q = query(collection(db, 'comments'), where('postId', '==', post.id), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    });
    return () => unsubscribe();
  }, [post.id, showComments]);

  const handleLike = async () => {
    if (likeLoading || !currentUserId) return;
    setLikeLoading(true);
    try {
      const batch = writeBatch(db);
      const likeRef = doc(db, 'likes', likeId);
      const postRef = doc(db, 'posts', post.id);

      if (isLiked) {
        batch.delete(likeRef);
        batch.update(postRef, { likesCount: increment(-1) });
      } else {
        batch.set(likeRef, {
          postId: post.id,
          userId: currentUserId,
          createdAt: new Date()
        });
        batch.update(postRef, { likesCount: increment(1) });
      }
      await batch.commit();
    } catch (err) {
      console.error(err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUserId || commentLoading) return;
    setCommentLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      const userData = userDoc.data();
      
      await addDoc(collection(db, 'comments'), {
        postId: post.id,
        authorUid: currentUserId,
        authorUsername: userData?.username || 'user',
        text: commentText.trim(),
        createdAt: serverTimestamp()
      });
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    try {
      await deleteDoc(doc(db, 'posts', post.id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <article className="rounded-sm border border-gray-300 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <Link to={`/profile/${post.authorUid}`} className="flex items-center gap-3">
          <img 
            src={post.authorPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorUsername}`} 
            alt={post.authorUsername} 
            className="h-8 w-8 rounded-full border border-gray-200 object-cover"
          />
          <span className="font-semibold text-sm">{post.authorUsername}</span>
        </Link>
        {currentUserId === post.authorUid && (
          <div className="relative">
            <button onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
            {showDeleteConfirm && (
              <div className="absolute right-0 top-8 z-10 w-32 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                <button 
                  onClick={handleDeletePost}
                  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 text-left font-semibold"
                >
                  삭제 확인
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      <div className="aspect-square w-full bg-gray-100">
        <img src={post.imageUrl} alt="Post content" className="h-full w-full object-cover" loading="lazy" />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} disabled={likeLoading} className="hover:text-gray-600">
              <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
            </button>
            <button onClick={() => setShowComments(!showComments)} className="hover:text-gray-600">
              <MessageCircle className="h-6 w-6 text-gray-900" />
            </button>
            <button className="hover:text-gray-600">
              <Send className="h-6 w-6 text-gray-900" />
            </button>
          </div>
          <button className="hover:text-gray-600">
            <Bookmark className="h-6 w-6 text-gray-900" />
          </button>
        </div>

        {/* Likes */}
        <div className="mb-1 text-sm font-semibold">
          좋아요 {post.likesCount || 0}개
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="text-sm">
            <Link to={`/profile/${post.authorUid}`} className="font-semibold mr-2">{post.authorUsername}</Link>
            <span>{post.caption}</span>
          </div>
        )}

        {/* Time */}
        <div className="mt-2 text-[10px] uppercase text-gray-500">
          {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ko }) : '방금 전'}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-xs text-gray-500">아직 댓글이 없습니다.</div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex justify-between items-start text-sm">
                    <div>
                      <Link to={`/profile/${comment.authorUid}`} className="font-semibold mr-2">{comment.authorUsername}</Link>
                      <span>{comment.text}</span>
                    </div>
                    {comment.authorUid === currentUserId && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-400 hover:text-red-500 ml-2">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="댓글 달기..."
                className="flex-1 text-sm outline-none placeholder-gray-400"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={!commentText.trim() || commentLoading}
                className="text-sm font-semibold text-blue-500 disabled:opacity-50"
              >
                게시
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
