/**
 * 사용자 위치와 지점 간의 거리를 계산하는 영롱한 유틸리티입니다. 💅✨
 */

/**
 * 하버사인(Haversine) 공식을 이용한 두 좌표 간의 거리 계산 (단위: km)
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * 거리를 보기 좋게 포맷팅합니다 (1km 미만은 m, 이상은 km) 💅
 */
export const formatDistance = (distanceKm: number, lang: string = 'ko'): string => {
    if (distanceKm < 1) {
        const meters = Math.round(distanceKm * 1000);
        return `${meters}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
};
