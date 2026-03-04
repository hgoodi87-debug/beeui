
const names = {
    '안국역지점': ['Anguk Station Branch', '安国駅店', '安国站店'],
    '동대문DDP점': ['Dongdaemun DDP Branch', '東大門DDP店', '东大门DDP店'],
    '종로지점': ['Jongno Branch', '鍾路店', '钟路店'],
    '충무로지점': ['Chungmuro Branch', '忠武路店', '忠武路店'],
    '성수역점': ['Seongsu Station Branch', '聖水駅店', '圣水站店'],
    '강남신사점': ['Gangnam Sinsa Branch', '江南新沙店', '江南新沙店'],
    '머니박스제일환전센터': ['Money Box Exchange Center', 'マネーボックス両替', 'Money Box 换钱中心'],
    '여의도지점': ['Yeouido Branch', '汝矣島店', '汝矣岛店'],
    '명동2호점': ['Myeongdong No.2 Branch', '明洞2号店', '明洞2号店'],
    '이태원지점': ['Itaewon Branch', '梨泰院店', '梨泰院店'],
    '서울역지점': ['Seoul Station Branch', 'ソウル駅店', '首尔站店'],
    '강남역지점': ['Gangnam Station Branch', '江南駅店', '江南站店'],
    '남대문지점': ['Namdaemun Branch', '南大門店', '南大门店'],
    '인사동지점': ['Insadong Branch', '仁寺洞店', '仁寺洞店'],
    '홍대지점': ['Hongdae Branch', '弘大店', '弘大店'],
    '명동직영점': ['Myeongdong Direct Branch', '明洞直営店', '明洞直营店'],
    '평택지점': ['Pyeongtaek Branch', '平澤店', '平泽店'],
    '송도지점': ['Songdo Branch', '松島店', '松岛店'],
    '수원지점': ['Suwon Branch', '水原店', '水原店'],
    '운서역지점': ['Unseo Station Branch', '雲西駅店', '云西站店'],
    '부평지점': ['Bupyeong Branch', '富平店', '富平店'],
    '김포지점': ['Gimpo Branch', '金浦店', '金浦店'],
    '창원지점': ['Changwon Branch', '昌原店', '昌原店'],
    '울산삼산지점': ['Ulsan Samsan Branch', '蔚山三山店', '蔚山三山店'],
    '광안리지점': ['Gwangalli Branch', '広安里店', '广安里店'],
    '부산역지점': ['Busan Station Branch', '釜山駅店', '釜山站店'],
    '대구지점': ['Daegu Branch', '大邱店', '大邱店'],
    '김해공항지점': ['Gimhae Airport Branch', '金海空港店', '金海机场店'],
    '남포지점': ['Nampo Branch', '南浦店', '南浦店'],
    '해운대지점': ['Haeundae Branch', '海雲台店', '海云台店'],
    '제주동문시장점': ['Jeju Dongmun Market Branch', '済州東門市場店', '济州东门市场店'],
    '제주지점': ['Jeju Branch', '済州店', '济州店'],
    '광주지점': ['Gwangju Branch', '光州店', '光州店']
};

const rawData = `
안국역지점 | 02-766-8887 | 서울시 종로구 율곡로 65, 1층
동대문DDP점 | 02-2278-7888 | 서울시 중구 장충단로13길 13, 1층 103호
종로지점 | 02-766-5888 | 서울시 종로구 돈화문로 45, 1층 103호
충무로지점 | 02-2272-8882 | 서울시 중구 마른내로 42, 1층
성수역점 | 02-498-8898 | 서울시 성동구 연무장5가길 16, 1층
강남신사점 | 02-518-8883 | 서울시 강남구 도산대로 127
머니박스제일환전센터 | 02-773-0000 | 서울시 중구 남대문로 68-1
여의도지점 | 02-761-8889 | 서울특별시 영등포구 여의나루로 42, 제1층 116호
명동2호점 | 02-318-8801 | 서울시 중구 명동9길 15(명동1가)
이태원지점 | 02-749-8883 | 서울시 용산구 이태원동 127-28
서울역지점 | 02-706-8880 | 서울시 용산구 한강대로 401-2 1층
강남역지점 | 02-3478-8388 | 서울시 서초구 서초대로77길 3 아라타워 103호
남대문지점 | 02-3789-8588 | 서울시 중구 남대문시장길 73, 1층 일부 104호(회현동1가)
인사동지점 | 02-738-0888 | 서울특별시 종로구 인사동4길 1, 1층(인사동)
홍대지점 | 02-336-7972 | 서울특별시 마포구 와우산로29길 72, 1층 101호
명동직영점 | 02-3789-0888 | 서울특별시 중구 남대문로 52-1
평택지점 | 031-651-8882 | 경기도 평택시 팽성읍 안정순환로 110, 1층
송도지점 | 032-858-8838 | 인천광역시 연수구 인천타워대로132번길 30, 1층 106호
수원지점 | 031-248-7888 | 경기도 수원시 팔달구 향교로1번길 2
운서역지점 | 032-746-1888 | 인천 중구 운서동 2803-1 메가스타영종 제1동제1층 126호
부평지점 | 032-362-8881 | 인천광역시 부평구 부평동 546-64(1층코너왼쪽상가)
김포지점 | 031-989-4448 | 경기도 김포시 대곶면 율마로 37, 1층
창원지점 | 055-267-8881 | 경상남도 창원시 성산구 상남로 118, 102호
울산삼산지점 | 052-258-8881 | 울산시 남구 삼산동 1479-5번지 1층 104호
광안리지점 | 051-758-8858 | 부산시 수영구 광안로 20, 119호
부산역지점 | 051-467-8880 | 부산광역시 동구 중앙대로203번길 10, 1층
대구지점 | 053-423-0888 | 대구광역시 중구 덕산동 124-40 101호
김해공항지점 | 051-973-9996 | 부산광역시 강서구 공항진입로 165(대저2동)
남포지점 | 051-245-9998 | 부산광역시 중구 광복로 38, 1층 A1호
해운대지점 | 051-742-9998 | 부산광역시 해운대구 중동 1392-100 씨클라우드호텔 1층
제주동문시장점 | 064-755-8881 | 제주특별자치도 제주시 관덕로64, 명가빌딩 1층
제주지점 | 064-743-8887 | 제주특별자치도 제주시 원노형4길 1, 에코메르 102호
광주지점 | 062-226-7972 | 광주광역시 서구 내방로 367, 118호(화정동, 메리양혼수백화점)
`;

