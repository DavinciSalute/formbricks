import { Modal } from "@/components/wrappers/Modal";
import { translations } from "@/lib/translate";
import { IntlProvider } from "preact-i18n";
import { useState } from "preact/hooks";
import { SurveyModalProps } from "@formbricks/types/formbricksSurveys";
import { Survey } from "./Survey";

export const SurveyModal = ({
  survey,
  isBrandingEnabled,
  getSetIsError,
  placement,
  clickOutside,
  darkOverlay,
  onDisplay,
  getSetIsResponseSendingFinished,
  onResponse,
  onClose,
  onFinished = () => {},
  onFileUpload,
  onRetry,
  isRedirectDisabled = false,
  languageCode,
  responseCount,
  styling,
}: SurveyModalProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 1000); // wait for animation to finish}
  };

  const highlightBorderColor = styling?.highlightBorderColor?.light || null;

  const lang = (languageCode in translations ? languageCode : "default") as keyof typeof translations;

  return (
    <IntlProvider definition={translations[lang]}>
      <div id="fbjs" className="formbricks-form">
        <Modal
          placement={placement}
          clickOutside={clickOutside}
          darkOverlay={darkOverlay}
          highlightBorderColor={highlightBorderColor}
          isOpen={isOpen}
          onClose={close}>
          <Survey
            survey={survey}
            isBrandingEnabled={isBrandingEnabled}
            onDisplay={onDisplay}
            getSetIsResponseSendingFinished={getSetIsResponseSendingFinished}
            onResponse={onResponse}
            languageCode={languageCode}
            onClose={close}
            onFinished={() => {
              onFinished();
              setTimeout(() => {
                if (!survey.redirectUrl) {
                  close();
                }
              }, 3000); // close modal automatically after 3 seconds
            }}
            onRetry={onRetry}
            getSetIsError={getSetIsError}
            onFileUpload={onFileUpload}
            isRedirectDisabled={isRedirectDisabled}
            responseCount={responseCount}
            styling={styling}
            isCardBorderVisible={!highlightBorderColor}
            clickOutside={placement === "center" ? clickOutside : undefined}
          />
        </Modal>
      </div>
    </IntlProvider>
  );
};
