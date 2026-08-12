import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import type { Report } from '../types'

const FEED_SIZE = 50

interface UseReportFeedResult {
  reports: Report[]
  loading: boolean
  error: string | null
  live: boolean
}

export function useReportFeed(): UseReportFeedResult {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(FEED_SIZE)

      if (cancelled) return
      if (fetchError) {
        console.error('useReportFeed initial load error:', fetchError)
        setError('Failed to load report feed.')
      } else {
        setReports((data ?? []) as Report[])
      }
      setLoading(false)
    }

    loadInitial()

    const channel = supabase
      .channel('reports-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          const newReport = payload.new as Report
          setReports((prev) => {
            if (prev.some((r) => r.id === newReport.id)) return prev
            return [newReport, ...prev].slice(0, FEED_SIZE)
          })
        },
      )
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED')
      })

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  return { reports, loading, error, live }
}
