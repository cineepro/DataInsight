// apps/collect/src/components/ui/ContactFields.tsx
interface ContactFieldsProps {
  phone: string;
  name: string;
  onPhoneChange: (value: string) => void;
  onNameChange: (value: string) => void;
}

export default function ContactFields({ phone, name, onPhoneChange, onNameChange }: ContactFieldsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-neutral-300 p-3">
      <p className="text-xs text-neutral-500">
        Facultatif — laissez votre nom et numéro pour qu'on vous reconnaisse lors de vos prochaines visites.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Votre nom (facultatif)"
        className="rounded-lg border border-neutral-200 p-3 text-sm focus:border-brand-500 focus:outline-none"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        placeholder="Votre numéro (facultatif)"
        className="rounded-lg border border-neutral-200 p-3 text-sm focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}