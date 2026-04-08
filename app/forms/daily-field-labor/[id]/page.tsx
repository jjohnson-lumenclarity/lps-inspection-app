'use client';

import { useParams } from 'next/navigation';
import { DailyFieldLaborReportEditor } from '@/components/forms/DailyFieldLaborReportEditor';

export default function DailyFieldLaborReportDetailPage() {
  const params = useParams<{ id: string }>();
  return <DailyFieldLaborReportEditor reportId={params.id} />;
}
