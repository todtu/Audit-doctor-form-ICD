import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { AuditRecord } from '../types';
import { format, parseISO, isWithinInterval } from 'date-fns';

interface DashboardProps {
  records: AuditRecord[];
  filters: {
    startDate: string;
    endDate: string;
    department: string;
  };
}

export default function Dashboard({ records, filters }: DashboardProps) {
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const date = parseISO(r.dcDate);
      const start = filters.startDate ? parseISO(filters.startDate) : new Date(0);
      const end = filters.endDate ? parseISO(filters.endDate) : new Date();
      
      const inDateRange = isWithinInterval(date, { start, end });
      const inDept = filters.department === 'All' || r.department === filters.department;
      
      return inDateRange && inDept;
    });
  }, [records, filters]);

  const chartData = useMemo(() => {
    // Group by department for bar chart
    const deptStats: Record<string, { name: string; before: number; after: number }> = {};
    
    filteredRecords.forEach(r => {
      if (!deptStats[r.department]) {
        deptStats[r.department] = { name: r.department, before: 0, after: 0 };
      }
      deptStats[r.department].before += r.sumAdjRwBefore;
      deptStats[r.department].after += r.sumAdjRwAfter;
    });

    return Object.values(deptStats);
  }, [filteredRecords]);

  const totalBefore = filteredRecords.reduce((sum, r) => sum + r.sumAdjRwBefore, 0);
  const totalAfter = filteredRecords.reduce((sum, r) => sum + r.sumAdjRwAfter, 0);
  const totalDiff = totalAfter - totalBefore;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 bg-orange-50 border-orange-100">
          <h3 className="text-sm font-medium text-orange-800 opacity-70">Total SumAdjRW Before</h3>
          <p className="text-3xl font-bold text-orange-900">{totalBefore.toFixed(4)}</p>
        </div>
        <div className="card p-6 bg-orange-100 border-orange-200">
          <h3 className="text-sm font-medium text-orange-800 opacity-70">Total SumAdjRW After</h3>
          <p className="text-3xl font-bold text-orange-900">{totalAfter.toFixed(4)}</p>
        </div>
        <div className={`card p-6 ${totalDiff >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <h3 className="text-sm font-medium opacity-70">Total Difference</h3>
          <p className={`text-3xl font-bold ${totalDiff >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {totalDiff >= 0 ? '+' : ''}{totalDiff.toFixed(4)}
          </p>
        </div>
      </div>

      <div className="card p-6 h-[400px]">
        <h3 className="text-lg font-bold mb-4">SumAdjRW Comparison by Department</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" fontSize={12} tick={{ fill: '#78350f' }} />
            <YAxis fontSize={12} tick={{ fill: '#78350f' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend />
            <Bar dataKey="before" name="Before Audit" fill="#fed7aa" radius={[4, 4, 0, 0]} />
            <Bar dataKey="after" name="After Audit" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-pastel-orange-light">
            <tr>
              <th className="p-4 text-sm font-bold">AN</th>
              <th className="p-4 text-sm font-bold">D/C Date</th>
              <th className="p-4 text-sm font-bold">Dept</th>
              <th className="p-4 text-sm font-bold">Before</th>
              <th className="p-4 text-sm font-bold">After</th>
              <th className="p-4 text-sm font-bold">Diff</th>
              <th className="p-4 text-sm font-bold">Auditor</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r) => (
              <tr key={r.id} className="border-t border-pastel-brown hover:bg-pastel-brown-light transition-colors">
                <td className="p-4 text-sm">{r.an}</td>
                <td className="p-4 text-sm">{format(parseISO(r.dcDate), 'dd/MM/yyyy')}</td>
                <td className="p-4 text-sm">{r.department}</td>
                <td className="p-4 text-sm">{r.sumAdjRwBefore.toFixed(4)}</td>
                <td className="p-4 text-sm">{r.sumAdjRwAfter.toFixed(4)}</td>
                <td className={`p-4 text-sm font-bold ${r.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {r.difference.toFixed(4)}
                </td>
                <td className="p-4 text-sm">{r.auditor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
