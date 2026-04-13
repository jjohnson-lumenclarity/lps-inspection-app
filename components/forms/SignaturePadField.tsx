'use client';

import { useEffect, useRef, useState } from 'react';

type SignaturePadFieldProps = {
  label: string;
  value: string;
  signedAt: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  onChange: (payload: { value: string; signedAt: string }) => void;
};

export function SignaturePadField({
  label,
  value,
  signedAt,
  required = false,
  disabled = false,
  helperText,
  error,
  onChange,
}: SignaturePadFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const hasHydratedInitial = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value || hasHydratedInitial.current) return;

    const img = new Image();
    img.onload = () => {
      const context = canvas.getContext('2d');
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      hasHydratedInitial.current = true;
    };
    img.src = value;
  }, [value]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);

    context.beginPath();
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0f172a';
    context.moveTo(point.x, point.y);

    setIsDrawing(true);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    event.preventDefault();
    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const finishDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDrawing) {
      event.preventDefault();
      setIsDrawing(false);
      onChange({
        value: canvas.toDataURL('image/png'),
        signedAt: new Date().toISOString(),
      });
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange({ value: '', signedAt: '' });
  };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, background: disabled ? '#f8fafc' : '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600, color: '#0f172a' }}>
          {label} {required ? <span style={{ color: '#dc2626' }}>*</span> : null}
        </label>
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled}
          style={{ borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', padding: '8px 12px', cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          Clear signature
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={540}
        height={180}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={finishDrawing}
        onPointerLeave={finishDrawing}
        style={{
          width: '100%',
          height: 180,
          borderRadius: 12,
          border: error ? '1px solid #dc2626' : '1px dashed #94a3b8',
          background: disabled ? '#f1f5f9' : '#fff',
          touchAction: 'none',
        }}
      />
      <p style={{ margin: '8px 0 0', fontSize: 12, color: error ? '#dc2626' : '#64748b' }}>
        {error || helperText || 'Sign using finger, stylus, or mouse.'}
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
        {signedAt ? `Signed on ${new Date(signedAt).toLocaleString()}` : 'No signature captured yet'}
      </p>
    </div>
  );
}
