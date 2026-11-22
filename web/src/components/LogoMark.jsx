import { useState } from 'react';
import SmartImg from './SmartImg.jsx';
import { LOGO_SRC } from '../../config/brand.js';

/** Logo dari file (config/brand.js). Jika file tidak ada, tampil huruf Y. */
export default function LogoMark() {
  const [failed, setFailed] = useState(false);
  if (!LOGO_SRC || failed) return <span className="logo-fallback">Y</span>;
  return <SmartImg src={LOGO_SRC} alt="Logo AduYapping" draggable="false" onFail={() => setFailed(true)} />;
}
