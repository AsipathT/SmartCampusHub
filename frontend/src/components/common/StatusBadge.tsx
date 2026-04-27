import React from 'react';
import { FacilityStatus } from '../../types/facility';

export const StatusBadge: React.FC<{ status: FacilityStatus }> = ({ status }) => {
  const styles = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border shadow-sm ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
