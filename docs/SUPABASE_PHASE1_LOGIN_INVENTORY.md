# Supabase Phase 1 로그인 인벤토리

이 문서는 Supabase Phase 1 전환 후 관리자/직원 로그인용 계정 목록을 정리한 결과물이다.

- 생성 시각(UTC): 2026-03-21T11:28:57.520Z
- 전체 직원 수: 53
- synthetic 이메일 계정 수: 49

## 사용 규칙

- `@staff.bee-liber.invalid` 로 끝나는 이메일은 임시 synthetic 로그인 주소다.
- 이 주소는 실제 메일 수신용이 아니라 전환 기간 로그인 식별자다.
- 실제 이메일을 확보하면 HQ에서 Supabase 계정 이메일을 교체해야 한다.

## 계정 목록

| 이름 | 로그인 이메일 | synthetic | 역할 | 지점 코드 | 지점명 | 조직 | 상태 | legacy_admin_doc_id |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin | ceo@bee-liber.com | no | super_admin | HQ-SEOUL | Beeliber HQ | HQ | active | admin-8684 |
| MYN | legacy-myn-admin-1773414417538-cfcb28ded0@staff.bee-liber.invalid | yes | partner_manager | MYN | 연남점 | PARTNER | active | admin-1773414417538 |
| 강남 신사점 | legacy-msis-admin-branch-msis-17-2dfcc1d652@staff.bee-liber.invalid | yes | partner_manager | MSIS | 강남 신사점 | PARTNER | active | admin-branch-MSIS-1773371038497 |
| 강남역점 | legacy-mgn-admin-branch-mgn-177-f3abf70d88@staff.bee-liber.invalid | yes | partner_manager | MGN | 강남역점 | PARTNER | active | admin-branch-MGN-1773371037385 |
| 광안리지점 | legacy-gal-admin-branch-gal-177-9650b39228@staff.bee-liber.invalid | yes | partner_manager | GAL | 광안리지점 | PARTNER | active | admin-branch-GAL-1773371030783 |
| 광장시장점 | legacy-mgh-admin-branch-mgh-177-5456bb50cb@staff.bee-liber.invalid | yes | partner_manager | MGH | 광장시장점 | PARTNER | active | admin-branch-MGH-1773371037032 |
| 광주지점 | legacy-gju-admin-branch-gju-177-73babb1a74@staff.bee-liber.invalid | yes | partner_manager | GJU | 광주지점 | PARTNER | active | admin-branch-GJU-1773371031494 |
| 김포공항 | legacy-gmp-admin-branch-gmp-177-7288784248@staff.bee-liber.invalid | yes | ops_staff | GMP | 김포공항 | HUB | active | admin-branch-GMP-1773371031832 |
| 김해공항지점 | legacy-ghe-admin-branch-ghe-177-976733085b@staff.bee-liber.invalid | yes | partner_manager | GHE | 김해공항지점 | PARTNER | active | admin-branch-GHE-1773371031125 |
| 남대문지점 | legacy-ndm-admin-branch-ndm-177-0fad5b5054@staff.bee-liber.invalid | yes | partner_manager | NDM | 남대문지점 | PARTNER | active | admin-branch-NDM-1773371039892 |
| 남포지점 | legacy-npo-admin-branch-npo-177-70eec43c5f@staff.bee-liber.invalid | yes | partner_manager | NPO | 남포지점 | PARTNER | active | admin-branch-NPO-1773371040210 |
| 대구지점 | legacy-dgu-admin-branch-dgu-177-dc7dea69bd@staff.bee-liber.invalid | yes | partner_manager | DGU | 대구지점 | PARTNER | active | admin-branch-DGU-1773371030411 |
| 동교 | legacy-staff-admin-1768713339806-7946d9c3f5@staff.bee-liber.invalid | yes | super_admin | HQ-SEOUL | Beeliber HQ | HQ | active | admin-1768713339806 |
| 동대문 | legacy-mdd-admin-1771906117225-1360d2eafa@staff.bee-liber.invalid | yes | partner_manager | MDD | 명동지점 | PARTNER | active | admin-1771906117225 |
| 동대문DDP점 | legacy-ddp-admin-branch-ddp-177-8855745840@staff.bee-liber.invalid | yes | partner_manager | DDP | 동대문DDP점 | PARTNER | active | admin-branch-DDP-1773371030068 |
| 동대문지점 | legacy-mdm-admin-branch-mdm-177-1660dcd255@staff.bee-liber.invalid | yes | partner_manager | MDM | 동대문지점 | PARTNER | active | admin-branch-MDM-1773371036315 |
| 마포지점 | legacy-mmp-admin-branch-mmp-177-89522bfed2@staff.bee-liber.invalid | yes | partner_manager | MMP | 마포지점 | PARTNER | active | admin-branch-MMP-1773371038160 |
| 머니박스제일환전센터 | legacy-mec-admin-branch-mec-177-65ebe87915@staff.bee-liber.invalid | yes | partner_manager | MEC | 머니박스제일환전센터 | PARTNER | active | admin-branch-MEC-1773371036659 |
| 명동2호점 | legacy-2-admin-branch-md2-177-361688c13c@staff.bee-liber.invalid | yes | partner_manager | MD2 | 명동2호점 | PARTNER | active | admin-branch-MD2-1773371035515 |
| 명동직영점 | legacy-mdd-admin-branch-mdd-177-673929146c@staff.bee-liber.invalid | yes | partner_manager | MDD | 명동지점 | PARTNER | active | admin-branch-MDD-1773371035910 |
| 바오 | legacy-hbo-2zhmnx5vv7gza2bq7j2n-3e96dd651b@staff.bee-liber.invalid | yes | partner_manager | HBO | 홍대 바오점 | PARTNER | active | 2zHMNX5Vv7gzA2Bq7J2NMmbR3Jp2 |
| 부산역지점 | legacy-bsn-admin-branch-bsn-177-443dfd9623@staff.bee-liber.invalid | yes | partner_manager | BSN | 부산역지점 | PARTNER | active | admin-branch-BSN-1773371028979 |
| 부평지점 | legacy-bpy-admin-branch-bpy-177-c985f2e47a@staff.bee-liber.invalid | yes | partner_manager | BPY | 부평지점 | PARTNER | active | admin-branch-BPY-1773371028629 |
| 서울 드래곤 시티점 | legacy-mys-admin-branch-mys-177-9277015699@staff.bee-liber.invalid | yes | partner_manager | MYS | 서울 드래곤 시티점 | PARTNER | active | admin-branch-MYS-1773371039506 |
| 서울역지점 | legacy-srk-admin-branch-srk-177-ffe0c4307c@staff.bee-liber.invalid | yes | partner_manager | SRK | 서울역지점 | PARTNER | active | admin-branch-SRK-1773371041374 |
| 성수역점 | legacy-msus-admin-branch-msus-17-d9aaa911d9@staff.bee-liber.invalid | yes | partner_manager | MSUS | 성수역점 | PARTNER | active | admin-branch-MSUS-1773371038839 |
| 송도지점 | legacy-sdo-admin-branch-sdo-177-4b17d65d38@staff.bee-liber.invalid | yes | partner_manager | SDO | 송도지점 | PARTNER | active | admin-branch-SDO-1773371041020 |
| 수원지점 | legacy-swn-admin-branch-swn-177-ee79b559ba@staff.bee-liber.invalid | yes | partner_manager | SWN | 수원지점 | PARTNER | active | admin-branch-SWN-1773371041748 |
| 안국역지점 | legacy-ags-admin-branch-ags-177-e9d076499c@staff.bee-liber.invalid | yes | partner_manager | AGS | 안국역지점 | PARTNER | active | admin-branch-AGS-1773371027854 |
| 여의도지점 | legacy-ydo-admin-branch-ydo-177-e8c9f9f45e@staff.bee-liber.invalid | yes | partner_manager | YDO | 여의도지점 | PARTNER | active | admin-branch-YDO-1773371042781 |
| 연남 | legacy-myn-admin-1768533643975-ce628b2c3d@staff.bee-liber.invalid | yes | partner_manager | MYN | 연남점 | PARTNER | active | admin-1768533643975 |
| 연남점 | legacy-myn-admin-branch-myn-177-6a69285df7@staff.bee-liber.invalid | yes | partner_manager | MYN | 연남점 | PARTNER | active | admin-branch-MYN-1773371039170 |
| 용산 | legacy-mys-admin-1771906131022-33a70dfcde@staff.bee-liber.invalid | yes | partner_manager | MYS | 서울 드래곤 시티점 | PARTNER | active | admin-1771906131022 |
| 운서역지점 | legacy-uso-admin-branch-uso-177-bee60281e6@staff.bee-liber.invalid | yes | partner_manager | USO | 운서역지점 | PARTNER | active | admin-branch-USO-1773371042088 |
| 울산삼산지점 | legacy-uss-admin-branch-uss-177-f7c7bd019e@staff.bee-liber.invalid | yes | partner_manager | USS | 울산삼산지점 | PARTNER | active | admin-branch-USS-1773371042445 |
| 이태원지점 | legacy-miw-admin-branch-miw-177-d60883253f@staff.bee-liber.invalid | yes | partner_manager | MIW | 이태원지점 | PARTNER | active | admin-branch-MIW-1773371037740 |
| 인사동지점 | legacy-isd-admin-branch-isd-177-987b77df17@staff.bee-liber.invalid | yes | partner_manager | ISD | 인사동지점 | PARTNER | active | admin-branch-ISD-1773371034084 |
| 인천공항 T1 | legacy-t1-admin-branch-in1t-17-c4cf64ca02@staff.bee-liber.invalid | yes | ops_staff | IN1T | 인천공항 T1 | HUB | active | admin-branch-IN1T-1773371033293 |
| 인천공항 T2 | legacy-t2-admin-branch-in2t-17-d84ba489d1@staff.bee-liber.invalid | yes | ops_staff | IN2T | 인천공항 T2 | HUB | active | admin-branch-IN2T-1773371033744 |
| 재원 | legacy-staff-1pa7rld1gfty4dw3tp80-1ba23136d9@staff.bee-liber.invalid | yes | super_admin | HQ-SEOUL | Beeliber HQ | HQ | active | 1pA7rLD1GfTY4dw3tP80BU1obKG3 |
| 제주동문시장점 | legacy-jdm-admin-branch-jdm-177-47f4ec818e@staff.bee-liber.invalid | yes | partner_manager | JDM | 제주동문시장점 | PARTNER | active | admin-branch-JDM-1773371034473 |
| 제주지점 | legacy-jej-admin-branch-jej-177-e8054c922f@staff.bee-liber.invalid | yes | partner_manager | JEJ | 제주지점 | PARTNER | active | admin-branch-JEJ-1773371034826 |
| 종로지점 | legacy-jno-admin-branch-jno-177-9d3984d5c0@staff.bee-liber.invalid | yes | partner_manager | JNO | 종로지점 | PARTNER | active | admin-branch-JNO-1773371035176 |
| 진호 | rlaxowl98@gmail.con | no | super_admin | HQ-SEOUL | Beeliber HQ | HQ | active | LgJFfcaHJFgzBJsIAil982xWsCC2 |
| 창원지점 | legacy-cwn-admin-branch-cwn-177-408e9fa6b9@staff.bee-liber.invalid | yes | partner_manager | CWN | 창원지점 | PARTNER | active | admin-branch-CWN-1773371029687 |
| 천명 | dbcjsaud@gmail.com | no | super_admin | HQ-SEOUL | Beeliber HQ | HQ | active | eZEMUxHDHdhuMKVoPMRW0FYK5jp2 |
| 천명 | legacy-staff-rcno2en3gvtjlai5fjor-a025e4218f@staff.bee-liber.invalid | yes | super_admin | HQ-SEOUL | Beeliber HQ | HQ | active | rCno2EN3gvTJlai5FJOrtUVy87K2 |
| 충무로지점 | legacy-cmr-admin-branch-cmr-177-bc43fb1525@staff.bee-liber.invalid | yes | partner_manager | CMR | 충무로지점 | PARTNER | active | admin-branch-CMR-1773371029342 |
| 평택지점 | legacy-ptk-admin-branch-ptk-177-43a0366f2a@staff.bee-liber.invalid | yes | partner_manager | PTK | 평택지점 | PARTNER | active | admin-branch-PTK-1773371040541 |
| 해운대지점 | legacy-hde-admin-branch-hde-177-38d207c8ac@staff.bee-liber.invalid | yes | partner_manager | HDE | 해운대지점 | PARTNER | active | admin-branch-HDE-1773371032925 |
| 현정 | yoo0912345@gmail.com | no | hq_admin | HQ-SEOUL | Beeliber HQ | HQ | active | 0nXM49WS8LSTICreh6TygRS6Wr32 |
| 홍대 바오점 | legacy-hbo-admin-branch-hbo-177-95d5d449eb@staff.bee-liber.invalid | yes | partner_manager | HBO | 홍대 바오점 | PARTNER | active | admin-branch-HBO-1773371032207 |
| 홍대지점 | legacy-hda-admin-branch-hda-177-318b832401@staff.bee-liber.invalid | yes | partner_manager | HDA | 홍대지점 | PARTNER | active | admin-branch-HDA-1773371032550 |
