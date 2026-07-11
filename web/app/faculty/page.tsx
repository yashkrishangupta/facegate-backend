'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Faculty management moved into the Master Data page as a tab, alongside
// Departments/Programs/Batches/Subjects/Calendar — this route stays as a
// redirect so old bookmarks/links don't 404.
export default function FacultyRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/master-data') }, [])
  return null
}
