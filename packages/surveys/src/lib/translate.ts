import { translate } from "preact-i18n";

const translationsEN = {
  question_input: {
    error_file_count_limit: "Only one file can be uploaded at a time.",
    error_file_required: "Upload a file to proceed.",
    error_file_size_exceeded: "File should be less than {{value}} MB",
    error_file_size_exceeds_plan_limit: "File size exceeds the size limit for your plan",
    error_generic: "Upload failed! Please try again.",
    error_invalid_files: "No selected files are valid",
    error_too_many_files: "You can only upload a maximum of {{FILE_LIMIT}} files.",
    input_placeholder: "Click or drag to upload files.",
  },

  test: "Ciao {{nome}}",
};

export const translations = {
  default: translationsEN,
  en: translationsEN,
  it: {
    question_input: {
      error_file_count_limit: "È possibile caricare un solo file alla volta.",
      error_file_required: "Selezionare un file per proseguire.",
      error_file_size_exceeded: "Il file non deve essere più grande di {{value}} MB",
      error_file_size_exceeds_plan_limit: "La dimensione del file supera il limite per il tuo piano",
      error_generic: "Upload non riuscito! Riprova.",
      error_invalid_files: "Nessun file selezionato è valido",
      error_too_many_files: "Puoi caricare solo un massimo di {{value}} file.",
      input_placeholder: "Clicca qui per selezionare il file da caricare.",
    },
  },
};

export const t = (key: string, lang = "en", fields?: Record<string, any>) => {
  return translate(key, "", translations[lang as keyof typeof translations], fields);
};
