import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

interface OverviewPageProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
}

export const AdminOverviewPage = ({ selectedPeriod, setSelectedPeriod }: OverviewPageProps) => {
  return (
    <AdminDashboard selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
  );
};
