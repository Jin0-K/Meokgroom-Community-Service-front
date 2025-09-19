import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { User, ArrowLeft, Save, X, Upload, Image, Trash2 } from 'lucide-react';
import CommonLayout from './CommonLayout';
import "../styles/WritePostPage.css"
import { decodeToken, getCognitoToken } from '../utils/tokenUtils';
import PostService from '../services/PostService';

class WritePostPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      postId: null,
      title: "",
      content: "",
      category: "자유",
      isLoading: false,
      error: null,
      // 이미지 관련 상태
      selectedFiles: [],
      uploadedImages: [],
      isUploading: false,
      uploadProgress: 0
    };
    this.categories = ["자유", "동물/반려동물", "여행", "건강/헬스", "연예인"];
    // 업로드 입력 참조
    this.fileInputRef = React.createRef();
  }

  componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('edit'); // CHANGED TO 'edit'
    
    if (postId) {
      this.setState({ postId });
      this.fetchPostForEdit(postId);
    }
  }

  componentDidUpdate(prevProps) {
    const urlParams = new URLSearchParams(window.location.search);
    const newPostId = urlParams.get('edit'); // CHANGED TO 'edit'
    
    if (newPostId !== this.state.postId) {
      if (newPostId) {
        this.setState({ postId: newPostId });
        this.fetchPostForEdit(newPostId);
      } else {
        this.setState({ 
          postId: null, 
          title: "", 
          content: "", 
          category: "자유",
          selectedFiles: [],
          uploadedImages: [],
          isUploading: false,
          uploadProgress: 0
        });
      }
    }
  }
  
  fetchPostForEdit = async (postId) => {
    this.setState({ isLoading: true });
    try {
      const result = await PostService.getPost(postId);
      const post = result.data || result.post || result;
      if (post) {
        this.setState({
          title: post.title,
          content: post.content,
          category: post.category,
          uploadedImages: post.media_files || [],
          postId: postId, // 수정 모드에서 postId 설정
          isLoading: false
        });
      }
    } catch (error) {
      console.error('게시글 로드 오류:', error);
      this.setState({
        error: error.message,
        isLoading: false
      });
    }
  };


  handleInputChange = (field, value) => {
    this.setState({ [field]: value });
  };

  // 파일 선택 핸들러
  handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    
    files.forEach(file => {
      try {
        PostService.validateImageFile(file);
        validFiles.push(file);
      } catch (error) {
        alert(error.message);
      }
    });
    
    if (validFiles.length > 0) {
      this.setState(prevState => ({
        selectedFiles: [...prevState.selectedFiles, ...validFiles]
      }));
    }
  };

  // 드래그 앤 드롭 핸들러
  handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const validFiles = [];
    
    files.forEach(file => {
      try {
        PostService.validateImageFile(file);
        validFiles.push(file);
      } catch (error) {
        alert(error.message);
      }
    });
    
    if (validFiles.length > 0) {
      this.setState(prevState => ({
        selectedFiles: [...prevState.selectedFiles, ...validFiles]
      }));
    }
  };

  handleDragOver = (e) => {
    e.preventDefault();
  };

  // 선택된 파일 제거
  removeSelectedFile = (index) => {
    this.setState(prevState => ({
      selectedFiles: prevState.selectedFiles.filter((_, i) => i !== index)
    }));
  };

  // 업로드된 이미지 제거
  removeUploadedImage = async (mediaId) => {
    const postId = this.state.postId;
    if (!postId || postId === 'null' || postId === null) {
      alert('게시글 ID가 유효하지 않습니다.');
      return;
    }
    
    try {
      await PostService.deleteImage(postId, mediaId);
      this.setState(prevState => ({
        uploadedImages: prevState.uploadedImages.filter(img => img.id !== mediaId)
      }));
      alert('이미지가 삭제되었습니다.');
    } catch (error) {
      alert('이미지 삭제에 실패했습니다: ' + error.message);
    }
  };

  // 이미지 업로드
  uploadImages = async () => {
    if (this.state.selectedFiles.length === 0) return;
    
    let currentPostId = this.state.postId;
    
    if (!currentPostId) {
      // 게시글이 아직 저장되지 않았다면 먼저 저장
      try {
        currentPostId = await this.savePostFirst();
      } catch (error) {
        alert('게시글 저장에 실패했습니다: ' + error.message);
        return;
      }
    }

    // postId 검증 - 더 엄격하게
    if (!currentPostId || currentPostId === 'null' || currentPostId === null) {
      alert('게시글 ID를 가져올 수 없습니다. 다시 시도해주세요.');
      console.error('PostId 검증 실패:', currentPostId);
      return;
    }

    console.log('이미지 업로드 시작 - PostId:', currentPostId, '파일 수:', this.state.selectedFiles.length);

    this.setState({ isUploading: true, uploadProgress: 0 });

    try {
      const uploadPromises = this.state.selectedFiles.map(async (file, index) => {
        // 각 파일 업로드 전에 다시 한번 postId 검증
        if (!currentPostId || currentPostId === 'null' || currentPostId === null) {
          throw new Error('유효하지 않은 게시글 ID입니다.');
        }
        
        const result = await PostService.uploadImage(currentPostId, file);
        this.setState(prevState => ({
          uploadProgress: Math.round(((index + 1) / this.state.selectedFiles.length) * 100)
        }));
        return result.data || result;
      });

      const uploadedResults = await Promise.all(uploadPromises);
      
      this.setState(prevState => ({
        uploadedImages: [...prevState.uploadedImages, ...uploadedResults],
        selectedFiles: [],
        isUploading: false,
        uploadProgress: 0
      }));
      
      alert('이미지가 성공적으로 업로드되었습니다.');
    } catch (error) {
      this.setState({ isUploading: false, uploadProgress: 0 });
      alert('이미지 업로드에 실패했습니다: ' + error.message);
    }
  };

  // 게시글 먼저 저장
  savePostFirst = async () => {
    const { title, content, category } = this.state;
    const { currentUser } = this.props;

    // 입력 내용 검증
    if (!title.trim()) {
      alert("게시글 제목을 입력해주세요.");
      throw new Error('제목이 필요합니다.');
    }

    if (!content.trim()) {
      alert("게시글 내용을 입력해주세요.");
      throw new Error('내용이 필요합니다.');
    }

    if (content.trim().length < 5) {
      alert("게시글은 최소 5자 이상 입력해주세요.");
      throw new Error('내용이 너무 짧습니다.');
    }

    // JWT 토큰에서 실제 사용자 정보 추출
    const token = getCognitoToken();
    const tokenPayload = token ? decodeToken(token) : null;
    const actualSub = tokenPayload?.sub || currentUser?.sub;
    const actualUsername = tokenPayload?.cognito_username || tokenPayload?.username || currentUser?.username || 'Guest';

    const postData = {
      title,
      content,
      category,
      user_id: actualSub,
      username: actualUsername,
    };

    const result = await PostService.createPost(postData);
    console.log('게시글 생성 응답:', result);
    
    // 다양한 응답 구조에서 ID 추출 시도
    const savedPostId = result.data?.id || result.post?.id || result.id || result.post_id;
    
    if (!savedPostId) {
      console.error('게시글 ID 추출 실패:', result);
      throw new Error('게시글 저장에 실패했습니다. 응답에서 ID를 찾을 수 없습니다.');
    }

    this.setState({ postId: savedPostId });
    return savedPostId;
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    
    // 입력 내용 검증
    if (!this.state.title.trim()) {
      alert("게시글 제목을 입력해주세요.");
      return;
    }

    if (!this.state.content.trim()) {
      alert("게시글 내용을 입력해주세요.");
      return;
    }

    if (this.state.content.trim().length < 5) {
      alert("게시글은 최소 5자 이상 입력해주세요.");
      return;
    }

    this.setState({ isLoading: true, error: null });

    const { title, content, category, postId } = this.state;
    const { currentUser } = this.props;

    // JWT 토큰에서 실제 사용자 정보 추출
    const token = getCognitoToken();
    const tokenPayload = token ? decodeToken(token) : null;
    const actualSub = tokenPayload?.sub || currentUser?.sub;
    const actualUsername = tokenPayload?.cognito_username || tokenPayload?.username || currentUser?.username || 'Guest';

    const postData = {
      title,
      content,
      category,
      // Add these fields for post creation/update
      user_id: actualSub,
      username: actualUsername,
    };

    try {
      let result;
      if (postId) {
        // 게시글 수정
        result = await PostService.updatePost(postId, postData);
      } else {
        // 게시글 작성
        result = await PostService.createPost(postData);
      }

      // 게시글 저장 후 이미지 업로드
      if (this.state.selectedFiles.length > 0) {
        const savedPostId = result.data?.id || result.post?.id || result.id || result.post_id;
        console.log('게시글 저장 결과:', result, '추출된 ID:', savedPostId);
        
        // postId가 있는 경우(수정 모드)와 없는 경우(새 작성) 모두 처리
        const finalPostId = savedPostId || postId;
        
        if (!finalPostId || finalPostId === 'null' || finalPostId === null) {
          alert('게시글은 저장되었지만 ID를 가져올 수 없어 이미지 업로드를 건너뜁니다.');
          this.props.navigate('/');
          return;
        }
        
        this.setState({ postId: finalPostId }, async () => {
          try {
            await this.uploadImages();
            alert(postId ? "게시글이 성공적으로 수정되었습니다." : "게시글이 성공적으로 작성되었습니다.");
            this.props.navigate('/');
          } catch (error) {
            alert('게시글은 저장되었지만 이미지 업로드에 실패했습니다. 다시 시도해주세요.');
            // 이미지 업로드 실패해도 게시글은 저장되었으므로 이동
            this.props.navigate('/');
          }
        });
      } else {
        alert(postId ? "게시글이 성공적으로 수정되었습니다." : "게시글이 성공적으로 작성되었습니다.");
        this.props.navigate('/');
      }

    } catch (error) {
      console.error('게시글 저장 오류:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleCancel = () => {
    if (this.state.title.trim() || this.state.content.trim()) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말로 취소하시겠습니까?')) {
        this.props.navigate('/');
      }
    } else {
      this.props.navigate('/');
    }
  };

  render() {
    const { isLoggedIn, currentUser, profileImage } = this.props;
    const { postId, title, content, category, isLoading, error, selectedFiles, uploadedImages, isUploading, uploadProgress } = this.state;



    if (!isLoggedIn) {
      return (
        <CommonLayout
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          navigate={this.props.navigate}
        >
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: 'var(--muted-foreground)'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              marginBottom: '16px',
              color: 'var(--foreground)'
            }}>
              로그인이 필요합니다
            </h2>
            <p style={{ 
              fontSize: '16px', 
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              게시글을 작성하려면 먼저 로그인해주세요.
            </p>
            <button
              onClick={() => this.props.navigate('/login')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
              }}
            >
              로그인하기
            </button>
          </div>
        </CommonLayout>
      );
    }

    return (
      <CommonLayout
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        navigate={this.props.navigate}
        hideSearch={true}
        onCategoryChange={this.handleCategoryChange}
        onLogout={this.props.onLogout}
      >
        <div className="write-post-container">
          {/* 뒤로가기 버튼 */}
          <div className="back-button-container">
            <button
              onClick={this.handleCancel}
              className="back-button"
            >
              <ArrowLeft size={20} />
              뒤로가기
            </button>
          </div>

          <div className="write-post-header">
            <h1 className="write-post-title">{postId ? '게시글 수정' : '새 게시글 작성'}</h1>
            <div className="write-post-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={this.handleCancel}
                disabled={isLoading}
              >
                <X size={16} />
                취소
              </button>
              <button
                type="submit"
                className="save-btn"
                onClick={this.handleSubmit}
                disabled={isLoading}
              >
                <Save size={16} />
                {isLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>오류: {error}</p>
            </div>
          )}

          <form className="write-post-form" onSubmit={this.handleSubmit}>
            <div className="post-form-group">
              <label htmlFor="title" className="post-form-label">제목</label>
              <input
                type="text"
                id="title"
                className="write-form-input"
                value={title}
                onChange={(e) => this.handleInputChange('title', e.target.value)}
                placeholder="게시글 제목을 입력하세요"
                maxLength={100}
                required
              />
              <span className="post-char-count">{title.length}/100</span>
            </div>

            <div className="post-form-group">
              <label htmlFor="category" className="post-form-label">카테고리</label>
              <div className="category-input-container"> {/* 카테고리 입력 컨테이너 (추가됨) */}
                <select
                  id="category"
                  className={`post-form-select ${postId ? 'disabled' : ''}`}
                  value={category}
                  onChange={(e) => this.handleInputChange('category', e.target.value)}
                  disabled={!!postId}
                  required
                >
                  {this.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {postId && <span className="disabled-hint">(수정 시 카테고리는 변경할 수 없습니다)</span>}
              </div>
            </div>

            <div className="post-form-group">
              <label htmlFor="content" className="post-form-label">내용</label>
              <textarea
                id="content"
                className="post-form-textarea"
                value={content}
                onChange={(e) => this.handleInputChange('content', e.target.value)}
                placeholder="게시글 내용을 입력하세요 (최소 5자)"
                rows={15}
                minLength={5}
                required
              />
              <span className="post-char-count">{content.length}자</span>
            </div>

            {/* 이미지 업로드 섹션 */}
            <div className="post-form-group image-upload-section">
              <label className="post-form-label">이미지 첨부</label>
              
              {/* 드래그 앤 드롭 영역 */}
              <div 
                className="image-upload-area"
                onDrop={this.handleDrop}
                onDragOver={this.handleDragOver}
                onClick={() => this.fileInputRef.current && this.fileInputRef.current.click()}
              >
                <div className="upload-content">
                  <Image size={48} className="upload-icon" />
                  <p>이미지를 드래그하거나 클릭하여 선택하세요</p>
                  <p className="upload-hint">JPG, PNG, GIF, WebP (최대 5MB)</p>
                </div>
                <input
                  ref={this.fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={this.handleFileSelect}
                  className="file-input"
                  id="image-upload-input"
                />
              </div>
              

              {/* 선택된 파일 미리보기 */}
              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <h4>선택된 파일 ({selectedFiles.length}개)</h4>
                  <div className="file-preview-grid">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-preview-item">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className="preview-image"
                        />
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)}MB</span>
                        </div>
                        <button 
                          type="button"
                          className="remove-file-btn"
                          onClick={() => this.removeSelectedFile(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    type="button"
                    className="upload-images-btn"
                    onClick={this.uploadImages}
                    disabled={isUploading}
                  >
                    {isUploading ? `업로드 중... ${uploadProgress}%` : '이미지 업로드'}
                  </button>
                </div>
              )}

              {/* 업로드된 이미지 목록 */}
              {uploadedImages.length > 0 && (
                <div className="uploaded-images">
                  <h4>업로드된 이미지 ({uploadedImages.length}개)</h4>
                  <div className="uploaded-images-grid">
                    {uploadedImages.map((image) => (
                      <div key={image.id} className="uploaded-image-item">
                        <img 
                          src={image.s3_url} 
                          alt={image.file_name}
                          className="uploaded-image"
                        />
                        <div className="image-info">
                          <span className="image-name">{image.file_name}</span>
                          <span className="image-size">{(image.file_size / 1024 / 1024).toFixed(2)}MB</span>
                        </div>
                        <button 
                          type="button"
                          className="remove-uploaded-btn"
                          onClick={() => this.removeUploadedImage(image.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </CommonLayout>
    );
  }
}

export default WritePostPage;
