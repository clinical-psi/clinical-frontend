import React, { useEffect, useState } from "react";
import { TextInput, Select, Group, Input } from "@mantine/core";
import { IconPhone } from "@tabler/icons-react";
import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";

interface PhoneInputProps {
  value?: string;
  className?: string;
  onChange?: (fullPhoneNumber: string, isValid: boolean) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

const COUNTRY_CODES: { value: string; label: string; country: CountryCode }[] =
  [
    { value: "+51", label: "🇵🇪 +51", country: "PE" },
    { value: "+52", label: "🇲🇽 +52", country: "MX" },
    { value: "+1", label: "🇺🇸 +1", country: "US" }, // <- Estados Unidos ('US')
    { value: "+57", label: "🇨🇴 +57", country: "CO" },
    { value: "+54", label: "🇦🇷 +54", country: "AR" },
    { value: "+34", label: "🇪🇸 +34", country: "ES" },
  ];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  onChange,
  label,
  error: externalError,
  required,
  className,
  value,
}) => {
  const [countryCode, setCountryCode] = useState<string>("+51");
  const [countryIso, setCountryIso] = useState<CountryCode>("PE");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);

  useEffect(() => {
    if (!value) {
      setPhoneNumber("");
      return;
    }

    const matchedCountry = COUNTRY_CODES.find((c) => value.startsWith(c.value));

    if (matchedCountry) {
      const digitsOnly = value
        .slice(matchedCountry.value.length)
        .replace(/\D/g, "");
      setCountryCode(matchedCountry.value);
      setCountryIso(matchedCountry.country);
      setPhoneNumber(digitsOnly);

      // Notificamos al padre la validez inicial del valor cargado
      const valid = isValidPhoneNumber(value, matchedCountry.country);
      if (onChange) {
        onChange(value, valid);
      }
    } else {
      const digitsOnly = value.replace(/\D/g, "");
      setPhoneNumber(digitsOnly);

      // Usamos el código de país actual (por defecto PE o el que esté seleccionado)
      const fullCombined = `${countryCode}${digitsOnly}`;
      const valid = isValidPhoneNumber(fullCombined, countryIso);

      setPhoneNumber(digitsOnly);
      if (onChange) {
        onChange(fullCombined, valid); // Notificamos al padre con el formato completo y su validez real
      }
    }
  }, [value]);

  const fullNumber = `${countryCode}${phoneNumber}`;
  const isValid = isValidPhoneNumber(fullNumber, countryIso);

  const isInternalError = touched && phoneNumber.length > 0 && !isValid;
  const currentError =
    externalError ||
    (isInternalError ? "Número de teléfono inválido" : undefined);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    setPhoneNumber(numericValue);
    setTouched(true);

    const combined = `${countryCode}${numericValue}`;
    const validState = isValidPhoneNumber(combined, countryIso);

    if (onChange) {
      onChange(combined, validState);
    }
  };

  const handleCountryChange = (newCode: string | null) => {
    if (!newCode) return;
    setCountryCode(newCode);

    // Buscamos el código ISO correspondiente al prefijo seleccionado
    const foundCountry = COUNTRY_CODES.find((c) => c.value === newCode);
    const newIso = foundCountry ? foundCountry.country : "PE";
    setCountryIso(newIso);

    const combined = `${newCode}${phoneNumber}`;
    const validState = isValidPhoneNumber(combined, newIso);

    if (onChange) {
      onChange(combined, validState);
    }
  };

  return (
    <Input.Wrapper
      label={label}
      error={currentError}
      required={required}
      className={className}
    >
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
          onBlur={() => setTouched(true)}
          leftSection={<IconPhone size={16} stroke={1.5} />}
          style={{ flex: 1 }}
          maxLength={15}
          error={!!currentError} // Marca el input en rojo si hay error
        />
      </Group>
    </Input.Wrapper>
  );
};
