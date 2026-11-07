import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { SimulationProvider } from './simulation/SimulationProvider';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Virtual Office root element is missing');
createRoot(root).render(<StrictMode><SimulationProvider><App /></SimulationProvider></StrictMode>);
