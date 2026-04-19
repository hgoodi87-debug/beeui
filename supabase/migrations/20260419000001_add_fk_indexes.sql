-- DB-10: 미인덱싱 FK 10건 인덱스 추가
-- advisor unindexed_foreign_keys 경고 항목 — child row 조회/CASCADE 삭제 시 seq scan 방지

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_items_reservation_id
    ON reservation_items (reservation_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservation_items_baggage_type_id
    ON reservation_items (baggage_type_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proof_assets_reservation_id
    ON proof_assets (reservation_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_details_payout_id
    ON booking_details (payout_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_closings_branch_id
    ON daily_closings (branch_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenditures_branch_id
    ON expenditures (branch_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_coupons_discount_code_id
    ON user_coupons (discount_code_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_storage_assets_uploaded_by_user_id
    ON storage_assets (uploaded_by_user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cms_contents_area_slug
    ON cms_contents (area_slug);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_branch_prospects_partnership_inquiry_id
    ON branch_prospects (partnership_inquiry_id);