const coords = {
    '종로구': [37.5730, 126.9794],
    '중구': [37.5641, 126.9979],
    '성동구': [37.5635, 127.0368],
    '강남구': [37.4979, 127.0276],
    '영등포구': [37.5262, 126.8962],
    '용산구': [37.5323, 126.9906],
    '서초구': [37.4837, 127.0324],
    '마포구': [37.5662, 126.9019],
    '평택': [36.9921, 127.1127],
    '송도': [37.3850, 126.6430],
    '수원': [37.2636, 127.0286],
    '운서': [37.4920, 126.4930],
    '부평': [37.4894, 126.7248],
    '김포': [37.6151, 126.7153],
    '창원': [35.2281, 128.6811],
    '울산': [35.5392, 129.3114],
    '광안리': [35.1531, 129.1189],
    '부산역': [35.1147, 129.0401],
    '대구': [35.8714, 128.6014],
    '김해공항': [35.1718, 128.9483],
    '남포': [35.0974, 129.0347],
    '해운대': [35.1631, 129.1636],
    '제주': [33.4996, 126.5312],
    '광주': [35.1595, 126.8526]
};

const lines = rawData.trim().split('\n');
const branches = lines.map((line, index) => {
    const parts = line.split('|').map(s => s.trim());
    const name = parts[0];
    const phone = parts[1];
    let address = parts[2];

    // Clean address: remove unit info
    address = address.split(',')[0].trim();
    if (address.includes('(')) address = address.split('(')[0].trim();

    // Pick coordinates
    let lat = 37.5665;
    let lng = 126.9780;
    for (const [key, val] of Object.entries(coords)) {
        if (address.includes(key) || name.includes(key)) {
            lat = val[0];
            lng = val[1];
            break;
        }
    }

    const id = 'MBX-' + (index + 1).toString().padStart(3, '0');
    const [enName, jaName, zhName] = names[name] || [name, name, name];

    const address_en = address
        .replace('서울시', 'Seoul').replace('인천광역시', 'Incheon').replace('부산광역시', 'Busan')
        .replace('경기도', 'Gyeonggi').replace('중구', 'Jung-gu').replace('종로구', 'Jongno-gu')
        .replace('강남구', 'Gangnam-gu').replace('성동구', 'Seongdong-gu').replace('영등포구', 'Yeongdeungpo-gu')
        .replace('용산구', 'Yongsan-gu').replace('서초구', 'Seocho-gu').replace('마포구', 'Mapo-gu')
        .replace('평택시', 'Pyeongtaek').replace('연수구', 'Yeonsu-gu').replace('수원시', 'Suwon')
        .replace('부평구', 'Bupyeong-gu').replace('김포시', 'Gimpo').replace('창원시', 'Changwon')
        .replace('수영구', 'Suyeong-gu').replace('동구', 'Dong-gu').replace('강서구', 'Gangseo-gu')
        .replace('해운대구', 'Haeundae-gu').replace('제주시', 'Jeju').replace('서구', 'Seo-gu');

    return {
        id: id, shortCode: id, name: name, type: 'LocationType.PARTNER',
        description: '연락처: ' + phone, address: address,
        name_en: enName, address_en: address_en,
        name_ja: jaName, address_ja: address,
        name_zh: zhName, address_zh: address,
        businessHours: '09:00 - 21:00',
        supportsDelivery: true, supportsStorage: true,
        isOrigin: true, isDestination: true,
        isPartner: true, isActive: false, lat: lat, lng: lng
    };
});

const output = branches.map(b => {
    return `  {
    id: '${b.id}', shortCode: '${b.shortCode}', name: '${b.name}', type: ${b.type},
    description: '${b.description}', address: '${b.address}',
    name_en: '${b.name_en}', address_en: '${b.address_en}',
    name_ja: '${b.name_ja}', address_ja: '${b.address_ja}',
    name_zh: '${b.name_zh}', address_zh: '${b.address_zh}',
    businessHours: '${b.businessHours}',
    supportsDelivery: ${b.supportsDelivery}, supportsStorage: ${b.supportsStorage}, 
    isOrigin: ${b.isOrigin}, isDestination: ${b.isDestination},
    isPartner: ${b.isPartner}, isActive: ${b.isActive}, lat: ${b.lat}, lng: ${b.lng}
  },`;
}).join('\n');

console.log(output);
