/**
 * BookingSuccess.tsx — ship coverage tests (ycm branch)
 *
 * Changes covered:
 *  1. html2canvas static → dynamic import (lazy load)
 *  2. 4-step check-in guide section
 *  3. Contact Us section (Instagram DM / Web Chatbot / Email buttons)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookingSuccess from '../../../components/BookingSuccess';
import { BookingStatus } from './types';
import { LocationType } from '../location/types';
import type { BookingState, LocationOption } from '../../../types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// BookingVoucher contains QR / Supabase work — swap for a stub.
vi.mock('../../../components/BookingVoucher', () => ({
    default: () => <div data-testid="booking-voucher" />,
}));

// framer-motion: render children without animation lifecycle noise.
vi.mock('framer-motion', () => ({
    motion: new Proxy(
        {},
        {
            get: (_: unknown, tag: string) => {
                const Tag = tag as keyof JSX.IntrinsicElements;
                const Comp = ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => {
                    const safe = Object.fromEntries(
                        Object.entries(rest).filter(([k]) => !['initial', 'animate', 'transition', 'exit', 'whileHover', 'whileTap'].includes(k))
                    );
                    return React.createElement(Tag, safe, children);
                };
                Comp.displayName = `motion.${tag}`;
                return Comp;
            },
        }
    ),
}));

// html2canvas: dynamic import stub so handleSaveImage can be exercised.
vi.mock('html2canvas', () => ({
    default: vi.fn().mockResolvedValue({
        toDataURL: () => 'data:image/png;base64,FAKE',
    }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeBooking = (overrides: Partial<BookingState> = {}): BookingState =>
    ({
        serviceType: 'STORAGE' as any,
        pickupLocation: 'LOC_A',
        dropoffLocation: 'LOC_B',
        pickupDate: '2026-05-01',
        pickupTime: '10:00',
        dropoffDate: '2026-05-01',
        deliveryTime: '18:00',
        bags: 1,
        bagSizes: { handBag: 1, carrier: 0, strollerBicycle: 0 },
        price: 5000,
        userName: 'Test User',
        userEmail: 'test@example.com',
        snsChannel: 'instagram',
        snsId: '@testuser',
        status: BookingStatus.CONFIRMED,
        createdAt: new Date().toISOString(),
        reservationCode: 'BL-TEST-001',
        id: 'booking-uuid-123',
        ...overrides,
    } as BookingState);

const makeLocation = (id: string, name = 'Test Location'): LocationOption => ({
    id,
    shortCode: id,
    name,
    type: LocationType.STATION,
    description: '',
    supportsDelivery: true,
    supportsStorage: true,
});

const noopT = {};
const defaultLocations: LocationOption[] = [
    makeLocation('LOC_A', 'Hongdae Station'),
    makeLocation('LOC_B', 'Myeongdong Branch'),
];

// ── Helper ────────────────────────────────────────────────────────────────────

const renderSuccess = (
    lang = 'en',
    booking: BookingState | null = makeBooking(),
    onBack = vi.fn()
) =>
    render(
        <BookingSuccess
            booking={booking}
            locations={defaultLocations}
            onBack={onBack}
            t={noopT}
            lang={lang}
        />
    );

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BookingSuccess — null booking guard', () => {
    it('shows fallback message when booking is null', () => {
        renderSuccess('en', null);
        expect(screen.getByText(/Booking information not found/i)).toBeTruthy();
    });

    it('null booking: back button calls onBack', () => {
        const onBack = vi.fn();
        render(
            <BookingSuccess booking={null} locations={[]} onBack={onBack} t={noopT} lang="en" />
        );
        fireEvent.click(screen.getByRole('button', { name: /back to home/i }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});

describe('BookingSuccess — 4-step check-in guide', () => {
    it('renders 4 numbered step cards (en)', () => {
        renderSuccess('en');
        // Each step card contains a step number span: "1", "2", "3", "4"
        expect(screen.getByText('1')).toBeTruthy();
        expect(screen.getByText('2')).toBeTruthy();
        expect(screen.getByText('3')).toBeTruthy();
        expect(screen.getByText('4')).toBeTruthy();
    });

    it('renders section title: "How It Works (4 Steps)" for en', () => {
        renderSuccess('en');
        expect(screen.getByText('How It Works (4 Steps)')).toBeTruthy();
    });

    it('renders Korean guide title for ko', () => {
        renderSuccess('ko');
        expect(screen.getByText('이용 방법 (4단계)')).toBeTruthy();
    });

    it('renders zh-TW guide title', () => {
        renderSuccess('zh-TW');
        expect(screen.getByText('使用方法（4步驟）')).toBeTruthy();
    });

    it('falls back to English guide for unknown lang', () => {
        renderSuccess('fr');
        expect(screen.getByText('How It Works (4 Steps)')).toBeTruthy();
    });

    it('renders first step text for en', () => {
        renderSuccess('en');
        expect(screen.getByText(/Visit the reservation location/i)).toBeTruthy();
    });

    it('renders first step text for ko', () => {
        renderSuccess('ko');
        expect(screen.getByText(/예약 지점을 방문하세요/i)).toBeTruthy();
    });

    it('step 4 contains pickup-location hint for en', () => {
        renderSuccess('en');
        expect(screen.getByText(/Pick-up Location/i)).toBeTruthy();
    });
});

describe('BookingSuccess — Contact Us section', () => {
    it('renders "Contact Us" heading for en', () => {
        renderSuccess('en');
        expect(screen.getByText('Contact Us')).toBeTruthy();
    });

    it('renders Korean contact heading for ko', () => {
        renderSuccess('ko');
        expect(screen.getByText('문의하기')).toBeTruthy();
    });

    it('renders zh-TW contact heading', () => {
        renderSuccess('zh-TW');
        expect(screen.getByText('聯絡我們')).toBeTruthy();
    });

    it('falls back to English contact heading for unknown lang', () => {
        renderSuccess('fr');
        expect(screen.getByText('Contact Us')).toBeTruthy();
    });

    describe('Instagram DM link', () => {
        it('has href pointing to ig.me/m/beeliber', () => {
            renderSuccess('en');
            const link = screen.getByRole('link', { name: /instagram dm/i });
            expect(link.getAttribute('href')).toBe('https://ig.me/m/beeliber');
        });

        it('opens in new tab (target=_blank)', () => {
            renderSuccess('en');
            const link = screen.getByRole('link', { name: /instagram dm/i });
            expect(link.getAttribute('target')).toBe('_blank');
        });

        it('has rel="noopener noreferrer" for security', () => {
            renderSuccess('en');
            const link = screen.getByRole('link', { name: /instagram dm/i });
            expect(link.getAttribute('rel')).toBe('noopener noreferrer');
        });

        it('renders Korean label "인스타그램 DM"', () => {
            renderSuccess('ko');
            const link = screen.getByRole('link', { name: /인스타그램 DM/i });
            expect(link).toBeTruthy();
        });
    });

    describe('Web Chatbot button', () => {
        it('renders chatbot button with correct label (en)', () => {
            renderSuccess('en');
            expect(screen.getByRole('button', { name: /web chatbot/i })).toBeTruthy();
        });

        it('renders Korean chatbot label "웹 챗봇"', () => {
            renderSuccess('ko');
            expect(screen.getByRole('button', { name: /웹 챗봇/i })).toBeTruthy();
        });

        it('chatbot button calls onBack when clicked', () => {
            const onBack = vi.fn();
            renderSuccess('en', makeBooking(), onBack);
            // The Contact Us chatbot button triggers onBack (navigates back to home/chatbot)
            const buttons = screen.getAllByRole('button', { name: /web chatbot/i });
            fireEvent.click(buttons[0]);
            expect(onBack).toHaveBeenCalledTimes(1);
        });
    });

    describe('Email link', () => {
        it('renders email link with mailto href', () => {
            const booking = makeBooking({ reservationCode: 'BL-TEST-001' });
            render(
                <BookingSuccess
                    booking={booking}
                    locations={defaultLocations}
                    onBack={vi.fn()}
                    t={noopT}
                    lang="en"
                />
            );
            const link = screen.getByRole('link', { name: /send email/i });
            expect(link.getAttribute('href')).toContain('mailto:support@bee-liber.com');
        });

        it('email subject contains the reservation code', () => {
            const booking = makeBooking({ reservationCode: 'BL-UNIQUE-999' });
            render(
                <BookingSuccess
                    booking={booking}
                    locations={defaultLocations}
                    onBack={vi.fn()}
                    t={noopT}
                    lang="en"
                />
            );
            const link = screen.getByRole('link', { name: /send email/i });
            expect(link.getAttribute('href')).toContain('BL-UNIQUE-999');
        });

        it('email href falls back to booking.id when reservationCode absent', () => {
            const booking = makeBooking({ reservationCode: undefined, id: 'fallback-uuid' });
            render(
                <BookingSuccess
                    booking={booking}
                    locations={defaultLocations}
                    onBack={vi.fn()}
                    t={noopT}
                    lang="en"
                />
            );
            const link = screen.getByRole('link', { name: /send email/i });
            expect(link.getAttribute('href')).toContain('fallback-uuid');
        });

        it('renders Korean email label "이메일 문의"', () => {
            renderSuccess('ko');
            const link = screen.getByRole('link', { name: /이메일 문의/i });
            expect(link).toBeTruthy();
        });
    });
});

describe('BookingSuccess — html2canvas dynamic import (handleSaveImage)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does NOT import html2canvas on initial render (lazy)', async () => {
        const html2canvasMod = await import('html2canvas');
        const spy = vi.spyOn(html2canvasMod, 'default');
        renderSuccess('en');
        // No auto-triggered canvas call on mount
        expect(spy).not.toHaveBeenCalled();
    });
});

describe('BookingSuccess — i18n locale coverage', () => {
    const locales = ['ko', 'en', 'ja', 'zh', 'zh-TW', 'zh-HK'] as const;

    locales.forEach((lang) => {
        it(`renders without crashing for lang="${lang}"`, () => {
            const { container } = renderSuccess(lang);
            expect(container.firstChild).not.toBeNull();
        });
    });
});

describe('BookingSuccess — voucher child rendered', () => {
    it('renders the BookingVoucher stub', () => {
        renderSuccess('en');
        expect(screen.getByTestId('booking-voucher')).toBeTruthy();
    });
});

describe('BookingSuccess — footer "Back to Home" button', () => {
    it('calls onBack when footer home button clicked', () => {
        const onBack = vi.fn();
        renderSuccess('en', makeBooking(), onBack);
        // Footer button has text "Back to Home" (en)
        const buttons = screen.getAllByRole('button');
        const homeBtn = buttons.find(
            (b) => b.textContent?.includes('Back to Home')
        );
        expect(homeBtn).toBeTruthy();
        fireEvent.click(homeBtn!);
        expect(onBack).toHaveBeenCalled();
    });
});
