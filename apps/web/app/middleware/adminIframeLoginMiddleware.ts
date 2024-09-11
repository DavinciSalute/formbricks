import { getToken } from "next-auth/jwt";
import { getLogger } from "next-logger.config";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { stringify } from "qs";
import { WEBAPP_URL } from "@formbricks/lib/constants";

const baseLogger = getLogger({
  middleware: "adminIframeMiddleware",
});

function parseSetCookieHeader(setCookieHeader: string): ResponseCookie[] {
  // Lista dei possibili cookie presenti nella stringa
  const cookieAttributes = ["Path", "Expires", "Max-Age", "Domain", "Secure", "HttpOnly", "SameSite"];

  // Funzione per dividere la stringa unica dei cookies, in un'array di stringhe (1 per ogni cookie)
  function splitCookiesString(cookiesString): string[] {
    const arrayCookieStrings: any[] = [];
    let currentCookieString: string = "";
    let inQuotes = false;
    let inExpires = false;

    for (let i = 0; i < cookiesString.length; i++) {
      const char = cookiesString[i];

      // Gestione della virgola dentro il campo Expires
      if (cookiesString.slice(i, i + 8) === "Expires=") {
        inExpires = true;
      }

      if (inExpires && char === ",") {
        currentCookieString += char;
        continue;
      }

      // Se troviamo un punto e virgola, l'expires è finito
      if (inExpires && char === ";") {
        inExpires = false;
      }

      // Gestione delle virgolette per i valori che contengono la virgola
      if (char === '"') {
        inQuotes = !inQuotes;
      }

      // Se troviamo una virgola fuori dalle virgolette e non siamo nel campo Expires
      if (char === "," && !inQuotes && !inExpires) {
        arrayCookieStrings.push(currentCookieString.trim());
        currentCookieString = "";
      } else {
        currentCookieString += char;
      }
    }

    // Aggiungi l'ultimo cookie
    if (currentCookieString) {
      arrayCookieStrings.push(currentCookieString.trim());
    }

    return arrayCookieStrings;
  }

  function lowercaseFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }

  function parseExpiresDate(expiresString) {
    const date = new Date(expiresString);
    return isNaN(date.getTime()) ? null : date;
  }

  // Iniziamo con lo split dei singoli cookie dalla stringa
  const cookiesArray = splitCookiesString(setCookieHeader);

  const result: ResponseCookie[] = cookiesArray.map((cookieString) => {
    const parts = cookieString.split(";").map((part) => part.trim());

    // separo il cookie name=value dalle altre options
    const [nameValuePair, ...options] = parts;
    const [name, value] = nameValuePair.split("=");

    // rimappiamo le opzioni  del cookie
    const optionsObject: Omit<ResponseCookie, "name" | "value"> = {};
    options.forEach((option) => {
      const [key, val] = option.split("=");

      if (cookieAttributes.includes(key)) {
        const formattedKey = lowercaseFirstLetter(key); // Converte la prima lettera della chiave in minuscolo

        if (formattedKey === "expires") {
          const parsedDate = parseExpiresDate(val);
          if (parsedDate) {
            optionsObject[formattedKey] = parsedDate;
          }
        } else if (cookieAttributes.includes(key)) {
          optionsObject[formattedKey] = val === undefined ? true : val;
        }
      }
    });

    return {
      name: name,
      value: value,
      ...optionsObject,
    };
  });

  return result;
}

function stripUrlParameters(url: string, params: string[]) {
  const structuredUrl = new URL(url);

  const searchParams = structuredUrl.searchParams;

  params.forEach((p) => {
    if (searchParams.has(p)) {
      searchParams.delete(p);
    }
  });

  structuredUrl.search = searchParams.toString();

  return structuredUrl.toString();
}

export const adminIframeMiddleware = async (req: NextRequest) => {
  let logger = baseLogger.child({ pathname: req.nextUrl.pathname });
  // issue with next auth types & Next 15; let's review when new fixes are available
  // @ts-expect-error
  const token = await getToken({ req: req });

  if (req.nextUrl.pathname.startsWith("/admin-iframe") && !token) {
    const iframeAuthToken = req.nextUrl.searchParams.get("token");
    if (!iframeAuthToken) {
      throw new Error("Missing iframe Auth token");
    }

    const currentUrl = WEBAPP_URL + req.nextUrl.pathname + req.nextUrl.search;
    const callbackUrl =
      req.nextUrl.searchParams.get("callbackUrl") ?? stripUrlParameters(currentUrl, ["token"]);

    const [csrfSetCookiesHeaderValue, csrfAuthToken] = await fetch(
      `${process.env.NEXTAUTH_URL}/api/auth/csrf`
    )
      .then((response) => {
        return Promise.all([response.headers.getSetCookie().join("; "), response.json()]);
      })
      .then(([csrfSetCookiesHeaderValue, jsonResponse]) => {
        const csrfAuthToken = jsonResponse.csrfToken;
        if (!csrfAuthToken || typeof csrfAuthToken !== "string") {
          throw new Error("CSRF token is missing");
        }
        return [csrfSetCookiesHeaderValue, csrfAuthToken];
      })
      .catch((error) => {
        logger.error("Failed to obtain CSRF cookie and token:", error);
        throw new Error("Failed to obtain CSRF cookie and token: " + error.message);
      });

    const credentialsResponseCookieHeader = await fetch(
      `${process.env.NEXTAUTH_URL}/api/auth/callback/iframe-token`,
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: csrfSetCookiesHeaderValue,
        },
        body: stringify({
          callbackUrl: callbackUrl,
          token: iframeAuthToken,
          redirect: "false",
          csrfToken: csrfAuthToken,
          json: true,
        }),
        method: "POST",
      }
    )
      .then((response) => {
        if (response.status !== 200) throw new Error(`Received response status ${response.status}`);
        return response.json().then(() => response);
      })
      .then((response) => {
        return response.headers.getSetCookie().join(",");
      })
      .catch((error) => {
        logger.error("Failed to authenticate sign in attempt:", error);
        throw new Error("Failed to authenticate sign in attempt: " + error.message);
      });

    const credentialsResponseCookies = parseSetCookieHeader(credentialsResponseCookieHeader);
    const csrfResponseCookies = parseSetCookieHeader(csrfSetCookiesHeaderValue);

    // il cookie "next-auth.callback-url" | "__Secure-next-auth.callback-url" con la sessione attiva manda in errore. rimuovo
    let requiredCookies = [...csrfResponseCookies, ...credentialsResponseCookies].filter(
      (cookie) => !cookie.name.includes("next-auth.callback-url")
    );
    if (requiredCookies.length < 2) {
      logger.error("We have not collected enough cookies to ensure login");
      throw new Error("We have not collected enough cookies to ensure login");
    }

    // todo: scoprire perché se tento di ritornare  `const response = NextResponse.redirect(callbackUrl);` mi da problemi dentro l'iframe
    const response = NextResponse.next();
    // const response = NextResponse.redirect(callbackUrl);;

    requiredCookies.forEach(({ name, value, ...options }) => {
      response.cookies.set({
        name,
        value,
        expires: options.expires,
        path: options.path,
        httpOnly: options.httpOnly,
        sameSite: "none",
        secure: true,
      });
    });

    return response;
  }
};
