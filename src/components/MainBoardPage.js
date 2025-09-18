import React, { Component } from 'react';
import CommonLayout from './CommonLayout';
import PostService from '../services/PostService';
import "../styles/MainBoardPage.css"

class MainBoardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: [],
      allPosts: [], // 원본 게시글 저장
      filteredPosts: [], // 필터링된 게시글
      isLoading: true,
      error: null,
      activeCategory: "ALL",
      searchTerm: "",
      sortBy: "최신순"
    };
    this.categories = ["자유", "동물/반려동물", "여행", "건강/헬스", "연예인"];
  }

  componentDidMount() {
    this.loadPosts();
    this.checkUrlCategory();
  }

  // URL 파라미터에서 카테고리 확인
  checkUrlCategory = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category');
    
    if (categoryFromUrl && this.categories.includes(categoryFromUrl)) {

      this.setState({ activeCategory: categoryFromUrl });
      // 게시글이 로드된 후에 필터링 적용
      setTimeout(() => {
        this.filterPostsByCategory(categoryFromUrl);
      }, 100);
    }
  };

  loadPosts = async () => {
    try {
      const result = await PostService.getPosts();
      // posts 배열이 없으면 빈 배열로 설정
      const posts = result.posts || result.data || [];
      this.setState({ 
        posts: posts,
        allPosts: posts, // 원본 게시글 저장
        filteredPosts: posts, // 필터링된 게시글
        isLoading: false 
      });
    } catch (error) {
      console.error('게시글 로드 오류:', error);
      this.setState({ 
        posts: [], 
        allPosts: [],
        filteredPosts: [],
        error: error.message, 
        isLoading: false 
      });
    }
  };

  handleCategoryChange = (category) => {
    this.setState({ activeCategory: category });
    // 카테고리별 게시글 필터링
    this.filterPostsByCategory(category);
  };

  filterPostsByCategory = (category) => {
    if (category === "ALL") {
      // 전체 카테고리일 때는 모든 게시글 표시
      this.setState({ filteredPosts: this.state.allPosts });
    } else {
      // 특정 카테고리일 때는 해당 카테고리 게시글만 표시
      const filtered = this.state.allPosts.filter(post => post.category === category);
      this.setState({ filteredPosts: filtered });
    }
  };

  handleSearchChange = (e) => {
    this.setState({ searchTerm: e.target.value });
    // 검색어에 따른 게시글 필터링
    this.filterPostsBySearch(e.target.value);
  };

  filterPostsBySearch = (searchTerm) => {
    const { allPosts, activeCategory } = this.state;
    let filtered = allPosts;

    // 카테고리 필터링
    if (activeCategory == "ALL") {
      this.setState({ filteredPosts: this.state.allPosts });
    } else {
      filtered = filtered.filter(post => post.category === activeCategory);
      this.setState({ filteredPosts: filtered });
    }

    // 검색어 필터링
    if (searchTerm.trim()) {
      filtered = filtered.filter(post => 
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    this.setState({ filteredPosts: filtered });
  };

  handleSortChange = (sortType) => {
    this.setState({ sortBy: sortType });
    // 정렬 적용
    this.sortPosts(sortType);
  };

  sortPosts = (sortType) => {
    let sortedPosts = [...this.state.filteredPosts];
    
    if (sortType === '인기순') {
      // 인기순: 좋아요 수 내림차순
      sortedPosts.sort((a, b) => b.like_count - a.like_count);
    } else {
      // 최신순: 생성일 내림차순
      sortedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    this.setState({ filteredPosts: sortedPosts });
  };

  handleWritePost = () => {
    this.props.navigate('/write');
  };

  render() {
    const { filteredPosts, isLoading, error, activeCategory, searchTerm, sortBy } = this.state;
    const { isLoggedIn, currentUser } = this.props;

    if (isLoading) return <div className="loading">로딩 중...</div>;
    if (error) return <div className="error">오류: {error}</div>;

    // posts가 없으면 빈 배열로 설정
    const safePosts = filteredPosts || [];

    return (
      <CommonLayout
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        navigate={this.props.navigate}
        activeCategory={activeCategory}
        searchTerm={searchTerm}
        onCategoryChange={this.handleCategoryChange}
        onSearchChange={this.handleSearchChange}
        onLogout={this.props.onLogout}
      >
        {/* 필터 및 정렬 섹션 */}
        <div className="filter-section">          
          <div className="sort-buttons">
            <button
              className={`sort-btn ${sortBy === '최신순' ? 'active' : ''}`}
              onClick={() => this.handleSortChange('최신순')}
            >
              최신순
            </button>
            <button
              className={`sort-btn ${sortBy === '인기순' ? 'active' : ''}`}
              onClick={() => this.handleSortChange('인기순')}
            >
              인기순
            </button>
          </div>
          {isLoggedIn && (
            <div className="action-section">
              <button 
                className="write-post-button" 
                onClick={this.handleWritePost}
              >
                + 글쓰기
              </button>
            </div>
          )}
        </div>

        {/* 게시글 테이블 */}
        <div className="posts-table">
          {/* 테이블 헤더 */}
          <div className="table-header">
            <div className="header-row">
              <div className="header-cell">카테고리</div>
              <div className="header-cell">제목</div>
              <div className="header-cell">글쓴이</div>
              <div className="header-cell">작성날짜</div>
              <div className="header-cell">조회수</div>
              <div className="header-cell">좋아요</div>
            </div>
          </div>

          {/* 게시글 목록 */}
          <div className="table-body">
            {safePosts.length > 0 ? (
              safePosts.map((post) => (
                <div key={post.id} className="table-row">
                  <div className="table-cell category-cell">
                    <span className="category-tag">{post.category}</span>
                  </div>
                  <div className="table-cell title-cell">
                    <a href={`/post/${post.id}`} className="post-title-link">
                      <div className="post-title-content">
                        <span className="post-title-text">
                          {post.title}
                          {post.comment_count > 0 && (
                            <span className="comment-count"> ({post.comment_count})</span>
                          )}
                        </span>
                        {post.media_files && post.media_files.length > 0 && (
                          <div className="post-image-indicator">
                            <span className="image-count">📷 {post.media_files.length}</span>
                          </div>
                        )}
                      </div>
                    </a>
                  </div>
                  <div className="table-cell author-cell">{post.username}</div>
                  <div className="table-cell date-cell">
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </div>
                  <div className="table-cell views-cell">{post.view_count || 0}</div>
                  <div className="table-cell likes-cell">{post.like_count || 0}</div>
                </div>
              ))
            ) : (
              <div className="no-posts" style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: 'var(--white)',
                fontSize: '16px',
                gridColumn: '1 / -1'
              }}>
                {activeCategory === "전체" ? "게시글이 없습니다." : `${activeCategory} 카테고리에 게시글이 없습니다.`}
              </div>
            )}
          </div>
        </div>
      </CommonLayout>
    );
  }
}

export default MainBoardPage;
