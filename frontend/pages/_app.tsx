import type { AppProps } from 'next/app'
import '../styles/globals.css'
import Footer from '../src/components/Footer'
import dynamic from 'next/dynamic'
import SystemStatusBanner from '../src/components/SystemStatusBanner'
import { useEffect, useState } from 'react'
import { applyTheme, getRuntimeSettings } from '../src/utils/runtimeConfig'

// Avoid SSR issues for widgets that access window/localStorage
const ChatWidget = dynamic(() => import('../src/components/chat/ChatWidget'), { ssr: false })

export default function App({ Component, pageProps }: AppProps) {
  const [chatEnabled, setChatEnabled] = useState<boolean>(process.env.NEXT_PUBLIC_ENABLE_GLOBAL_CHAT !== 'false')

  useEffect(() => {
    // Theme locked to light
    applyTheme('light')
    try {
      const s = getRuntimeSettings()
      if (typeof s.enableGlobalChat === 'boolean') setChatEnabled(!!s.enableGlobalChat)
      if (s.language) document.documentElement.lang = s.language
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return
      if (e.key === 'runtime_settings' || e.key === 'runtime_settings:ts') {
        applyTheme('light')
        const s = getRuntimeSettings()
        if (typeof s.enableGlobalChat === 'boolean') setChatEnabled(!!s.enableGlobalChat)
        if (s.language) document.documentElement.lang = s.language
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  return (
    <div className="min-h-screen flex flex-col">
      <SystemStatusBanner />
      <div className="flex-grow">
        <Component {...pageProps} />
      </div>
      <Footer />
      {chatEnabled && (
        <ChatWidget title="학사 도우미 봇" />
      )}
    </div>
  )
} 
