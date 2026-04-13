import { Suspense } from 'react';
import { DailyFieldLaborListClient } from '@/components/forms/DailyFieldLaborListClient';

export default async function DailyFieldLaborListPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  return (
    <Suspense>
      <DailyFieldLaborListClient initialStatus={params.status || 'all'} />
    </Suspense>
  );
}
