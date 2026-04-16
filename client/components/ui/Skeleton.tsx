import React from 'react';

const pulse = 'animate-pulse bg-gray-200 rounded';

/** 테이블 한 행 스켈레톤 */
export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-3 py-3">
        <div className={`h-3.5 w-full ${pulse}`} style={{ opacity: 1 - i * 0.1 }} />
      </td>
    ))}
  </tr>
);

/** 카드형 스켈레톤 */
export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`rounded-2xl border border-gray-100 p-4 space-y-3 ${className}`}>
    <div className={`h-4 w-2/3 ${pulse}`} />
    {Array.from({ length: lines - 1 }).map((_, i) => (
      <div key={i} className={`h-3 ${i % 2 === 0 ? 'w-full' : 'w-4/5'} ${pulse}`} />
    ))}
  </div>
);

/** 리스트 여러 카드 */
export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({
  count = 4,
  className = '',
}) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} className={className} />
    ))}
  </>
);
