export default function Input({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label>{label}</label>

      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ marginLeft: 10 }}
      />
    </div>
  );
}