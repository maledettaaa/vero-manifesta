import { useState } from 'react'
import './App.css'
import Experience from './Experience/Experience'
import IntroOverlay from './components/IntroOverlay'

function App() {
  return (
    <>
      <IntroOverlay />
      <Experience />
    </>
  )
}

export default App
