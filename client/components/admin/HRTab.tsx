import React from 'react';
import { AdminUser, LocationOption } from '../../types';
import EmployeeListTab from './hr/EmployeeListTab';
import RoleManagementTab from './hr/RoleManagementTab';
import EmployeeDetailPanel from './hr/EmployeeDetailPanel';

interface HRTabProps {
    adminForm: Partial<AdminUser>;
    setAdminForm: (a: Partial<AdminUser>) => void;
    showAdminPassword: boolean;
    setShowAdminPassword: (b: boolean) => void;
    saveAdmin: () => void;
    admins: AdminUser[];
    deleteAdmin: (id: string) => void;
    isSaving: boolean;
    locations: LocationOption[];
}

type HRTabMode = 'EMPLOYEES' | 'ROLES' | 'AUDIT_LOGS';

const HRTab: React.FC<HRTabProps> = ({
    adminForm, setAdminForm, showAdminPassword, setShowAdminPassword,
    saveAdmin, admins, deleteAdmin, isSaving, locations
}) => {
    const [activeTab, setActiveTab] = React.useState<HRTabMode>('EMPLOYEES');
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);
    const [editingEmployee, setEditingEmployee] = React.useState<Partial<AdminUser> | null>(null);

    const handleEdit = (admin: AdminUser) => {
      setEditingEmployee(admin);
      setIsDetailOpen(true);
    };

    const handleAdd = () => {
      setEditingEmployee(null);
      setIsDetailOpen(true);
    };

    const handleSave = async (data: Partial<AdminUser>) => {
      // Sync local state to parent form before saving
      setAdminForm(data);
      // Wait for state sync or use data directly (parent saveAdmin needs to be updated to accept data eventually)
      // For now, we'll use the existing saveAdmin which relies on adminForm state.
      // Small delay to ensure state update propagated if using saveAdmin() immediately
      setTimeout(() => {
        saveAdmin();
        setIsDetailOpen(false);
      }, 0);
    };

    return (
        <div className="space-y-8 md:space-y-10 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                   <h1 className="text-3xl md:text-4xl font-black tracking-tight text-bee-black mb-2">
                     운영 인력 관리 <span className="text-bee-yellow italic">HR</span>
                   </h1>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">운영 인력 통합 관리 시스템</p>
                </div>
                
                {/* Tab Switcher */}
                <div className="bg-white p-1.5 rounded-[24px] border border-gray-100 shadow-sm flex gap-1">
                  {[
                    { id: 'EMPLOYEES', label: '직원 명부', icon: 'fa-user-group' },
                    { id: 'ROLES', label: '역할 & 권한', icon: 'fa-shield-halved' },
                    { id: 'AUDIT_LOGS', label: '활동 이력', icon: 'fa-receipt' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as HRTabMode)}
                      className={`px-6 py-3 rounded-[18px] text-[11px] font-black transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-bee-black text-bee-yellow shadow-lg' : 'text-gray-400 hover:text-bee-black hover:bg-gray-50'}`}
                    >
                      <i className={`fa-solid ${tab.icon}`}></i>
                      {tab.label}
                    </button>
                  ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
              {activeTab === 'EMPLOYEES' && (
                <EmployeeListTab 
                  admins={admins}
                  locations={locations}
                  onEdit={handleEdit}
                  onDelete={deleteAdmin}
                  onAdd={handleAdd}
                />
              )}

              {activeTab === 'ROLES' && (
                <RoleManagementTab />
              )}

              {activeTab === 'AUDIT_LOGS' && (
                <div className="py-32 text-center text-gray-300">
                  <i className="fa-solid fa-receipt text-5xl mb-4 opacity-20"></i>
                  <p className="text-sm font-black italic opacity-40">활동 이력 시스템 준비 중...</p>
                </div>
              )}
            </div>

            {/* Employee Detail Slide Panel */}
            <EmployeeDetailPanel 
              employee={editingEmployee}
              isOpen={isDetailOpen}
              onClose={() => setIsDetailOpen(false)}
              onSave={handleSave}
              isSaving={isSaving}
              locations={locations}
            />
        </div>
    );
};

export default HRTab;
