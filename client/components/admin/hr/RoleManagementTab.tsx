import React from 'react';
import { HR_ROLES, HRRole } from '../../../src/constants/hr';

const RoleManagementTab: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-bee-black mb-1">역할 및 권한 템플릿</h2>
          <p className="text-xs font-bold text-gray-400 italic">시스템 접근 수준을 정의하는 마스터 템플릿입니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {HR_ROLES.map((role: HRRole) => (
          <div key={role.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-${role.color}/5 flex items-center justify-center text-${role.color} text-xl`}>
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <h3 className="font-black text-lg text-bee-black">{role.label}</h3>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{role.id}</span>
                </div>
              </div>
              <button 
                title={`${role.label} 템플릿 수정`}
                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 hover:bg-bee-black hover:text-white transition-all flex items-center justify-center shadow-sm"
              >
                <i className="fa-solid fa-pen-nib text-xs"></i>
              </button>
            </div>

            <p className="text-[11px] font-bold text-gray-500 leading-relaxed mb-6">
              {role.desc}
            </p>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">권한 프리셋 예시 (읽기 전용)</h4>
              <div className="flex flex-wrap gap-2">
                {['VIEW', 'EDIT'].map(p => (
                   <span key={p} className="px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-[9px] font-black border border-gray-100 leading-none">
                     {role.id.toUpperCase()}:{p}
                   </span>
                ))}
                <span className="px-2 py-1 bg-bee-yellow/10 text-bee-yellow rounded-lg text-[9px] font-black border border-bee-yellow/20 leading-none">
                  + 그 외 다수
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* 새 역할 추가 더미 */}
        <div 
          onClick={() => alert('역할 추가 기능은 준비 중입니다.')} 
          title="새로운 시스템 역할 정의 추가"
          className="bg-gray-50 p-8 rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-bee-black hover:text-bee-black transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-plus text-xl"></i>
          </div>
          <p className="text-xs font-black italic">새로운 역할 정의 추가</p>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementTab;
