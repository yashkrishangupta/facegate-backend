'use client'
import { useEffect, useState } from 'react'
import client from '../api/client'

interface Device {
  deviceId: string; deviceName: string; room?: string
  status: string; batteryLevel?: number; lastSync?: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ deviceId: '', deviceName: '', roomId: '', appVersion: '1.0.0', osVersion: 'Android 14' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchDevices = async () => {
    setLoading(true)
    try {
      const res = await client.get('/api/v1/devices')
      setDevices(res.data.devices || res.data.data || [])
    } catch { setDevices([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchDevices() }, [])

  const handleCreate = async () => {
    setError(''); setSubmitting(true)
    try {
      await client.post('/api/v1/devices', form)
      setShowModal(false)
      setForm({ deviceId: '', deviceName: '', roomId: '', appVersion: '1.0.0', osVersion: 'Android 14' })
      fetchDevices()
    } catch (e: any) { setError(e.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this device?')) return
    await client.delete(`/api/v1/devices/${id}`).catch(() => {})
    fetchDevices()
  }

  return (
    <main className="min-h-screen bg-[#0D1727] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/" className="text-[#5DA9FF] text-sm font-bold">← Back</a>
          <h1 className="text-2xl font-bold">Devices</h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <p className="text-[#90A6BD]">Monitor all registered Android devices</p>
          <button onClick={() => setShowModal(true)} className="bg-[#4ADE80] text-black font-bold px-6 py-3 rounded-xl hover:opacity-90">+ Register Device</button>
        </div>
        {loading ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center text-[#90A6BD]">Loading...</div>
        ) : devices.length === 0 ? (
          <div className="bg-[#1A2436] rounded-2xl border border-[#2F4E73] p-12 text-center">
            <p className="text-4xl mb-4">📱</p>
            <p className="text-[#90A6BD] font-bold">No devices registered yet</p>
            <p className="text-[#4A6080] text-sm mt-1">Register an Android device to start syncing attendance</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((d) => (
              <div key={d.deviceId} className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-bold">{d.deviceName}</p>
                    <p className="text-[#90A6BD] text-sm font-mono">{d.deviceId}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${d.status === 'ONLINE' ? 'bg-[#14532D] text-[#4ADE80]' : 'bg-[#2A1A1A] text-[#F87171]'}`}>{d.status}</span>
                </div>
                <div className="text-sm text-[#90A6BD] space-y-1">
                  <p>Room: <span className="text-white">{d.room || '—'}</span></p>
                  {d.batteryLevel !== undefined && <p>Battery: <span className="text-white">{d.batteryLevel}%</span></p>}
                  {d.lastSync && <p>Last sync: <span className="text-white">{new Date(d.lastSync).toLocaleString()}</span></p>}
                </div>
                <button onClick={() => handleDeactivate(d.deviceId)} className="mt-4 text-[#F87171] text-sm hover:text-white transition-colors">Deactivate</button>
              </div>
            ))}
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#1A2436] border border-[#2F4E73] rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-white font-bold text-lg mb-4">Register Device</h2>
              {error && <p className="text-[#F87171] text-sm mb-3">{error}</p>}
              <div className="flex flex-col gap-3">
                {(['deviceId','deviceName','roomId','appVersion','osVersion'] as const).map((f) => (
                  <input key={f} placeholder={f.replace(/([A-Z])/g,' $1').trim()} value={form[f]}
                    onChange={(e) => setForm(p => ({...p,[f]:e.target.value}))}
                    className="bg-[#0D1727] border border-[#2F4E73] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#5DA9FF]" />
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => {setShowModal(false);setError('')}} className="flex-1 border border-[#2F4E73] text-[#90A6BD] rounded-lg py-2 text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={submitting} className="flex-1 bg-[#4ADE80] text-black font-semibold rounded-lg py-2 text-sm disabled:opacity-50">{submitting?'Registering...':'Register'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
