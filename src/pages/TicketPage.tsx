import { useState } from 'react';
import CreateTicket from '@/components/ticket/CreateTicket';
import TicketList from '@/components/ticket/TicketList';

const TicketPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTicketCreated = () => {
    // Trigger refresh of ticket list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 mt-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Trung tâm hỗ trợ</h1>
            <p className="text-gray-600">Quản lý các yêu cầu hỗ trợ và theo dõi trạng thái xử lý.</p>
          </div>
          <CreateTicket onSuccess={handleTicketCreated} />
        </div>

        <TicketList refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default TicketPage;

