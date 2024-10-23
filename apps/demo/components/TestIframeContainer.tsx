import React, { useState } from "react";
import TestIframeComponent from "./TestIframeComponent";

const TestIframeContainer: React.FC = () => {
  const [url, setUrl] = useState<string>("http://localhost:3000/s/cm03xyp2k000o1i2eqgucnf1s");
  const [responseId, setResponseId] = useState<string>();

  const iframeurl = React.useMemo(() => {
    let iframeUrl = url;
    if (responseId) {
      iframeUrl += `?responseId=${responseId}`;
    }
    return iframeUrl;
  }, [responseId, url]);

  const handleInputUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  const handleInputResponseIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResponseId(e.target.value);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Inserisci un URL per caricare l'iframe
      </h1>
      <div className="my-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <input
          type="text"
          value={url}
          onChange={handleInputUrlChange}
          placeholder="Inserisci un URL"
          style={{ width: "100%", padding: "8px", marginBottom: "16px" }}
        />
        <input
          type="text"
          value={responseId}
          onChange={handleInputResponseIdChange}
          placeholder="ResponseId"
          style={{ width: "100%", padding: "8px", marginBottom: "16px" }}
        />
      </div>
      <p>iframeurl:{iframeurl}</p>
      {iframeurl && <TestIframeComponent url={iframeurl} />}
    </div>
  );
};

export default TestIframeContainer;
