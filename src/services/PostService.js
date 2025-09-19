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
      // postId 검증 - 더 엄격하게
      if (!postId || postId === 'null' || postId === null || postId === undefined || postId === 'undefined') {
        throw new Error('유효하지 않은 게시글 ID입니다. postId가 null 또는 undefined입니다.');
      }

      // postId가 숫자나 유효한 문자열인지 확인
      if (typeof postId === 'string' && postId.trim() === '') {
        throw new Error('유효하지 않은 게시글 ID입니다. postId가 빈 문자열입니다.');
      }

      // 파일 검증
      if (!file) {
        throw new Error('업로드할 파일이 없습니다.');
      }

      console.log('PostService.uploadImage 호출 - postId:', postId, '타입:', typeof postId, 'file:', file.name);

      // 파일 안전성 확인: File/Blob 보장 및 파일명 유지
      const blob = await this.ensureBlob(file);
      const filename = (file && file.name) || 'upload.bin';
      const formData = new FormData();
      formData.append('file', blob, filename);

      const headers = this.getAuthHeaders();
      // FormData 사용 시 Content-Type 헤더는 브라우저가 자동 설정하도록 제거
      delete headers['Content-Type'];

      const url = `${this.baseURL}/posts/${postId}/media`;
      console.log('업로드 URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : { message: await response.text().catch(() => '') };

      if (!response.ok) {
        throw new Error(payload.message || `이미지 업로드 실패: ${response.status}`);
      }

      // 백엔드 응답 구조 확인을 위한 로깅
      console.log('PostService.uploadImage 응답:', {
        status: response.status,
        contentType: response.headers.get('content-type'),
        payload: payload,
        url: payload.s3_url || payload.url || payload.image_url || payload.file_url || payload.media_url || payload.src
      });
      
      return payload;
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }
  }

  // dataURL/string -> Blob 변환 포함: 업로드 입력 안전장치
  async ensureBlob(input) {
    if (input instanceof Blob) return input;
    if (typeof input === 'string' && input.startsWith('data:')) {
      const res = await fetch(input);
      return await res.blob();
    }
    // File API를 사용하는 브라우저에서 File은 Blob의 하위형이므로 위에서 포착됨
    throw new Error('유효하지 않은 파일 형식입니다. File/Blob 또는 dataURL이어야 합니다.');
  }

  // 이미지 파일 삭제
  async deleteImage(postId, mediaId) {
    try {
      // postId 검증 - 더 엄격하게
      if (!postId || postId === 'null' || postId === null || postId === undefined || postId === 'undefined') {
        throw new Error('유효하지 않은 게시글 ID입니다. postId가 null 또는 undefined입니다.');
      }

      // postId가 빈 문자열인지 확인
      if (typeof postId === 'string' && postId.trim() === '') {
        throw new Error('유효하지 않은 게시글 ID입니다. postId가 빈 문자열입니다.');
      }

      // mediaId 검증 - 더 엄격하게
      if (!mediaId || mediaId === 'null' || mediaId === null || mediaId === undefined || mediaId === 'undefined') {
        throw new Error('유효하지 않은 미디어 ID입니다.');
      }

      // mediaId가 빈 문자열인지 확인
      if (typeof mediaId === 'string' && mediaId.trim() === '') {
        throw new Error('유효하지 않은 미디어 ID입니다. mediaId가 빈 문자열입니다.');
      }

      console.log('PostService.deleteImage 호출 - postId:', postId, 'mediaId:', mediaId);

      const url = `${this.baseURL}/posts/${postId}/media/${mediaId}`;
      console.log('삭제 URL:', url);

      const response = await fetch(url, {
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
