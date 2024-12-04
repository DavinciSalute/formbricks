import { translations } from "@/lib/translate";
import { IntlProvider } from "preact-i18n";
import { SurveyInlineProps } from "@formbricks/types/formbricksSurveys";
import { Survey } from "./Survey";

export const SurveyInline = (props: SurveyInlineProps) => {
  const lang = (
    props.languageCode in translations ? props.languageCode : "default"
  ) as keyof typeof translations;

  return (
    <IntlProvider definition={translations[lang]}>
      <div id="fbjs" className="formbricks-form h-full w-full">
        <Survey {...props} />
      </div>
    </IntlProvider>
  );
};
