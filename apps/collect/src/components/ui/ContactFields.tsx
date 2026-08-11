//apps/collect/src/components/ui/ContactFields.tsx
interface ContactFieldsProps {
  phone: string;
  name: string;
  onPhoneChange: (value: string) => void;
  onNameChange: (value: string) => void;
}

export default function ContactFields({ phone, name, onPhoneChange, onNameChange }: ContactFieldsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-3">
      <p className="text-xs leading-relaxed text-neutral-500">
        Facultatif — laissez votre nom et numéro pour qu'on vous reconnaisse lors de vos prochaines visites.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Votre nom (facultatif)"
        className="rounded-xl border border-neutral-200 bg-white p-3 text-sm text-ink focus:border-marigold-500 focus:outline-none"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        placeholder="Votre numéro (facultatif)"
        className="rounded-xl border border-neutral-200 bg-white p-3 text-sm text-ink focus:border-marigold-500 focus:outline-none"
      />
    </div>
  );
}