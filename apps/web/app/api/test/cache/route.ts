import { responses } from "@/app/lib/api/response";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cache, revalidateTag } from "@formbricks/lib/cache";

const CACHE_TAG = "test-cache-value";
const CACHE_KEY = "test-cache-value";

// Funzione cached che genera un valore random
const getCachedValue = cache(
  async () => {
    // Genera un nuovo codice random ogni volta che la cache viene invalidata
    const randomCode = randomBytes(16).toString("hex");
    const timestamp = new Date().toISOString();

    return {
      code: randomCode,
      timestamp,
    };
  },
  [CACHE_KEY],
  {
    tags: [CACHE_TAG],
    revalidate: 3600, // TTL di 1 ora
  }
);

// POST: invalida la cache e fa redirect a se stesso con flag
export const POST = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const invalidated = searchParams.get("invalidated");

    // Se il flag invalidated non è presente, invalida la cache e fa redirect
    if (!invalidated) {
      // Invalida il tag per forzare la rigenerazione del valore
      revalidateTag(CACHE_TAG);

      // Costruisce l'URL originale usando gli header del proxy
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProto = request.headers.get("x-forwarded-proto");
      const host = forwardedHost || request.headers.get("host") || "localhost";
      const proto = forwardedProto || (request.url.startsWith("https") ? "https" : "http");

      // Costruisce l'URL completo preservando il path originale
      const originalUrl = new URL(request.url);
      const redirectUrl = new URL(`${proto}://${host}${originalUrl.pathname}`);
      // Copia i parametri di query esistenti
      originalUrl.searchParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value);
      });
      // Aggiunge il flag invalidated
      redirectUrl.searchParams.set("invalidated", "true");

      return NextResponse.redirect(redirectUrl, { status: 307 });
    }

    // Se il flag è presente, genera e restituisce il nuovo valore dalla cache
    // Ora che la cache è stata invalidata, questo genererà un nuovo valore
    const value = await getCachedValue();

    return responses.successResponse(
      {
        code: value.code,
        timestamp: value.timestamp,
        invalidated: true,
        message: "Codice generato e salvato in cache dopo invalidazione",
      },
      false
    );
  } catch (error) {
    console.error("Errore nel invalidare la cache:", error);
    return responses.internalServerErrorResponse(
      error instanceof Error ? error.message : "Errore sconosciuto"
    );
  }
};

// GET: legge il valore dalla cache
export const GET = async () => {
  try {
    // Chiama la funzione cached che restituirà il valore cachato
    // Se il tag è stato invalidato dal POST precedente, genererà un nuovo valore
    // che sarà lo stesso per tutti i pod grazie alla cache condivisa (Redis se configurato)
    const value = await getCachedValue();

    return responses.successResponse(
      {
        code: value.code,
        timestamp: value.timestamp,
        message: "Valore recuperato dalla cache",
      },
      false
    );
  } catch (error) {
    console.error("Errore nel leggere dalla cache:", error);
    return responses.internalServerErrorResponse(
      error instanceof Error ? error.message : "Errore sconosciuto"
    );
  }
};
