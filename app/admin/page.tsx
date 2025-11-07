"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BiUser } from "react-icons/bi";
import { FaPaw, FaHandsHelping } from "react-icons/fa";
import { GoHome } from "react-icons/go";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalReports: 0,
    totalHelped: 0,
    monthlyData: [] as { month: string; reports: number }[], // ✅ กำหนด type ชัดเจน
    successRate: 0,
    topAreas: [] as { area: string; count: number }[],
    newMembers: [] as { month: string; count: number }[],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();

        const formattedMonthly =
          data.monthlyData?.map((item: any) => ({
            month: item.month,
            reports: item.count,
          })) || [];

        setStats({
          totalPosts: data.totalPosts || 0,
          totalUsers: data.totalUsers || 0,
          totalReports: data.totalReports || 0,
          totalHelped: data.totalHelped || 0,
          successRate: data.successRate || 0,
          monthlyData: formattedMonthly,
          topAreas: data.topAreas || [],
          newMembers: data.newMembers || [],
        });
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      }
    };

    fetchStats();
  }, []);

  const COLORS = ["#0088FE", "#00C49F"];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* สรุปจำนวนรวม */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<BiUser className="w-6 h-6 mb-2" />}
          title="จำนวนสมาชิก"
          value={stats.totalUsers}
          color="text-blue-600"
        />
        <StatCard
          icon={<FaPaw className="w-6 h-6 mb-2" />}
          title="จำนวนการแจ้งพบสัตว์ไร้บ้าน"
          value={stats.totalReports}
          color="text-green-600"
        />
        <StatCard
          icon={<GoHome className="w-6 h-6 mb-2" />}
          title="สัตว์หาบ้าน"
          value={stats.totalPosts}
          color="text-orange-600"
        />
        <StatCard
          icon={<FaHandsHelping className="w-6 h-6 mb-2" />}
          title="สัตว์ที่ได้รับการช่วยเหลือ"
          value={stats.totalHelped}
          color="text-purple-600"
        />
      </div>

      {/* 📈 กราฟแนวโน้มรายเดือน */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          แนวโน้มการแจ้งพบสัตว์ไร้บ้าน (รายเดือน)
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={stats.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="reports"
              stroke="#007bff"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 🥧 อัตราความสำเร็จในการหาบ้าน */}
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-4">
          อัตราความสำเร็จในการหาบ้าน
        </h2>
        <PieChart width={200} height={200}>
          <Pie
            data={[
              { name: "Adopted", value: stats.successRate },
              { name: "Active", value: 100 - stats.successRate },
            ]}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            label
          >
            {COLORS.map((color, index) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
        <p className="text-2xl font-bold mt-2">
          {stats.successRate}% Success Rate
        </p>
      </div>

      {/* 🧾 พื้นที่ + สมาชิกใหม่ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">สมาชิกใหม่รายเดือน</h2>
          <ul className="space-y-2">
            {stats.newMembers?.map((item, index) => ( // ✅ ใช้ ?.map ป้องกัน undefined
              <li key={index} className="flex justify-between">
                <span>{item.month}</span>
                <span className="font-semibold">{item.count} คน</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            พื้นที่ที่มีรายงานมากที่สุด
          </h2>
          <ul className="space-y-2">
            {stats.topAreas?.map((area, index) => ( // ✅ เช่นเดียวกัน
              <li key={index} className="flex justify-between">
                <span>{area.area}</span>
                <span className="font-semibold">{area.count} รายงาน</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: any) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
