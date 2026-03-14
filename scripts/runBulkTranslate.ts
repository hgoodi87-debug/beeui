/**
 * 어드민 전지점 다국어 주소 보완을 위한 실행용 스크립트입니다. 💅✨
 */
import { LOCATIONS } from '../client/constants';
import { StorageService } from '../client/services/storageService';

async function runBulkUpdate() {
    console.log("[스봉이] 다국어 주소 보완 엔진 가동... 💅✨");

    // 주소가 한글로만 되어 있고 다국어가 비어있는 지점들 필터링
    const targetLocations = LOCATIONS.filter(loc => 
        loc.address && (!loc.address_en || !loc.address_ja || !loc.address_zh)
    );

    console.log(`[스봉이] 총 ${targetLocations.length}개의 지점 보완 필요! 💅`);

    for (const loc of targetLocations) {
        try {
            console.log(`[스봉이] '${loc.name}' 데이터 분석 및 번역 중... ✨`);
            // StorageService.translateLocationData 직접 호출 (Gemini API 사용)
            const translationResult = await StorageService.translateLocationData({
                name: loc.name,
                address: loc.address,
                pickupGuide: loc.pickupGuide || '',
                description: loc.description || ''
            });

            const updatedLoc = {
                ...loc,
                name_en: loc.name_en || translationResult.name_en,
                name_ja: loc.name_ja || translationResult.name_ja,
                name_zh: loc.name_zh || translationResult.name_zh,
                address_en: loc.address_en || translationResult.address_en,
                address_ja: loc.address_ja || translationResult.address_ja,
                address_zh: loc.address_zh || translationResult.address_zh,
                description_en: loc.description_en || translationResult.description_en,
                description_ja: loc.description_ja || translationResult.description_ja,
                description_zh: loc.description_zh || translationResult.description_zh,
                pickupGuide_en: loc.pickupGuide_en || translationResult.pickupGuide_en,
                pickupGuide_ja: loc.pickupGuide_ja || translationResult.pickupGuide_ja,
                pickupGuide_zh: loc.pickupGuide_zh || translationResult.pickupGuide_zh,
            };

            await StorageService.saveLocation(updatedLoc);
            console.log(`[스봉이] '${loc.name}' Firestore 업데이트 성공! ✅`);
        } catch (e) {
            console.error(`[스봉이] '${loc.name}' 작업 중 사고 발생:`, e);
            // 에러 나도 멈추지 말고 다음 거 해야죠 💅
        }
    }

    console.log("[스봉이] 모든 다국어 주소 보완 작업 완료! 이제 세상 어디서 봐도 영롱할 거예요. 💅✨☕");
}

runBulkUpdate().catch(console.error);
