// Muuntimet-moduuli MK Porttaaliin
// Käytetään vanhaa toimivaa muuntimet.html:ää iframe:ssa
// Tämä säilyttää kaikki 32 muunninta täysin toimivina

export function renderConvertersView(content) {
    content.innerHTML = `
        <div style="margin: -20px; margin-top: -10px;">
            <iframe 
                src="muuntimet.html" 
                style="width: 100%; height: calc(100vh - 120px); height: calc(100dvh - 120px); min-height: min(700px, calc(100dvh - 140px)); border: none;"
                title="Muuntimet"
            ></iframe>
        </div>
    `;
}
