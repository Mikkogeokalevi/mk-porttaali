// Muuntimet-moduuli MK Porttaaliin
// Käytetään vanhaa toimivaa muuntimet.html:ää iframe:ssa
// Tämä säilyttää kaikki 32 muunninta täysin toimivina

export function renderConvertersView(content) {
    content.innerHTML = `
        <div class="card" style="padding: 0; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: var(--card-bg); border-bottom: 1px solid var(--border-color);">
                <h2 style="margin: 0;">🔄 Yksikönmuuntimet</h2>
                <a href="muuntimet.html" target="_blank" class="btn" style="font-size: 0.85em;">↗ Avaa erillisessä ikkunassa</a>
            </div>
            <iframe 
                src="muuntimet.html" 
                style="width: 100%; height: calc(100vh - 200px); min-height: 600px; border: none;"
                title="Muuntimet"
            ></iframe>
        </div>
    `;
}
