import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'

interface DailyData {
  name: string
  minutes: number
}

interface WeeklyChartProps {
  refreshKey?: number
}

export default function WeeklyChart({ refreshKey = 0 }: WeeklyChartProps): React.JSX.Element {
  const [data, setData] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const result = await window.electron.ipcRenderer.invoke('timer:getWeeklyHistory', 'user-1')
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey]) // Re-fetch when refreshKey changes

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Loading history...
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Weekly Focus Activity</h3>
        <div className="text-sm text-muted-foreground">Last 7 Days</div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={10}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number | undefined) => [`${value ?? 0} min`, 'Focus Time']}
            />
            <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.minutes > 0 ? '#6366f1' : 'rgba(255,255,255,0.1)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
