/**
 * ViaCEP Client — Consulta de CEP com Fallback Resiliente
 * 
 * Regra: Se a API falhar, cair ou demorar, a aplicação NUNCA bloqueia o usuário;
 * ela permite preenchimento manual transparente.
 */

export interface ViaCepResponse {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    throw new Error("O CEP deve conter exatamente 8 dígitos numéricos.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`ViaCEP retornou status ${res.status}`);
    }

    const data = await res.json();

    if (data.erro === true || data.erro === "true") {
      return null; // CEP não localizado na base
    }

    return {
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
      postal_code: cleanCep,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    // Erro de rede ou abort: loga e repassa para acionar fallback manual
    throw err;
  }
}
