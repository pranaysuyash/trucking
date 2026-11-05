import { ShipmentWorkspace } from './suite/ShipmentWorkspace';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShipmentWorkspace productId="product-04-asset-studio"><App /></ShipmentWorkspace>
  </StrictMode>,
);
