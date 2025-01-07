"use client";

import Link from 'next/link';

const MainPage = () => {
  // const [posts, setPosts] = useState([]);

  // useEffect(() => {
  //   const fetchPosts = async () => {
  //     try {
  //       const response = await fetch('/api/board/actions/getPosts');
  //       if (response.ok) {
  //         const data = await response.json();
  //         setPosts(data.docs || data);
  //       } else {
  //         console.error('Failed to fetch posts');
  //       }
  //     } catch (error) {
  //       console.error('Error:', error);
  //     }
  //   };
  //   fetchPosts();
  // }, []);

  return (
    <div>
      <h1>Welcome to Our Community</h1>
      <Link href="/board/posts">View Latest Posts</Link>
      {/* <h2>Latest Posts</h2>
      {posts.map((post) => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content.substring(0, 100)}...</p>
          <a href={`/posts/${post.id}`}>Read more</a>
        </div>
      ))} */}
      <div>
        <Link href="/login">Log In</Link> | <Link href="/signup">Sign Up</Link>
      </div>
    </div>
  );
};
export default MainPage;

