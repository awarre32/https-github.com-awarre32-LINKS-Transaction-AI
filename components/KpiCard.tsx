import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
      {icon}
    </div>
  </div>
);

export default KpiCard;
