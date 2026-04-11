-- ═══════════════════════════════════════════════════════════════════════════
-- Kiosk Tables Migration — 2026-04-11
-- 현장 키오스크를 메인 DB(xpnf...)로 통합
-- - kiosk_branches  : URL slug → 지점 매핑
-- - kiosk_settings  : 지점별 설정 (default fallback 지원)
-- - kiosk_storage_log : 짐 보관 로그 (commission_rate=0 고정)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. kiosk_branches
CREATE TABLE IF NOT EXISTS kiosk_branches (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT    UNIQUE NOT NULL,          -- URL 식별자: '홍대', 'insadong'
  branch_id    TEXT,                             -- locations 테이블 FK (선택)
  branch_name  TEXT    NOT NULL,
  branch_name_en TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. kiosk_settings (지점별 + default fallback)
CREATE TABLE IF NOT EXISTS kiosk_settings (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id   TEXT  NOT NULL DEFAULT 'default',
  key         TEXT  NOT NULL,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kiosk_settings_branch_key UNIQUE (branch_id, key)
);

-- 3. kiosk_storage_log
CREATE TABLE IF NOT EXISTS kiosk_storage_log (
  id              BIGSERIAL PRIMARY KEY,
  branch_id       TEXT    NOT NULL,
  date            TEXT    NOT NULL,              -- 'YYYY-MM-DD'
  tag             INTEGER NOT NULL,
  small_qty       INTEGER NOT NULL DEFAULT 0,
  carrier_qty     INTEGER NOT NULL DEFAULT 0,
  start_time      TEXT    NOT NULL,
  pickup_time     TEXT    NOT NULL,
  pickup_ts       BIGINT  NOT NULL,
  duration        INTEGER NOT NULL,
  original_price  INTEGER NOT NULL DEFAULT 0,
  discount        INTEGER NOT NULL DEFAULT 0,
  payment         TEXT    NOT NULL DEFAULT '미수금',
  done            BOOLEAN NOT NULL DEFAULT FALSE,
  memo            TEXT             DEFAULT '',
  row_label       TEXT             DEFAULT '',
  source          TEXT             DEFAULT 'kiosk',
  commission_rate NUMERIC          DEFAULT 0,    -- 키오스크 = 항상 0%
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kiosk_log_branch_date
  ON kiosk_storage_log (branch_id, date);
CREATE INDEX IF NOT EXISTS idx_kiosk_log_done
  ON kiosk_storage_log (branch_id, done);
CREATE INDEX IF NOT EXISTS idx_kiosk_settings_branch
  ON kiosk_settings (branch_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE kiosk_branches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_storage_log ENABLE ROW LEVEL SECURITY;

-- kiosk_branches: 활성 지점은 누구나 읽기 가능 (키오스크 공개 URL 필요)
CREATE POLICY "kiosk_branches_public_read"
  ON kiosk_branches FOR SELECT
  USING (is_active = TRUE);

-- kiosk_settings: 키오스크 자체가 설정을 읽고 써야 함 (anon 허용)
CREATE POLICY "kiosk_settings_anon_read"
  ON kiosk_settings FOR SELECT USING (TRUE);
CREATE POLICY "kiosk_settings_anon_write"
  ON kiosk_settings FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- kiosk_storage_log: 키오스크에서 삽입·조회·수정, 어드민에서 삭제
CREATE POLICY "kiosk_log_anon_insert"
  ON kiosk_storage_log FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "kiosk_log_anon_select"
  ON kiosk_storage_log FOR SELECT USING (TRUE);
CREATE POLICY "kiosk_log_anon_update"
  ON kiosk_storage_log FOR UPDATE USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "kiosk_log_anon_delete"
  ON kiosk_storage_log FOR DELETE USING (TRUE);

-- ─── Seed Data ───────────────────────────────────────────────────────────

-- 기본 지점 샘플 (실제 운영 지점으로 교체 필요)
INSERT INTO kiosk_branches (slug, branch_id, branch_name, branch_name_en) VALUES
  ('홍대',   'hongdae',    '홍대점',   'Hongdae'),
  ('인사동',  'insadong',   '인사동점',  'Insadong'),
  ('명동',   'myeongdong', '명동점',   'Myeongdong'),
  ('동대문', 'dongdaemun', '동대문점', 'Dongdaemun')
ON CONFLICT (slug) DO NOTHING;

-- 기본 설정 (default = 모든 지점 공통 fallback)
INSERT INTO kiosk_settings (branch_id, key, value) VALUES
  ('default', 'prices',
    '{"small_4h":4000,"carrier_2h":3000,"carrier_4h":5000,"extra_per_hour":1000}'),
  ('default', 'operations',
    '{"max_bags":6,"close_hour":21,"duration_options":[2,4,5,6,7,8]}'),
  ('default', 'notices',
    '{"ko":["저희 매장은 오후 9시까지 운영합니다.","현금 결제만 가능합니다."],"en":["We operate until 9PM.","Cash payment only."],"zh":["营业至晚上9点。","仅接受现金支付。"]}'),
  ('default', 'discount',
    '{"unit":1000,"allow_free":true}'),
  ('default', 'admin_password', '"0000"'),
  ('default', 'row_rules',
    '{"rows":[{"label":"A","start":"09:00","end":"12:00","max":4},{"label":"B","start":"12:00","end":"13:00","max":5},{"label":"C","start":"13:00","end":"14:00","max":5},{"label":"D","start":"14:00","end":"15:30","max":5},{"label":"E","start":"15:30","end":"17:00","max":5},{"label":"F","start":"17:00","end":"19:00","max":5},{"label":"G","start":"19:00","end":"21:00","max":6}]}')
ON CONFLICT (branch_id, key) DO NOTHING;
