import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import ChatStream from './components/ChatStream'
import VoiceInput from './components/VoiceTranscribing'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ChatStream />
    </>
  )
}

export default App
