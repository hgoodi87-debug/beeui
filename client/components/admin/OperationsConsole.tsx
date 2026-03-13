import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminTab, BookingState, LocationOption, AdminUser, CashClosing, Expenditure, BookingStatus } from '../../types';
import OpsDashboardTab from './ops/OpsDashboardTab';
import OpsDeliveryListTab from './ops/OpsDeliveryListTab';
import OpsDriverTab from './ops/OpsDriverTab';
import OpsHubTab from './ops/OpsHubTab';

import OpsDriverHrTab from './ops/OpsDriverHrTab';

interface OperationsConsoleProps {
  bookings: BookingState[];
  locations: LocationOption[];
  admins: AdminUser[];
  todayKST: string;
  lang: string;
  t: any;
  adminForm: Partial<AdminUser>;
  setAdminForm: (a: Partial<AdminUser>) => void;
  showAdminPassword: boolean;
  setShowAdminPassword: (b: boolean) => void;
  saveAdmin: () => void;
  deleteAdmin: (id: string) => void;
  isSaving: boolean;
}

type OpsTab = 'DASHBOARD' | 'JOBS' | 'DRIVERS' | 'HUBS' | 'DRIVER_HR' | 'ISSUES';

const OperationsConsole: React.FC<OperationsConsoleProps> = ({
  bookings,
  locations,
  admins,
  todayKST,
  lang,
  t,
  adminForm,
  setAdminForm,
  showAdminPassword,
  setShowAdminPassword,
  saveAdmin,
  deleteAdmin,
  isSaving
}) => {
  const [activeOpsTab, setActiveOpsTab] = useState<OpsTab>('DASHBOARD');
  const [selectedHub, setSelectedHub] = useState<LocationOption | null>(null); // 상세 대시보드용 💅

  const OPS_MENU = [
    { id: 'DASHBOARD', label: '관제 보드', icon: 'fa-chart-line' },
    { id: 'JOBS', label: '배송 현황', icon: 'fa-truck-ramp-box' },
    { id: 'DRIVERS', label: '드라이버 실시간', icon: 'fa-id-card' },
    { id: 'HUBS', label: '지점 관리', icon: 'fa-house-laptop' },
    { id: 'DRIVER_HR', label: '기사 관리', icon: 'fa-id-card-clip' },
    { id: 'ISSUES', label: '이슈 센터', icon: 'fa-triangle-exclamation' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-bee-black p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-bee-yellow/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-bee-yellow text-bee-black text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">Live</span>
            <h1 className="text-3xl font-black text-white tracking-tight">통합 관제 콘솔</h1>
          </div>
          <p className="text-gray-400 text-sm font-medium">Beeliber 실시간 배송 및 인프라 통합 관리 시스템</p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-inner overflow-x-auto no-scrollbar max-w-[90vw]">
            {OPS_MENU.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveOpsTab(item.id as OpsTab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                  activeOpsTab === item.id
                    ? 'bg-bee-yellow text-bee-black shadow-lg shadow-bee-yellow/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <i className={`fa-solid ${item.icon}`}></i>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeOpsTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeOpsTab === 'DASHBOARD' && (
              <OpsDashboardTab
                todayKST={todayKST}
                bookings={bookings}
                locations={locations}
                admins={admins}
                onTabChange={(tab: string) => setActiveOpsTab(tab as OpsTab)}
              />
            )}

            {activeOpsTab === 'JOBS' && (
              <OpsDeliveryListTab
                bookings={bookings.filter(b => !b.isDeleted)}
                locations={locations}
                todayKST={todayKST}
              />
            )}

            {activeOpsTab === 'DRIVERS' && (
              <OpsDriverTab
                admins={admins}
                locations={locations}
                bookings={bookings}
              />
            )}

            {activeOpsTab === 'HUBS' && (
              <OpsHubTab
                locations={locations}
                bookings={bookings}
                todayKST={todayKST}
                focusLocation={(loc) => setSelectedHub(loc)} // 버튼 클릭 시 모달 오픈 💅
              />
            )}

            {activeOpsTab === 'DRIVER_HR' && (
              <OpsDriverHrTab
                admins={admins}
                locations={locations}
                adminForm={adminForm}
                setAdminForm={setAdminForm}
                showAdminPassword={showAdminPassword}
                setShowAdminPassword={setShowAdminPassword}
                saveAdmin={saveAdmin}
                deleteAdmin={deleteAdmin}
                isSaving={isSaving}
                onlyDrivers={true} // 운영 콘솔에서는 기사만 보여주기 💅
              />
            )}

            {activeOpsTab === 'ISSUES' && (
              <div className="bg-white p-20 rounded-[40px] border border-gray-100 shadow-xl flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-bee-yellow/20 rounded-full flex items-center justify-center text-4xl text-bee-yellow mb-6 animate-bounce-soft">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h2 className="text-2xl font-black text-bee-black mb-2">이슈 센터 (Issue Center)</h2>
                <p className="text-gray-500 max-w-sm font-medium">현재 보고된 치명적인 배송 이슈가 없습니다. 안심하셔도 좋습니다, 사장님! 💅</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hub Detailed Intelligence Overlay 🛡️ 💅 */}
      <AnimatePresence>
        {selectedHub && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-end p-4 md:p-8 bg-bee-black/60 backdrop-blur-sm"
            onClick={() => setSelectedHub(null)}
          >
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl h-full bg-white rounded-[40px] shadow-2xl flex flex-col overflow-hidden border-l border-white/20"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 bg-bee-black text-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-bee-yellow/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="px-3 py-1 bg-bee-yellow text-bee-black text-[10px] font-black rounded-full uppercase tracking-widest mb-3 inline-block">Hub Intelligence</span>
                    <h2 className="text-3xl font-black tracking-tight">{selectedHub.name}</h2>
                    <p className="text-gray-400 text-xs font-medium mt-1">{selectedHub.address}</p>
                  </div>
                  <button onClick={() => setSelectedHub(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all" title="닫기">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                {/* Real-time Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gray-50 rounded-[30px] border border-gray-100 flex flex-col justify-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">현재 보관량</span>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-bee-black">
                            {bookings.filter(b => !b.isDeleted && b.status === BookingStatus.STORAGE && (b.pickupLocation === selectedHub.id || b.dropoffLocation === selectedHub.id)).length}
                        </span>
                        <span className="text-xs font-bold text-gray-400 pb-1.5">Units</span>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-[30px] border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">오늘의 입출고</span>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-bee-black">
                            {bookings.filter(b => !b.isDeleted && b.pickupDate === todayKST && (b.pickupLocation === selectedHub.id || b.dropoffLocation === selectedHub.id)).length}
                        </span>
                        <span className="text-xs font-bold text-gray-400 pb-1.5">Jobs</span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="p-6 bg-bee-yellow/5 rounded-[30px] border border-bee-yellow/20">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-black flex items-center gap-2">
                            <i className="fa-solid fa-bolt text-bee-yellow"></i>
                            인프라 가동률
                        </h4>
                        <span className="text-xs font-black text-bee-black">정상 가동 중 ⚡</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="w-[75%] h-full bg-bee-yellow rounded-full"></div>
                    </div>
                </div>

                {/* Recent Items at this Hub */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black flex items-center gap-2">
                    <i className="fa-solid fa-list-check text-gray-400"></i>
                    현재 거점 작업 리스트
                  </h4>
                  <div className="space-y-3">
                    {bookings
                      .filter(b => !b.isDeleted && (b.pickupLocation === selectedHub.id || b.dropoffLocation === selectedHub.id))
                      .slice(0, 10).length > 0 ? (
                        bookings
                          .filter(b => !b.isDeleted && (b.pickupLocation === selectedHub.id || b.dropoffLocation === selectedHub.id))
                          .slice(0, 10)
                          .map(b => (
                            <div key={b.id} className="p-3 bg-white border border-gray-50 rounded-2xl flex items-center justify-between hover:border-bee-yellow transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${b.status === BookingStatus.STORAGE ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                                        <i className={`fa-solid ${b.status === BookingStatus.STORAGE ? 'fa-house-lock' : 'fa-truck-fast'}`}></i>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black text-bee-black truncate">{b.userName} - {b.id?.slice(-6).toUpperCase()}</div>
                                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{b.status} • {b.serviceType}</div>
                                    </div>
                                </div>
                                <button className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 hover:bg-bee-black hover:text-bee-yellow transition-all" title="상세 보기">
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                          ))
                      ) : (
                        <div className="py-20 text-center bg-gray-50 rounded-[30px] border border-dashed border-gray-200">
                          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">진행 중인 작업이 없습니다.</p>
                        </div>
                      )
                    }
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0">
                <button 
                  onClick={() => setSelectedHub(null)}
                  className="w-full py-4 bg-bee-black text-white rounded-2xl font-black text-sm hover:bg-bee-yellow hover:text-bee-black transition-all shadow-xl shadow-bee-black/10"
                >
                  지능형 모니터링 종료
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OperationsConsole;
