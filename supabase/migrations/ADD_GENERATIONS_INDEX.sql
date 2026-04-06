-- Index for fast user history queries on generations table
CREATE INDEX IF NOT EXISTS idx_generations_user_created
  ON generations(user_id, created_at DESC);
