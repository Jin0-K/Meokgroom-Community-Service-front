import { createAuthHeaders } from '../utils/tokenUtils';

class PostService {
  constructor() {
    this.baseURL = process.env.REACT_APP_POST_SERVICE_URL || 'https://api.hhottdogg.shop/api/v1';
  }

  // 인증 헤더 생성
  getAuthHeaders() {
    // 공통 토큰 유틸리티 사용
    return createAuthHeaders();
  }

  // 게시글 작성
  async createPost(postData) {
    try {
      const response = await fetch(`${this.baseURL}/posts`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error(`게시글 작성 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('게시글 작성 오류:', error);
      throw error;
    }
  }

  // 게시글 목록 조회
  async getPosts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.size) queryParams.append('size', params.size);
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `${this.baseURL}/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`게시글 목록 조회 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('게시글 목록 조회 오류:', error);
      throw error;
    }
  }

  // 게시글 상세 조회
  async getPost(postId) {
    try {
      const response = await fetch(`${this.baseURL}/posts/${postId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`게시글 조회 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('게시글 조회 오류:', error);
      throw error;
    }
  }

  // 게시글 수정
  async updatePost(postId, postData) {
    try {
      const response = await fetch(`${this.baseURL}/posts/${postId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error(`게시글 수정 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('게시글 수정 오류:', error);
      throw error;
    }
  }

  // 게시글 삭제
  async deletePost(postId) {
    try {
      const response = await fetch(`${this.baseURL}/posts/${postId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`게시글 삭제 실패: ${response.status}`);
      }

      return response.ok;
    } catch (error) {
      console.error('게시글 삭제 오류:', error);
      throw error;
    }
  }

  // 게시글 좋아요
  async likePost(postId) {
    try {
      const response = await fetch(`${this.baseURL}/posts/${postId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ action: 'like' })
      });

      if (!response.ok) {
        throw new Error(`게시글 좋아요 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('게시글 좋아요 오류:', error);
      throw error;
    }
  }

  // 게시글 좋아요 취소
  async unlikePost(postId) {
    try {
      const response = await fetch(`${this.baseURL}/posts/${postId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ action: 'unlike' })
      });

      if (!response.ok) {
        throw new Error(`게시글 좋아요 취소 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('게시글 좋아요 취소 오류:', error);
      throw error;
    }
  }

  // 내가 작성한 게시글 조회
  async getMyPosts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.size) queryParams.append('size', params.size);

      const url = `${this.baseURL}/posts/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`내 게시글 조회 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('내 게시글 조회 오류:', error);
      throw error;
    }
  }

  // S3 업로드 권한 확인
  async checkMediaPermissions() {
    try {
      const response = await fetch(`${this.baseURL}/posts/media/check-permissions`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`권한 확인 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('권한 확인 오류:', error);
      throw error;
    }
  }

  // 이미지 파일 업로드
  async uploadImage(postId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers = this.getAuthHeaders();
      // FormData 사용 시 Content-Type 헤더는 브라우저가 자동 설정하도록 제거
      delete headers['Content-Type'];

      const response = await fetch(`${this.baseURL}/posts/${postId}/media`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `이미지 업로드 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }
  }

  // 이미지 파일 삭제
  async deleteImage(postId, mediaId) {
    try {
      const response = await fetch(`${this.baseURL}/posts/${postId}/media/${mediaId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `이미지 삭제 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      throw error;
    }
  }

  // 파일 검증
  validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      throw new Error('파일 크기는 5MB 이하여야 합니다.');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 지원)');
    }
    
    return true;
  }
}

export default new PostService();
