import React, { useEffect, useRef } from "react";

interface TestIframeComponentProps {
  url: string;
}

const TestIframeComponent: React.FC<TestIframeComponentProps> = ({ url }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (iframeRef.current && event.source === iframeRef.current.contentWindow) {
        console.log("Messaggio dall'iframe:", event.data);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div>
      <iframe
        ref={iframeRef}
        src={url}
        title="Embedded Iframe"
        width="100%"
        height="500px"
        style={{ border: "none" }}></iframe>
    </div>
  );
};

export default TestIframeComponent;
