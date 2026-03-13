// functions/src/shared/translations.js
const getTranslations = (lang) => {
    const l = lang || 'ko';
    const isKo = l === 'ko';
    const isJa = l === 'ja';
    const isZh = l === 'zh';

    return {
        voucherSubject: isKo ? '예약 확정 바우처' : (isJa ? '予約確定バウチャー' : (isZh ? '预订确认凭证' : 'Booking Confirmation Voucher')),
        arrivalSubject: isKo ? '목적지 도착 완료' : (isJa ? '目的地到着完了' : (isZh ? '行李已到达目的地' : 'Arrival at Destination')),
        arrivalTitle: isKo ? '짐이 도착했습니다!' : (isJa ? '荷物が到着しました！' : (isZh ? '行李已送达！' : 'Your bags have arrived!')),
        arrivalDesc: isKo ? '고객님의 소중한 짐이 목적지에 안전하게 도착하였습니다.<br/>짐을 찾으실 때 직원에게 바우처(QR)를 제시해주세요.' :
            (isJa ? 'お客様の大切な荷物が目的地に無事到着しました。<br/>荷物を受け取られる際、スタッフにバウチャー(QR)をご提示ください。' :
                (isZh ? '您的贵重行李已安全送达目的地。<br/>领取行李时，请向工作人员出示凭证(QR码)。' :
                    'Your luggage has arrived safely at the destination.<br/>Please present your voucher (QR) to the staff when picking up.')),
        detailsTitle: isKo ? '상세 정보' : (isJa ? '詳細情報' : (isZh ? '详细信息' : 'Details')),
        mapBtn: isKo ? '지도에서 위치 보기' : (isJa ? '地図で場所を確認' : (isZh ? '在地图上查看' : 'View on Map')),
        pickupGuideTitle: isKo ? '상세 수령 안내' : (isJa ? '受け取り詳細案内' : (isZh ? '领取详细指南' : 'Pickup Instructions')),
        thanks: isKo ? '감사합니다. 즐거운 여행 되세요! 🐝' : (isJa ? 'ありがとうございます。良い旅を！ 🐝' : (isZh ? '谢谢。祝您旅途愉快！ 🐝' : 'Thank you. Have a great trip! 🐝')),
        refundSubject: isKo ? '[Beeliber] 반품/환불 처리가 완료되었습니다' : (isJa ? '[Beeliber] 返品・返金処理が完了しました' : (isZh ? '[Beeliber] 退货/退款处理已完成' : '[Beeliber] Return/Refund Processed')),
        refundTitle: isKo ? '반품(환불) 완료 안내' : (isJa ? '返品（返金）完了の案内' : (isZh ? '退货（退款）完成通知' : 'Return/Refund Confirmation')),
        greeting: isKo ? '안녕하세요' : (isJa ? 'こんにちは' : (isZh ? '你好' : 'Hello')),
        refundDesc: isKo ? '고객님의 요청에 따라 반품 및 환불 처리가 완료되었습니다.' : (isJa ? 'お客様の要請に従い、返品および返金処理が完了しました。' : (isZh ? '根据您的请求，退货及退款处理已完成。' : 'Your return/refund request has been processed successfully.')),
        refundNote: isKo ? '카드사 사정에 따라 실제 환불까지 영업일 기준 3~5일이 소요될 수 있습니다.' : (isJa ? '카드会社の事情により、実際の返金まで営業日基準で3〜5日かかる場合があります。' : (isZh ? '视卡片公司情况而정，实际退款可能需要 3-5 个工作日。' : 'Please allow 3-5 business days for the refund to appear on your statement.')),
        statusLabel: isKo ? '처리 상태' : (isJa ? '処理状態' : (isZh ? '处理状态' : 'Status')),
        refundAmountLabel: isKo ? '환불 금액' : (isJa ? '返金金額' : (isZh ? '退款金额' : 'Refund Amount')),
        routeLabel: isKo ? '배송 경로' : (isJa ? '配送ルート' : (isZh ? '配送路线' : 'Route')),
        nameLabel: isKo ? '이름' : (isJa ? '氏名' : (isZh ? '姓名' : 'Name')),
        departureLabel: isKo ? '출발지 정보' : (isJa ? '出発地情報' : (isZh ? '出发地信息' : 'Departure Info')),
        arrivalLabel: isKo ? '도착지 정보' : (isJa ? '到着地情報' : (isZh ? '目的地信息' : 'Arrival Info')),
        addressLabel: isKo ? '주소' : (isJa ? '住所' : (isZh ? '地址' : 'Address')),
        pickupTimeLabel: isKo ? '수령 시간' : (isJa ? '受け取り時間' : (isZh ? '领取时间' : 'Pickup Time')),
        arrivalTimeLabel: isKo ? '도착 시간' : (isJa ? '到着時間' : (isZh ? '送达时间' : 'Arrival Time')),
        bagsLabel: isKo ? '가방' : (isJa ? '荷物' : (isZh ? '行李' : 'Bags')),
        paymentLabel: isKo ? '결제 금액' : (isJa ? '決済金額' : (isZh ? '支付金额' : 'Total Payment')),
        footerNote: isKo ? '본 바우처를 서비스 지점 직원에게 제시해주시기 바랍니다.' : (isJa ? 'このバウチャーをサービス地点のスタッフにご提示ください。' : (isZh ? '请向服务点工作人员出示此凭证。' : 'Please show this voucher to the Beeliber staff.')),
        mapDeparture: isKo ? '출발지 지도' : (isJa ? '出発地地図' : (isZh ? '出发地地图' : 'Departure Map')),
        mapArrival: isKo ? '도착지 지도' : (isJa ? '目的地地図' : (isZh ? '目的地地图' : 'Arrival Map')),
        branchStore: isKo ? '지점 수령' : (isJa ? '支店受け取り' : (isZh ? '分店领取' : 'Branch Pickup')),
        storageLabel: isKo ? '보관' : (isJa ? '保管' : (isZh ? '保管' : 'Storage')),
        voucherLabel: isKo ? '바우처' : (isJa ? 'バウチャー' : (isZh ? '凭证' : 'Voucher')),
        snsIdLabel: isKo ? 'SNS ID' : (isJa ? 'SNS ID' : (isZh ? 'SNS ID' : 'SNS ID')),
        infoLabel: isKo ? '정보' : (isJa ? '情報' : (isZh ? '信息' : 'Info')),
        timeLabel: isKo ? '시간' : (isJa ? '時間' : (isZh ? '时间' : 'Time')),
        agreeHighValueLabel: isKo ? '고가 물품 관리 정책 동의' : (isJa ? '高価品管理政策への同意' : (isZh ? '高价物品管理政策同意' : 'Agreement to High Value Items Policy')),
        agreedCompleted: isKo ? '동의 완료' : (isJa ? '同意済み' : (isZh ? '已同意' : 'Agreed')),
        airportLateNotice: isKo ? '공항 지점은 정해진 수령 시간에 맞춰 방문해주셔야 합니다. 지연 도착 시 별도의 추가 보관료가 발생할 수 있으니 시간을 꼭 준수해 주세요! 🍯' :
            (isJa ? '空港の店舗は、決められた受取時間に合わせてお越しいただく必要があります。到着が遅れると別途保管料が発生することがありますので、時間を必ず守ってください! 🍯' :
                (isZh ? '机场分店需要根据预约的时间准时到达。迟到可能会产生额外的保管费用，请务必准时！ 🍯' :
                    'Airport locations require arrival exactly at the scheduled collection time. Late arrival may result in additional charges, so please be punctual! 🍯'))
    };
};

module.exports = { getTranslations };
