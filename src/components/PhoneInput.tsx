import React, { useState } from "react";
import { TextInput, Select, Group, Input } from "@mantine/core";
import { IconPhone } from "@tabler/icons-react";

interface PhoneInputProps {
  value?: string;
  onChange?: (fullPhoneNumber: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

// Lista común de códigos de país (puedes ampliarla según tus necesidades)
const COUNTRY_CODES = [
  { value: "+51", label: "🇵🇪 +51" },
  { value: "+52", label: "🇲🇽 +52" },
  { value: "+1", label: "🇺🇸 +1" },
  { value: "+57", label: "🇨🇴 +57" },
  { value: "+54", label: "🇦🇷 +54" },
  { value: "+34", label: "🇪🇸 +34" },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value = "",
  onChange,
  label,
  error,
  required,
}) => {
  // Separamos internamente el código de país y el número si ya vienen unidos
  // O inicializamos con valores por defecto (ej: +51 para Perú)
  const [countryCode, setCountryCode] = useState<string>(
    value?.slice(0, 3) || "+51",
  );
  const [phoneNumber, setPhoneNumber] = useState<string>(value?.slice(3) || "");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    setPhoneNumber(numericValue);
    if (onChange) {
      onChange(`${countryCode}${numericValue}`);
    }
  };

  const handleCountryChange = (newCode: string | null) => {
    if (!newCode) return;
    setCountryCode(newCode);
    if (onChange) {
      onChange(`${newCode}${phoneNumber}`);
    }
  };

  return (
    <Input.Wrapper label={label} error={error} required={required}>
      <Group gap={8} wrap="nowrap" mt={4}>
        {/* Selector de Código de País */}
        <Select
          data={COUNTRY_CODES}
          value={countryCode}
          onChange={handleCountryChange}
          allowDeselect={false}
          searchable
          style={{ width: "130px" }}
          styles={{
            input: {
              fontWeight: 500,
            },
          }}
        />

        {/* Input para el número de teléfono */}
        <TextInput
          placeholder="987654321"
          value={phoneNumber}
          onChange={handlePhoneChange}
          leftSection={<IconPhone size={16} stroke={1.5} />}
          style={{ flex: 1 }}
          maxLength={15}
        />
      </Group>
    </Input.Wrapper>
  );
};
