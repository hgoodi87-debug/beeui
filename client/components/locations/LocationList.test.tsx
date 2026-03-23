import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LocationList from './LocationList';

const t = {
  booking: {
    bags_selection_title: '가방 수량 선택',
    pickup_schedule: '맡기는 날짜 선택',
    delivery_schedule: '찾는 날짜 선택',
    select_time: '시간 선택',
  },
  locations_page: {
    sidebar_subtitle: '서울 핵심거점안내',
    badge_delivery: '배송',
    badge_storage: '짐보관',
    find_my_location_short: '내 위치',
    search_placeholder: '내 위치검색',
    service_delivery: '배송',
    service_storage: '보관',
  },
};

describe('LocationList baggage side sheet', () => {
  let container: HTMLDivElement | null = null;

  // React 19 테스트 환경에서 state flush 경고를 막고 실제 업데이트를 기다리기 위한 플래그
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

  afterEach(() => {
    if (container) {
      container.remove();
      container = null;
    }
    document.body.innerHTML = '';
  });

  it('opens the baggage selector as a right-side sheet when the baggage button is clicked', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const root = createRoot(container);

    await act(async () => {
      root.render(
        <LocationList
          t={t}
          lang="ko"
          searchTerm=""
          onSearchChange={vi.fn()}
          onSearchSubmit={vi.fn()}
          filteredBranches={[]}
          totalBranchCount={0}
          selectedBranch={null}
          onBranchClick={vi.fn()}
          currentService="STORAGE"
          onServiceChange={vi.fn()}
          onReset={vi.fn()}
          bookingDate="2026-03-23"
          onDateChange={vi.fn()}
          bookingTime="09:00"
          onTimeChange={vi.fn()}
          returnDate="2026-03-23"
          onReturnDateChange={vi.fn()}
          returnTime="11:00"
          onReturnTimeChange={vi.fn()}
          baggageCounts={{ handBag: 0, carrier: 0, strollerBicycle: 0 }}
          onBaggageChange={vi.fn()}
          deliveryPrices={{ handBag: 10000, carrier: 25000, strollerBicycle: 0 }}
          onBack={vi.fn()}
          onFindMyLocation={vi.fn()}
        />
      );
    });

    const baggageButton = document.querySelector('button[aria-label="가방 선택 열기"]') as HTMLButtonElement | null;

    expect(baggageButton).not.toBeNull();
    expect(document.body.textContent).not.toContain('가방 수량 선택');

    await act(async () => {
      baggageButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(document.body.textContent).toContain('가방 수량 선택');
    expect(document.body.textContent).toContain('쇼핑백, 손가방');
    expect(document.body.textContent).toContain('캐리어');

    root.unmount();
  });
});
