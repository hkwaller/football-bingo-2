'use client'

import type { Chip } from './ChipRow'
import styles from './BrowseGallery.module.css'

export function BrowseFilterChoices<T extends string>({ label, choices, value, onChange }: {
  label: string
  choices: Chip<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className={styles.choices}>
      <legend>{label}</legend>
      <div className={styles.choiceButtons}>
        {choices.map((choice) => (
          <button key={choice.value} type="button" aria-pressed={value === choice.value}
            onClick={() => onChange(choice.value)} className={styles.choice}>
            {choice.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

