
import { TipContent } from '../entities/tips.types';
import { LOCATIONS } from '../../../constants';
import { LocationOption } from '../../domains/location/types';

export const useNearbyMatching = () => {
    // [스봉이] 하버사인 공식 (지구 구면 거리 계산) - Feature 레이어로 독립 🛰️
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const findClosestBranch = (lat: number, lng: number) => {
        const activeBranches = (LOCATIONS as LocationOption[]).filter((b: LocationOption) => b.isActive);
        let minDistance = Infinity;
        let closestBranch: LocationOption | null = null;

        activeBranches.forEach((branch: LocationOption) => {
            const bLat = branch.lat;
            const bLng = branch.lng;
            if (bLat && bLng) {
                const dist = getDistance(lat, lng, bLat, bLng);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestBranch = branch;
                }
            }
        });

        return {
            branch: closestBranch,
            distance: minDistance === Infinity ? null : minDistance.toFixed(1)
        };
    };

    return { getDistance, findClosestBranch };
};
