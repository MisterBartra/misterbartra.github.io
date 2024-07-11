import { createRoot } from 'react-dom/client';
import { FastWebTools } from './fast-web-tools';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<FastWebTools />, container);
