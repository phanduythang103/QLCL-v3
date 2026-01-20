import React from 'react';
import { BarChart2, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

const ChartBar = ({ label, value, max, color, target }: { label: string, value: number, max: number, color: string, target?: number }) => (
    <div className="mb-4 group">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-700 font-medium group-hover:text-primary-700 transition-colors">{label}</span>
        <div className="flex items-center gap-2">
            {target && <span className="text-xs text-slate-400">Mục tiêu: {target}%</span>}
            <span className={`font-bold ${
                target && value < target ? 'text-red-600' : 'text-slate-900'
            }`}>{value}%</span>
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 rounded-full ${color} transition-all duration-500 ease-out`} style={{ width: `${(value/max)*100}%` }}></div>
      </div>
    </div>
);

export const IndicatorsModule: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bộ chỉ số Chất lượng Bệnh viện</h2>
          <p className="text-sm text-slate-500">Giám sát các chỉ số lâm sàng, cận lâm sàng và quản lý.</p>
        </div>
        <div className="flex gap-2">
            <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-primary-500 focus:border-primary-500">
                <option>Tháng 6/2024</option>
                <option>Tháng 5/2024</option>
                <option>Quý 1/2024</option>
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center">
                 <BarChart2 className="w-5 h-5 mr-2 text-indigo-600" />
                 Chỉ số Chuyên môn & An toàn
              </h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Đạt 8/10 chỉ số</span>
           </div>
           
           <ChartBar label="Tỷ lệ tai biến phẫu thuật" value={0.5} max={5} target={1} color="bg-green-500" />
           <ChartBar label="Tỷ lệ nhiễm khuẩn bệnh viện" value={2.1} max={5} target={2.5} color="bg-primary-500" />
           <ChartBar label="Tuân thủ quy trình kỹ thuật" value={95} max={100} target={98} color="bg-indigo-500" />
           <ChartBar label="Tỷ lệ sử dụng kháng sinh dự phòng" value={88} max={100} target={90} color="bg-purple-500" />
           <ChartBar label="Tỷ lệ tiêm an toàn" value={99.5} max={100} target={100} color="bg-teal-500" />
           <ChartBar label="Tỷ lệ sự cố y khoa được báo cáo" value={45} max={100} color="bg-orange-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center">
                 <TrendingUp className="w-5 h-5 mr-2 text-pink-600" />
                 Chỉ số Hài lòng & Quản lý
              </h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Xu hướng tăng</span>
           </div>
           
           <ChartBar label="Hài lòng người bệnh Nội trú" value={92.5} max={100} target={90} color="bg-pink-500" />
           <ChartBar label="Hài lòng người bệnh Ngoại trú" value={88.2} max={100} target={90} color="bg-rose-500" />
           <ChartBar label="Hài lòng nhân viên y tế" value={85.0} max={100} target={85} color="bg-orange-500" />
           <ChartBar label="Thời gian chờ khám trung bình (phút)" value={35} max={60} target={30} color="bg-cyan-500" />
           <ChartBar label="Công suất sử dụng giường bệnh" value={98} max={100} target={95} color="bg-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
               <h4 className="font-bold text-red-800 text-sm">Cảnh báo chỉ số</h4>
               <p className="text-xs text-red-600 mt-1">Tỷ lệ tuân thủ quy trình KT tại Khoa Ngoại thấp hơn mục tiêu (95% vs 98%).</p>
            </div>
         </div>
         <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 flex items-start gap-3 lg:col-span-3">
             <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
             <div>
                <h4 className="font-bold text-primary-800 text-sm">Phân tích đề xuất</h4>
                <p className="text-xs text-primary-600 mt-1">Cần tăng cường giám sát tuân thủ vệ sinh tay tại các khoa hệ Nội do tỷ lệ nhiễm khuẩn có xu hướng tăng nhẹ so với tháng trước.</p>
             </div>
         </div>
      </div>
    </div>
  );
};