import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminTab, BookingState, LocationOption, AdminUser, CashClosing, Expenditure } from '../types';
import OpsDashboardTab from './ops/OpsDashboardTab';
import OpsDeliveryListTab from './ops/OpsDeliveryListTab';
import OpsDriverTab from './ops/OpsDriverTab';
import OpsHubTab from './ops/OpsHubTab';

interface OperationsConsoleProps {
  bookings: BookingState[];
  locations: LocationOption[];
  admins: AdminUser[];
  todayKST: string;
  lang: string;
  t: any;
}

type OpsTab = 'DASHBOARD' | 'JOBS' | 'DRIVERS' | 'HUBS' | 'ISSUES';

const OperationsConsole: React.FC<OperationsConsoleProps> = ({
  bookings,
  locations,
  admins,
  todayKST,
  lang,
  t
}) => {
  const [activeOpsTab, setActiveOpsTab] = useState<OpsTab>('DASHBOARD');

  const OPS_MENU = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'JOBS', label: 'Delivery Jobs', icon: 'fa-truck-ramp-box' },
    { id: 'DRIVERS', label: 'Drivers', icon: 'fa-id-card' },
    { id: 'HUBS', label: 'Hub Operations', icon: 'fa-house-laptop' },
    { id: 'ISSUES', label: 'Issue Center', icon: 'fa-triangle-exclamation' },
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
            <h1 className="text-3xl font-black text-white tracking-tight">Operations Console</h1>
          </div>
          <p className="text-gray-400 text-sm font-medium">Beeliber 실시간 배송 및 인프라 통합 관제 시스템</p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-inner">
            {OPS_MENU.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveOpsTab(item.id as OpsTab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
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
              />
            )}

            {activeOpsTab === 'JOBS' && (
              <OpsDeliveryListTab
                bookings={bookings.filter(b => !b.isDeleted)}
                locations={locations}
              />
            )}

            {activeOpsTab === 'DRIVERS' && (
              <OpsDriverTab
                admins={admins}
                locations={locations}
              />
            )}

            {activeOpsTab === 'HUBS' && (
              <OpsHubTab
                locations={locations}
                focusLocation={() => {}}
              />
            )}

            {activeOpsTab === 'ISSUES' && (
              <div className="bg-white p-20 rounded-[40px] border border-gray-100 shadow-xl flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-bee-yellow/20 rounded-full flex items-center justify-center text-4xl text-bee-yellow mb-6 animate-bounce-soft">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h2 className="text-2xl font-black text-bee-black mb-2">Issue Center</h2>
                <p className="text-gray-500 max-w-sm font-medium">현재 보고된 치명적인 배송 이슈가 없습니다. 안심하셔도 좋습니다, 사장님! 💅</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OperationsConsole;
