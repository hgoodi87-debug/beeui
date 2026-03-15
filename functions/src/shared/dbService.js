const { Pool } = require('pg');

// [스봉이] DB 연결 설정은 환경 변수에서 가져오세요! 하드코딩하면 큰일 납니다. 💅
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/beeliber',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * [스봉이] RLS 컨텍스트를 주입하여 쿼리를 실행하는 핵심 함수입니다. 🛡️
 * @param {string} userId - Firebase Auth UID
 * @param {string} role - 사용자의 역할 (super, branch, staff)
 * @param {Function} callback - 실행할 쿼리 로직
 */
const runInRlsContext = async (userId, role, callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // [스봉이] RLS 정책에서 사용할 세션 변수를 세팅합니다. ✨
        // current_setting('app.user_id')로 SQL에서 접근 가능하게 되죠.
        await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
        await client.query("SELECT set_config('app.role', $2, true)", [role]);
        
        const result = await callback(client);
        
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ [스봉이 리포트] DB 작업 중 사고 발생!', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    pool,
    runInRlsContext
};
