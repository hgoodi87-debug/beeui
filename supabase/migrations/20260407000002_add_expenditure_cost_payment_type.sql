-- 지출 테이블에 고정비/유동비 및 법인카드/개인비용 구분 컬럼 추가
ALTER TABLE expenditures
  ADD COLUMN IF NOT EXISTS cost_type   text CHECK (cost_type IN ('fixed', 'variable')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_type text CHECK (payment_type IN ('corporate_card', 'personal')) DEFAULT NULL;

COMMENT ON COLUMN expenditures.cost_type    IS '고정비(fixed) / 유동비(variable)';
COMMENT ON COLUMN expenditures.payment_type IS '법인카드(corporate_card) / 개인비용(personal)';
