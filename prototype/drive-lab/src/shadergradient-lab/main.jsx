import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ShaderGradientLab } from './workbench.jsx'
import './standalone.css'

const rootElement = document.getElementById('shadergradient-lab-root')
const root = window.__sedicivalvoleShaderGradientRoot ?? createRoot(rootElement)
window.__sedicivalvoleShaderGradientRoot = root
root.render(
  <StrictMode>
    <ShaderGradientLab />
  </StrictMode>,
)
