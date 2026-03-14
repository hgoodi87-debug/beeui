/**
 * 어드민 전지점 다국어 주소 보완을 위한 임시 벌크 업데이트 스크립트입니다. 💅✨
 * MBX- 지점들의 누락된 다국어 주소를 AI 번역 API를 통해 채워넣습니다.
 */
import { LOCATIONS } from '../client/constants';
import { StorageService } from '../client/services/storageService';

async function bulkUpdateAddressInfo() {
    console.log("[스봉이] 다국어 주소 보완 작업 시작... 💅✨");
    
    // 주소가 한글로만 되어 있고 다국어가 비어있는 지점들 필터링
    const targetLocations = LOCATIONS.filter(loc => 
        loc.address && (!loc.address_en || !loc.address_ja || !loc.address_zh)
    );

    console.log(`[스봉이] 총 ${targetLocations.length}개의 지점 보완 필요 확인! 💅`);

    for (const loc of targetLocations) {
        try {
            console.log(`[스봉이] '${loc.name}' 번역 중... ✨`);
            const translationResult = await StorageService.translateLocationData({
                name: loc.name,
                address: loc.address,
                pickupGuide: loc.pickupGuide || '',
                description: loc.description || ''
            });

            // 기존 데이터 유지하면서 번역된 주소만 업데이트 (기존에 있으면 유지)
            const updatedLoc = {
                ...loc,
                address_en: loc.address_en || translationResult.address_en,
                address_ja: loc.address_ja || translationResult.address_ja,
                address_zh: loc.address_zh || translationResult.address_zh,
                // 이름도 비어있으면 채워주기
                name_en: loc.name_en || translationResult.name_en,
                name_ja: loc.name_ja || translationResult.name_ja,
                name_zh: loc.name_zh || translationResult.name_zh,
            };

            await StorageService.saveLocation(updatedLoc);
            console.log(`[스봉이] '${loc.name}' 보완 완료! ✅`);
        } catch (e) {
            console.error(`[스봉이] '${loc.name}' 작업 중 사고 발생:`, e);
        }
    }

    console.log("[스봉이] 모든 보완 작업 끝! 사장님, 이제 주소창이 꽉 찼을 거예요. 💅✨☕");
}
