
export type ContentType = 'landmark' | 'hotplace' | 'attraction' | 'event';

export type BranchRelationType = 'nearby_hub' | 'nearby_partner' | 'airport_flow_match';

// [스봉이] CMS 설계서 기반 정교한 상태값 체계 도입 💅
export type PublishStatus = 
    | 'draft'               // 임시저장
    | 'review_requested'    // 검수요청
    | 'in_review'          // 검수중
    | 'approved'           // 승인완료
    | 'scheduled'          // 예약게시
    | 'published'          // 게시중
    | 'hidden'             // 숨김
    | 'archived'           // 아카이브
    | 'rejected';          // 반려

export interface I18nString {
    ko: string;
    en: string;
    ja?: string;
    zh?: string;
    [key: string]: string | undefined;
}

export interface TipContent {
    id: string;
    slug: string;
    title: I18nString;
    content_type: ContentType;
    area_slug: string;
    summary: I18nString;
    body: I18nString;
    cover_image_url: string;
    recommended_time?: string;
    audience_tags: string[];
    theme_tags: string[];
    official_url?: string;
    source_name?: string;
    start_date?: string;
    end_date?: string;
    publish_status: PublishStatus;
    language_available: string[];
    
    // [스봉이] CMS 연동을 위한 추가 필드 🛰️
    author_id?: string;
    reviewer_id?: string;
    review_comment?: string;
    quality_score?: number;     // 0-100 품질 점수
    priority_score?: number;    // 노출 우선순위
    is_foreigner_friendly?: boolean;
    forbidden_word_detected?: boolean;
    
    created_at: string;
    updated_at: string;
}

export interface AreaInfo {
    id: string;
    area_slug: string;
    area_name: I18nString;
    headline: I18nString;
    intro_text: I18nString;
    cover_image_url: string;
    is_priority_area: boolean;
    relatedBranchIds: string[];
}
