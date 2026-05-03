export default function Slider({ label, value, min, max, step, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label>{label}</label>

      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ marginLeft: 10 }}
      />

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}