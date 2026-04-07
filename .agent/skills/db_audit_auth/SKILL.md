---
name: db_audit_auth
description: "DB 검수 서브에이전트 — AUTH & ORGANIZATION 섹션. profiles, roles, branches, employees, employee_roles, employee_branch_assignments 테이블의 무결성·RLS·데이터 검증."
---

# DB 검수: AUTH & ORGANIZATION

## 담당 테이블
- `profiles` — Supabase Auth 사용자 프로필
- `roles` — 역할 코드 마스터
- `branches` — 지점/허브/파트너
- `branch_types` — 지점 유형
- `employees` — 직원 정보
- `employee_roles` — 직원-역할 매핑 (M:N)
- `employee_branch_assignments` — 직원-지점 배정 (M:N)

## 검수 체크리스트

### 1. 스키마 무결성
- [ ] profiles.id가 auth.users.id와 FK cascade로 연결되어 있는가
- [ ] employees.profile_id가 profiles.id와 UNIQUE FK로 연결되어 있는가
- [ ] employee_roles에 (employee_id, role_id) UNIQUE 제약이 있는가
- [ ] employee_branch_assignments에 (employee_id, branch_id) UNIQUE 제약이 있는가
- [ ] is_primary=true인 행이 employee당 최대 1개인지 (employee_roles, employee_branch_assignments)
- [ ] branches.branch_code UNIQUE 및 NOT NULL 확인
- [ ] roles.code UNIQUE 및 NOT NULL 확인

### 2. RLS 정책 검증
- [ ] profiles: authenticated만 본인(id=auth.uid()) 또는 HQ만 접근 가능
- [ ] employees: public_read 정책이 SELECT만 허용하는지 확인
- [ ] employee_roles, employee_branch_assignments: authenticated + 역할 기반 접근
- [ ] branches: public_read는 is_active=true 조건 포함
- [ ] roles: authenticated만 SELECT, HQ만 ALL

### 3. 데이터 정합성
- [ ] employees 중 profile_id가 NULL인 행이 없는지
- [ ] employees.employment_status가 허용값(active/inactive/suspended/resigned/merged)만 포함
- [ ] employee_roles에서 role_id가 roles 테이블에 실제 존재하는지
- [ ] employee_branch_assignments에서 branch_id가 branches에 실제 존재하는지
- [ ] branches.status가 허용값(active/inactive/suspended/closed)만 포함
- [ ] profiles.account_type이 허용값(employee/customer/partner)만 포함

### 4. 헬퍼 함수 검증
- [ ] `has_any_role(text[])` 함수가 정상 작동하는지
- [ ] `has_branch_access(uuid)` 함수가 정상 작동하는지
- [ ] `shares_branch_with_employee(uuid)` 함수가 정상 작동하는지
- [ ] `current_employee_id()` 함수가 auth.uid()로부터 올바르게 employee.id를 반환하는지

### 5. 트리거 검증
- [ ] profiles_set_updated_at 트리거 동작 확인
- [ ] employees_set_updated_at 트리거 동작 확인
- [ ] branches_set_updated_at 트리거 동작 확인
- [ ] roles_set_updated_at 트리거 동작 확인

## 검수 SQL 예시

```sql
-- orphan employee (profile_id가 profiles에 없는 경우)
SELECT e.id, e.name, e.profile_id
FROM employees e
LEFT JOIN profiles p ON e.profile_id = p.id
WHERE p.id IS NULL;

-- 중복 primary role
SELECT employee_id, count(*)
FROM employee_roles WHERE is_primary = true
GROUP BY employee_id HAVING count(*) > 1;

-- 중복 primary branch
SELECT employee_id, count(*)
FROM employee_branch_assignments WHERE is_primary = true
GROUP BY employee_id HAVING count(*) > 1;

-- 비활성 직원이 활성 역할을 가진 경우
SELECT e.id, e.name, e.employment_status, r.code
FROM employees e
JOIN employee_roles er ON e.id = er.employee_id
JOIN roles r ON er.role_id = r.id
WHERE e.employment_status != 'active';
```

## 연관 스킬
- `beeliber_supabase` — 마이그레이션 마스터 플랜
- `beeliber_security` — 보안 가드레일
- `beeliber_operations` — 운영 하네스
