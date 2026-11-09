import './RangeNumberField.css';

interface RangeNumberFieldProps {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  hint: string;
  error?: string;
  onChange: (value: string) => void;
}

export function RangeNumberField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  hint,
  error,
  onChange,
}: RangeNumberFieldProps) {
  const trimmed = value.trim();
  const isBlank = trimmed === '';
  const isInteger = /^\d+$/.test(trimmed);
  const parsed = isBlank || !isInteger ? null : Number(trimmed);

  const rangeError = !isBlank && !isInteger
    ? `${label}需为整数`
    : parsed !== null && (parsed < min || parsed > max)
      ? `${label}需在 ${min}–${max} 之间`
      : undefined;

  const message = error ?? rangeError ?? hint;
  const isInvalid = Boolean(error || rangeError);
  const sliderValue = parsed === null ? min : Math.min(Math.max(parsed, min), max);
  const sliderValueText = isBlank
    ? '待设置'
    : `${parsed ?? trimmed}${suffix}`;

  return (
    <div className={`range-field ${isBlank ? 'is-pending' : ''}`}>
      <div className="range-field__head">
        <label htmlFor={id}>{label}</label>
        <div className="range-field__number">
          <input
            id={id}
            className={`range-field__input ${isInvalid ? 'is-invalid' : ''}`}
            type="number"
            min={min}
            max={max}
            step={step}
            inputMode="numeric"
            autoComplete="off"
            placeholder="待设置"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={isInvalid}
            aria-describedby={`${id}-message`}
          />
          <span className="range-field__suffix" aria-hidden="true">
            {suffix}
          </span>
        </div>
      </div>

      <input
        className="range-field__slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        aria-label={`${label}滑块`}
        aria-valuetext={sliderValueText}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className="range-field__scale" aria-hidden="true">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </div>

      <p
        id={`${id}-message`}
        className={`range-field__message ${isInvalid ? 'is-error' : ''}`}
      >
        {message}
      </p>
    </div>
  );
}
