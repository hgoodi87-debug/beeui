insert into public.branch_types (code, name)
values
  ('HUB', '배송+보관'),
  ('PARTNER', '보관 전용')
on conflict (code) do nothing;

insert into public.services (code, name)
values
  ('STORAGE', '보관'),
  ('HUB_TO_AIRPORT', 'Hub → 인천공항 배송')
on conflict (code) do nothing;

insert into public.baggage_types (code, name, requires_manual_review)
values
  ('SHOPPING_BAG', '쇼핑백', false),
  ('CARRY_ON', '기내용 캐리어', false),
  ('SUITCASE', '대형 캐리어', false),
  ('SPECIAL', '특수짐', true)
on conflict (code) do nothing;

-- branch type level baseline rules
insert into public.service_rules (
  branch_type_id,
  service_id,
  baggage_type_id,
  allowed,
  requires_manual_review,
  phase_code,
  reject_message_ko,
  reject_message_en,
  priority
)
select
  bt.id,
  s.id,
  b.id,
  case
    when bt.code = 'PARTNER' and s.code = 'HUB_TO_AIRPORT' then false
    else true
  end as allowed,
  case
    when b.code = 'SPECIAL' then true
    else false
  end as requires_manual_review,
  'PHASE_1',
  case
    when bt.code = 'PARTNER' and s.code = 'HUB_TO_AIRPORT' then '해당 지점은 현재 공항 배송을 운영하지 않습니다.'
    else null
  end,
  case
    when bt.code = 'PARTNER' and s.code = 'HUB_TO_AIRPORT' then 'This location currently does not support airport delivery.'
    else null
  end,
  100
from public.branch_types bt
cross join public.services s
cross join public.baggage_types b
where not exists (
  select 1 from public.service_rules sr
  where sr.branch_type_id = bt.id
    and sr.service_id = s.id
    and sr.baggage_type_id = b.id
    and sr.phase_code = 'PHASE_1'
);

-- recommended issue code reference comments
comment on table public.issue_tickets is 'Recommended issue_code values: OPS-001 customer_no_response, OPS-002 branch_hours_mismatch, OPS-003 driver_delay, OPS-004 address_mismatch, OPS-005 proof_missing, OPS-006 baggage_mismatch, OPS-007 invalid_after_payment, OPS-008 onsite_rejection, OPS-009 damage_loss_suspected, OPS-010 airport_handover_failed';
