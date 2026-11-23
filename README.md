# Dedo Solto — treino de violão (Android)

App para quem já sabe alguns acordes mas **trava nas trocas**, **sofre com a pestana** e **não tem ouvido absoluto**.
É um PWA: instala no Android pelo Chrome como um app normal (ícone, tela cheia, funciona offline).

**Endereço:** https://dias06059-lab.github.io/dedo-solto/ — abra no Chrome do Android → menu ⋮ → **Instalar app**.

## O que tem

| Aba | Para quê |
|---|---|
| **Início** | Treino do dia (~20 min) montado automaticamente, sequência de dias e minutos praticados na semana. |
| **Trocas** | *Minuto de trocas* (registra seu recorde e mostra a evolução) e *trocas com metrônomo* (mostra o acorde atual e o próximo, acelera sozinho). Diagramas de todos os acordes e dicas automáticas para cada troca: qual dedo fica parado (âncora), qual só desliza (guia). |
| **Pestana** | 5 exercícios guiados com tempo e bipes (mini-pestana, aperta e solta, descendo o braço, construindo o F, montar/desmontar) + **verificador pelo microfone**: você toca corda por corda e o app diz qual está limpa, abafada ou soando solta. |
| **Ouvido** | Maior ou menor, qual é o acorde, intervalos (com músicas de referência), mais agudo/grave (afinação fina) e *ache a nota no violão* (microfone confere). |
| **Afinador** | Afinador cromático pelo microfone + sons de referência de cada corda para afinar de ouvido. |

O progresso fica salvo no próprio celular.

## Testar no computador

```powershell
node tools/serve.mjs
```

Abra http://localhost:5173 (no Chrome, use F12 → modo celular).

## Instalar no celular

O microfone e a instalação só funcionam em **HTTPS**, então o app precisa ficar hospedado em algum lugar. Duas opções gratuitas:

- **GitHub Pages:** crie um repositório, envie esta pasta e ative *Settings → Pages*. O endereço fica `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
- **Netlify Drop:** arraste a pasta em https://app.netlify.com/drop.

Depois, no Android: abra o endereço no **Chrome** → menu **⋮** → **Instalar app** (ou *Adicionar à tela inicial*).

### Quer um APK?

Com o app hospedado, cole o endereço em https://www.pwabuilder.com, que gera um pacote Android (APK/AAB) sem precisar do Android Studio.

## Estrutura

```
index.html, manifest.webmanifest, sw.js   app + instalação + cache offline
css/style.css
js/data.js      acordes, intervalos, dicas, análise de trocas
js/audio.js     som de violão sintetizado, metrônomo, bipes
js/pitch.js     detecção de nota pelo microfone
js/diagram.js   desenho dos diagramas de acordes
js/store.js     progresso salvo no aparelho
js/views/       telas (início, trocas, pestana, ouvido, afinador)
tools/          servidor local e gerador de ícones
```

Ao publicar uma atualização, mude `VERSION` em `sw.js` para os celulares baixarem a nova versão.
