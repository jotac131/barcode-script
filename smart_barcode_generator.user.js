// ==UserScript==
// @name         Smart Barcode Generator FCResearch & afttransshipmenthub | qjuflore
// @version      2024.9.20
// @description  Adds a modern toggle switch with a collapsible advanced settings panel to activate/deactivate the barcode generator with multiple customization options, including QR code support, size control, animations, multi-language support, history with favorites, and export functionality. Now with optimized performance.
// @author       Juan Flores | qjufore

// North America (na)
// @match        https://fcresearch-na.aka.amazon.com/*/results?s=*
// @match        http://fcresearch-na.aka.amazon.com/*/results?s=*
// @match        https://aft-sherlock-service-na.amazon.com/*/results?s=*
// @match        http://aft-sherlock-service-na.amazon.com/*/results?s=*
// @match        https://afttransshipmenthub-na.aka.amazon.com/*
// @match        http://afttransshipmenthub-na.aka.amazon.com/*

// Europe (eu)
// @match        https://fcresearch-eu.aka.amazon.com/*/results?s=*
// @match        http://fcresearch-eu.aka.amazon.com/*/results?s=*
// @match        https://aft-sherlock-service-eu.amazon.com/*/results?s=*
// @match        http://aft-sherlock-service-eu.amazon.com/*/results?s=*
// @match        https://afttransshipmenthub-eu.aka.amazon.com/*
// @match        http://afttransshipmenthub-eu.aka.amazon.com/*

// Far East (fe)
// @match        https://fcresearch-fe.aka.amazon.com/*/results?s=*
// @match        http://fcresearch-fe.aka.amazon.com/*/results?s=*
// @match        https://aft-sherlock-service-fe.amazon.com/*/results?s=*
// @match        http://aft-sherlock-service-fe.amazon.com/*/results?s=*
// @match        https://afttransshipmenthub-fe.aka.amazon.com/*
// @match        http://afttransshipmenthub-fe.aka.amazon.com/*

// China (cn)
// @match        https://fcresearch-cn.aka.amazon.com/*/results?s=*
// @match        http://fcresearch-cn.aka.amazon.com/*/results?s=*
// @match        https://aft-sherlock-service-cn.amazon.com/*/results?s=*
// @match        http://aft-sherlock-service-cn.amazon.com/*/results?s=*
// @match        https://afttransshipmenthub-cn.aka.amazon.com/*
// @match        http://afttransshipmenthub-cn.aka.amazon.com/*

// @require      https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js
// @grant        GM_xmlHttpRequest
// @connect      *
// ==/UserScript==





(function() {
    'use strict';

    const maxBarcodeLength = 30;
    const minBarcodeLength = 1;
    const throttleTime = 300; // Tiempo de espera en ms antes de generar un código de barras
    let isActive = localStorage.getItem('barcodeGeneratorActive') === 'true';
    let barcodeType = localStorage.getItem('barcodeType') || 'CODE128';
    let barcodeSize = parseInt(localStorage.getItem('barcodeSize')) || 2;
    let barcodeCanvas;
    let currentLanguage = localStorage.getItem('barcodeGeneratorLang') || 'en';
    let isDarkMode = localStorage.getItem('barcodeGeneratorDarkMode') === 'true';
    let lastExecutionTime = 0;
    let mouseOverTextTimeout;

    const languages = {
        en: {
            toggleLabel: "Barcode Generator:",
            settingsTitle: "Barcode Generator Settings",
            barcodeTypeLabel: "Barcode Type:",
            barcodeSizeLabel: "Barcode Size:",
            saveLabel: "Save",
            cancelLabel: "Cancel",
            exportLabel: "Export Barcode",
            historyTitle: "Barcode History",
            clearHistory: "Clear History",
            darkModeLabel: "Enable Dark Mode",
            viewHistory: "View History",
            saveBarcode: "Save Barcode",
            previewLabel: "Preview",
            favoriteLabel: "Favorite",
            unfavoriteLabel: "Unfavorite",
            copyLabel: "Copy to Clipboard",
            favoritesTitle: "Favorite Barcodes",
            closeFavorites: "Close Favorites",
            helpTitle: "Help & Guidance"
        },
        es: {
            toggleLabel: "Generador de Códigos de Barras:",
            settingsTitle: "Configuración del Generador de Códigos de Barras",
            barcodeTypeLabel: "Tipo de Código de Barras:",
            barcodeSizeLabel: "Tamaño del Código de Barras:",
            saveLabel: "Guardar",
            cancelLabel: "Cancelar",
            exportLabel: "Exportar Código de Barras",
            historyTitle: "Historial de Códigos de Barras",
            clearHistory: "Limpiar Historial",
            darkModeLabel: "Activar Modo Oscuro",
            viewHistory: "Ver Historial",
            saveBarcode: "Guardar Código de Barras",
            previewLabel: "Vista Previa",
            favoriteLabel: "Favorito",
            unfavoriteLabel: "Eliminar de Favoritos",
            copyLabel: "Copiar al Portapapeles",
            favoritesTitle: "Códigos de Barras Favoritos",
            closeFavorites: "Cerrar Favoritos",
            helpTitle: "Ayuda y Guía"
        }
    };

    let barcodeHistory = JSON.parse(localStorage.getItem('barcodeHistory')) || [];
    let favoriteBarcodes = JSON.parse(localStorage.getItem('favoriteBarcodes')) || [];

    function createNotification(message, type = "info") {
        const notification = document.createElement('div');
        notification.className = `barcode-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }

    function generateBarcode(word, x, y) {
        const currentTime = new Date().getTime();
        if (currentTime - lastExecutionTime < throttleTime) {
            return; // Ignorar si no ha pasado suficiente tiempo
        }
        lastExecutionTime = currentTime;

        if (!isActive || word === languages[currentLanguage].toggleLabel || isElementInExcludedArea(x, y)) return;

        if (barcodeCanvas) {
            barcodeCanvas.remove();
        }

        barcodeCanvas = document.createElement('canvas');
        barcodeCanvas.classList.add('generated-barcode');
        barcodeCanvas.style.position = 'fixed';
        barcodeCanvas.style.border = '1px solid #ddd';
        barcodeCanvas.style.zIndex = '10000';
        barcodeCanvas.style.backgroundColor = 'white';
        barcodeCanvas.style.opacity = 0;
        barcodeCanvas.style.transition = "opacity 0.3s ease-in-out";

        let canvasWidth, canvasHeight;
        if (barcodeType === 'QR') {
            canvasWidth = canvasHeight = 128 * barcodeSize;
        } else {
            canvasWidth = 200 * barcodeSize;
            canvasHeight = 40 * barcodeSize;
        }

        // Generate barcode directly under the mouse
        barcodeCanvas.style.top = `${y}px`;
        barcodeCanvas.style.left = `${x}px`;
        barcodeCanvas.width = canvasWidth;
        barcodeCanvas.height = canvasHeight;
        document.body.appendChild(barcodeCanvas);

        if (barcodeType === 'QR') {
            try {
                const qr = qrcode(0, 'H');
                qr.addData(word);
                qr.make();
                const ctx = barcodeCanvas.getContext('2d');
                ctx.fillStyle = isDarkMode ? "#333" : "white";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                const tileW = canvasWidth / qr.getModuleCount();
                const tileH = canvasHeight / qr.getModuleCount();
                for (let row = 0; row < qr.getModuleCount(); row++) {
                    for (let col = 0; col < qr.getModuleCount(); col++) {
                        ctx.fillStyle = qr.isDark(row, col) ? 'black' : 'white';
                        ctx.fillRect(col * tileW, row * tileH, tileW, tileH);
                    }
                }
            } catch (e) {
                createNotification('Error generating QR code: ' + e.message, 'error');
            }
        } else {
            try {
                JsBarcode(barcodeCanvas, word, {
                    format: barcodeType,
                    width: barcodeSize,
                    height: 40 * barcodeSize,
                    lineColor: isDarkMode ? "#fff" : "#000",
                    background: isDarkMode ? "#333" : "white",
                    font: "monospace",
                    textAlign: "center",
                    textMargin: 2,
                    fontSize: 14 * barcodeSize,
                });
            } catch (e) {
                createNotification('Error generating barcode: ' + e.message, 'error');
            }
        }

        if (barcodeHistory.length === 0 || barcodeHistory[0].word !== word) {
            barcodeHistory.unshift({ word, barcodeType, timestamp: new Date().toISOString() });
            if (barcodeHistory.length > 20) barcodeHistory.pop();
            localStorage.setItem('barcodeHistory', JSON.stringify(barcodeHistory));
        }

        setTimeout(() => {
            barcodeCanvas.style.opacity = 1;
        }, 10);
    }

    function removeBarcode() {
        if (barcodeCanvas) {
            barcodeCanvas.remove();
            barcodeCanvas = null;
        }
    }

    function isElementInExcludedArea(x, y) {
        const settingsArea = document.getElementById("barcode-toggle-switch");
        const historyButton = document.querySelector('.history-button');
        const historyPanel = document.querySelector('.history-panel-container');
        const favoritesPanel = document.querySelector('.favorites-panel-container');

        const areasToExclude = [settingsArea, historyButton, historyPanel, favoritesPanel];

        for (const area of areasToExclude) {
            if (area && isMouseOverElement(area, x, y)) {
                return true;
            }
        }

        return false;
    }

    function isMouseOverElement(element, mouseX, mouseY) {
        const rect = element.getBoundingClientRect();
        return (mouseX > rect.left && mouseX < rect.right && mouseY > rect.top && mouseY < rect.bottom);
    }

    document.addEventListener('mousemove', function(event) {
        clearTimeout(mouseOverTextTimeout); // Clear the previous timeout if mouse keeps moving
        const targetElement = document.elementFromPoint(event.clientX, event.clientY);
        const word = targetElement?.textContent?.trim() || "";

        if (word.length >= minBarcodeLength && word.length <= maxBarcodeLength) {
            mouseOverTextTimeout = setTimeout(() => {
                generateBarcode(word, event.clientX + 10, event.clientY + 10);
            }, throttleTime);
        } else {
            removeBarcode();
        }
    });

function addBarcodeToggleSwitch() {
    if (!document.getElementById("barcode-toggle-switch")) {
        const switchContainer = document.createElement("div");
        switchContainer.id = "barcode-toggle-switch";
        switchContainer.className = "barcode-switch-container";

        // Crear el botón de minimizar/expandir con un estilo consistente
        const minimizeButton = document.createElement("button");
        minimizeButton.innerHTML = "&#x25BC;";  // Usar el ícono de flecha para minimizar (flecha abajo)
        minimizeButton.className = "minimize-button";
        minimizeButton.style.fontSize = '16px';  // Tamaño del icono más grande
        minimizeButton.style.padding = '4px';
        minimizeButton.style.backgroundColor = "#fff";  // Fondo claro
        minimizeButton.style.color = "#000";  // Color de la flecha consistente (negro)
        minimizeButton.style.border = "1px solid #ccc";  // Borde ligero
        minimizeButton.style.borderRadius = "5px";  // Borde redondeado
        minimizeButton.onclick = function() {
            minimizePanel();  // Minimizar cuando se hace clic en el botón
        };

        const textLabel = document.createElement("span");
        textLabel.innerText = "Barcode";
        textLabel.className = "barcode-switch-label";
        textLabel.style.fontSize = '16px';  // Aumentar tamaño de "Barcode"

        const switchLabel = document.createElement("label");
        switchLabel.className = "switch";

        const switchInput = document.createElement("input");
        switchInput.type = "checkbox";
        switchInput.checked = isActive;
        switchInput.onchange = toggleBarcodeActivation;

        const switchSpan = document.createElement("span");
        switchSpan.className = "slider round";

        switchLabel.appendChild(switchInput);
        switchLabel.appendChild(switchSpan);

        const settingsButton = document.createElement("button");
        settingsButton.textContent = "⚙️";
        settingsButton.className = "settings-button";
        settingsButton.onclick = function() {
            toggleSettingsPanel();  // Llamamos a la función de abrir/ocultar settings
        };

        const historyButton = document.createElement("button");
        historyButton.textContent = languages[currentLanguage].viewHistory;
        historyButton.className = "history-button";
        historyButton.onclick = function() {
            toggleHistoryPanel();  // Llamamos a la función de abrir/ocultar historial
        };

        // Ajustes generales del panel
        switchContainer.style.display = 'flex';
        switchContainer.style.flexDirection = 'row';
        switchContainer.style.alignItems = 'center';
        switchContainer.style.backgroundColor = '#282c34';
        switchContainer.style.color = 'white';
        switchContainer.style.padding = '6px 8px';
        switchContainer.style.borderRadius = '8px';
        switchContainer.style.fontSize = '12px';
        switchContainer.style.zIndex = '10001';
        switchContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        switchContainer.style.position = 'absolute';
        switchContainer.style.top = '80px';
        switchContainer.style.right = '20px';
        switchContainer.style.width = 'fit-content';
        switchContainer.style.maxWidth = '400px';

        textLabel.style.marginRight = '10px';

        switchContainer.appendChild(minimizeButton);  // Añadimos el botón de minimizar
        switchContainer.appendChild(textLabel);
        switchContainer.appendChild(switchLabel);
        switchContainer.appendChild(settingsButton);
        switchContainer.appendChild(historyButton);

        // Crear el pequeño icono que aparece cuando el panel está minimizado
        const smallIcon = document.createElement("div");

        // Insertar el ícono SVG moderno (hamburguesa estilizado)
        smallIcon.innerHTML = `
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect y="4" width="24" height="2" fill="white"/>
                <rect y="11" width="24" height="2" fill="white"/>
                <rect y="18" width="24" height="2" fill="white"/>
            </svg>
        `;

        smallIcon.className = "small-icon";
        smallIcon.style.display = 'none';  // Lo ocultamos inicialmente
        smallIcon.style.position = 'absolute';
        smallIcon.style.top = '80px';
        smallIcon.style.right = '20px';
        smallIcon.style.backgroundColor = '#282c34';
        smallIcon.style.padding = '5px';
        smallIcon.style.borderRadius = '8px';
        smallIcon.style.cursor = 'pointer';
        smallIcon.style.zIndex = '10001';

        // Al hacer clic en el ícono pequeño, se muestra nuevamente el panel
        smallIcon.onclick = function() {
            smallIcon.style.display = 'none';  // Ocultar el ícono pequeño
            switchContainer.style.display = 'flex';  // Mostrar el panel completo
            resetInactivityTimer();  // Reiniciar el temporizador de inactividad
        };

        // Insertar el panel de control en la página
        const headerElement = document.querySelector('header, #main-header, .navbar');
        if (headerElement) {
            headerElement.appendChild(switchContainer);
            headerElement.appendChild(smallIcon);  // Agregar también el pequeño ícono
        } else {
            document.body.appendChild(switchContainer);
            document.body.appendChild(smallIcon);
        }

        // Ajustar la posición de los paneles de configuración y historial
        function adjustPanelsPosition() {
            const settingsPanel = document.querySelector('.settings-panel-container');
            const historyPanel = document.querySelector('.history-panel-container');

            if (settingsPanel) {
                settingsPanel.style.top = `${switchContainer.offsetTop + switchContainer.offsetHeight + 10}px`;  // Colocar justo debajo del panel de control
            }
            if (historyPanel) {
                historyPanel.style.top = `${switchContainer.offsetTop + switchContainer.offsetHeight + 10}px`;  // Colocar justo debajo del panel de control
            }
        }

        // Función para minimizar el panel y también minimizar los paneles secundarios
        function minimizePanel() {
            switchContainer.style.display = 'none';  // Ocultar el panel completo
            smallIcon.style.display = 'flex';  // Mostrar solo el ícono pequeño

            // Minimizar los paneles secundarios (settings y history)
            const settingsPanel = document.querySelector('.settings-panel-container');
            const historyPanel = document.querySelector('.history-panel-container');
            if (settingsPanel) {
                settingsPanel.style.display = 'none';  // Minimizar panel de settings
            }
            if (historyPanel) {
                historyPanel.style.display = 'none';  // Minimizar panel de history
            }
        }

        // Función para reiniciar el temporizador de inactividad
        let inactivityTimer;
        function resetInactivityTimer() {
            clearTimeout(inactivityTimer);  // Limpiar el temporizador anterior
            inactivityTimer = setTimeout(minimizePanel, 5000);  // Minimizar el panel después de 5 segundos de inactividad
        }

        // Detectar actividad del mouse y reiniciar el temporizador
        document.addEventListener('mousemove', function() {
            resetInactivityTimer();  // Reiniciar el temporizador cada vez que el mouse se mueva
        });

        resetInactivityTimer();  // Iniciar el temporizador de inactividad al cargar

        // Iniciar el panel minimizado
        minimizePanel();  // Minimizar el panel automáticamente cuando la página carga

        // Detectar cuando se abra un panel secundario para ajustar su posición
        document.addEventListener('click', adjustPanelsPosition);

        addSwitchStyles();  // Asegurar que los estilos modernos se apliquen
        createNotification(`Barcode ${isActive ? 'Activated' : 'Deactivated'}`);
    }
}























    function toggleBarcodeActivation() {
        isActive = !isActive;
        localStorage.setItem('barcodeGeneratorActive', isActive);
        createNotification(`Barcode Generator ${isActive ? 'Activated' : 'Deactivated'}`, isActive ? "success" : "warning");
    }

    function toggleSettingsPanel() {
        const panel = document.querySelector('.settings-panel-container');
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }

    function toggleHistoryPanel() {
        const historyPanel = document.querySelector('.history-panel-container');
        if (historyPanel) {
            historyPanel.remove();
            removeFavoritesPanel(); // Cierra los favoritos cuando se cierra el historial
        } else {
            viewBarcodeHistory();
        }
    }

    function toggleFavoritesPanel() {
        const favoritesPanel = document.querySelector('.favorites-panel-container');
        if (favoritesPanel) {
            favoritesPanel.remove();
        } else {
            viewFavorites();
        }
    }

    function removeFavoritesPanel() {
        const favoritesPanel = document.querySelector('.favorites-panel-container');
        if (favoritesPanel) {
            favoritesPanel.remove();
        }
    }

    function addSwitchStyles() {
        const style = document.createElement("style");
        style.innerHTML = `
            .barcode-switch-container {
                position: fixed;
                top: 10px;
                left: 10px;
                z-index: 10001;
                display: flex;
                align-items: center;
                background-color: #282c34;
                color: white;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            .barcode-switch-label {
                margin-right: 10px;
            }
            .switch {
                position: relative;
                display: inline-block;
                width: 42px;
                height: 24px;
            }
            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 34px;
            }
            .slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            input:checked + .slider {
                background-color: #28a745;
            }
            input:checked + .slider:before {
                transform: translateX(18px);
            }
            .slider.round {
                border-radius: 34px;
            }
            .slider.round:before {
                border-radius: 50%;
            }
            .settings-button, .history-button {
                background-color: #444;
                color: white;
                border: none;
                padding: 2px 8px;
                margin-left: 10px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 18px;
            }
            .settings-button:hover, .history-button:hover {
                background-color: #555;
            }
            .barcode-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #444;
                color: #fff;
                padding: 10px 15px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                opacity: 1;
                transition: opacity 0.5s ease-out;
            }
            .barcode-notification.success {
                background-color: #28a745;
            }
            .barcode-notification.warning {
                background-color: #dc3545;
            }
            .barcode-notification.error {
                background-color: #e74c3c;
            }
            .history-panel-container {
                position: fixed;
                top: 160px;
                left: 160px;
                z-index: 10001;
                background-color: #fff;
                color: #333;
                padding: 10px;
                border-radius: 8px;
                font-size: 12px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                max-height: 300px;
                overflow-y: auto;
            }
            .history-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            .history-item span {
                flex: 1;
                color: #333;
            }
            .history-item.favorite span {
                color: #28a745;
                font-weight: bold;
            }
            .history-item.favorite {
                background-color: #f0f0f0;
                border-left: 5px solid #28a745;
            }
            .history-item button {
                background-color: #444;
                color: white;
                border: none;
                padding: 2px 4px;
                border-radius: 4px;
                cursor: pointer;
            }
            .history-item button:hover {
                background-color: #555;
            }
            .favorites-panel-container {
                position: fixed;
                top: 460px;
                left: 160px;
                z-index: 10001;
                background-color: #fff;
                color: #333;
                padding: 10px;
                border-radius: 8px;
                font-size: 12px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                max-height: 300px;
                overflow-y: auto;
            }
            .favorites-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #28a745;
            }
            .favorite-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                background-color: #eaf5ea;
                border-left: 5px solid #28a745;
                padding-left: 5px;
            }
            .favorite-item span {
                flex: 1;
                color: #28a745;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    function addAdvancedSettingsPanel() {
        const panelContainer = document.createElement("div");
        panelContainer.className = "settings-panel-container";
        panelContainer.style.display = "none";

        const panelHeader = document.createElement("h3");
        panelHeader.textContent = languages[currentLanguage].settingsTitle;

        const typeLabel = document.createElement("label");
        typeLabel.textContent = languages[currentLanguage].barcodeTypeLabel;
        const typeSelect = document.createElement("select");
        ["CODE128", "QR", "EAN13", "UPC"].forEach(type => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
        typeSelect.value = barcodeType;
        typeSelect.onchange = () => {
            barcodeType = typeSelect.value;
            localStorage.setItem("barcodeType", barcodeType);
            createNotification(`Barcode type set to ${barcodeType}`, "info");
            updateFavoriteStatus(); // Refresca el estado de favoritos en el historial
        };

        const sizeLabel = document.createElement("label");
        sizeLabel.textContent = languages[currentLanguage].barcodeSizeLabel;
        const sizeInput = document.createElement("input");
        sizeInput.type = "range";
        sizeInput.min = "1";
        sizeInput.max = "5";
        sizeInput.value = barcodeSize;
        sizeInput.oninput = () => {
            barcodeSize = sizeInput.value;
            localStorage.setItem("barcodeSize", barcodeSize);
            createNotification(`Barcode size set to ${barcodeSize}`, "info");
        };

        const langLabel = document.createElement("label");
        langLabel.textContent = "Language / Idioma:";
        const langSelect = document.createElement("select");
        Object.keys(languages).forEach(lang => {
            const option = document.createElement("option");
            option.value = lang;
            option.textContent = lang.toUpperCase();
            langSelect.appendChild(option);
        });
        langSelect.value = currentLanguage;
        langSelect.onchange = () => {
            currentLanguage = langSelect.value;
            localStorage.setItem("barcodeGeneratorLang", currentLanguage);
            createNotification(`Language set to ${currentLanguage.toUpperCase()}`, "info");
            location.reload();
        };

        const darkModeLabel = document.createElement("label");
        darkModeLabel.textContent = languages[currentLanguage].darkModeLabel;
        const darkModeInput = document.createElement("input");
        darkModeInput.type = "checkbox";
        darkModeInput.checked = isDarkMode;
        darkModeInput.onchange = () => {
            isDarkMode = darkModeInput.checked;
            localStorage.setItem("barcodeGeneratorDarkMode", isDarkMode);
            createNotification(`Dark Mode ${isDarkMode ? 'Enabled' : 'Disabled'}`, isDarkMode ? "success" : "warning");
            location.reload();
        };

        panelContainer.appendChild(panelHeader);
        panelContainer.appendChild(typeLabel);
        panelContainer.appendChild(typeSelect);
        panelContainer.appendChild(sizeLabel);
        panelContainer.appendChild(sizeInput);
        panelContainer.appendChild(langLabel);
        panelContainer.appendChild(langSelect);
        panelContainer.appendChild(darkModeLabel);
        panelContainer.appendChild(darkModeInput);

        addPanelStyles();
        document.body.appendChild(panelContainer);
    }

    function viewBarcodeHistory() {
        const historyContainer = document.createElement('div');
        historyContainer.className = 'history-panel-container';

        const historyTitle = document.createElement('h3');
        historyTitle.textContent = languages[currentLanguage].historyTitle;
        historyContainer.appendChild(historyTitle);

        const clearButton = document.createElement('button');
        clearButton.textContent = languages[currentLanguage].clearHistory;
        clearButton.onclick = () => {
            // Eliminar solo el historial, manteniendo los favoritos
            barcodeHistory = barcodeHistory.filter(item => favoriteBarcodes.some(fav => fav.word === item.word));
            localStorage.setItem('barcodeHistory', JSON.stringify(barcodeHistory));
            updateHistoryAndFavorites();
            createNotification(languages[currentLanguage].clearHistory, 'success');
        };
        historyContainer.appendChild(clearButton);

        barcodeHistory.forEach(item => {
            const isFavorite = favoriteBarcodes.some(fav => fav.word === item.word);
            createHistoryItem(historyContainer, item, isFavorite);
        });

        toggleFavoritesPanel(); // Mostrar la sección de favoritos al abrir el historial

        document.body.appendChild(historyContainer);
    }

    function createHistoryItem(container, item, isFavorite) {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${isFavorite ? 'favorite' : ''}`;

        const wordSpan = document.createElement('span');
        wordSpan.textContent = `${item.word} (${item.barcodeType})`;

        const dateSpan = document.createElement('span');
        dateSpan.textContent = new Date(item.timestamp).toLocaleString();

        const favoriteButton = document.createElement('button');
        favoriteButton.textContent = isFavorite ? languages[currentLanguage].unfavoriteLabel : languages[currentLanguage].favoriteLabel;
        favoriteButton.onclick = () => {
            if (isFavorite) {
                favoriteBarcodes = favoriteBarcodes.filter(fav => fav.word !== item.word);
                localStorage.setItem('favoriteBarcodes', JSON.stringify(favoriteBarcodes));
                createNotification(`${item.word} removed from favorites`, 'warning');
            } else {
                favoriteBarcodes.push(item);
                localStorage.setItem('favoriteBarcodes', JSON.stringify(favoriteBarcodes));
                createNotification(`${item.word} marked as favorite`, 'success');
            }
            updateHistoryAndFavorites(); // Actualiza el historial y los favoritos en la interfaz
        };

        const copyButton = document.createElement('button');
        copyButton.textContent = languages[currentLanguage].copyLabel;
        copyButton.onclick = () => copyToClipboard(item.word);

        const exportButton = document.createElement('button');
        exportButton.textContent = languages[currentLanguage].exportLabel;
        exportButton.onclick = () => exportBarcode(item.word, item.barcodeType);

        historyItem.appendChild(wordSpan);
        historyItem.appendChild(dateSpan);
        historyItem.appendChild(favoriteButton);
        historyItem.appendChild(copyButton);
        historyItem.appendChild(exportButton);
        container.appendChild(historyItem);
    }

    function viewFavorites() {
        const favoritesContainer = document.createElement('div');
        favoritesContainer.className = 'favorites-panel-container';

        const favoritesTitle = document.createElement('h3');
        favoritesTitle.textContent = languages[currentLanguage].favoritesTitle;
        favoritesContainer.appendChild(favoritesTitle);

        const closeButton = document.createElement('button');
        closeButton.textContent = languages[currentLanguage].closeFavorites;
        closeButton.onclick = () => {
            removeFavoritesPanel();
        };
        favoritesContainer.appendChild(closeButton);

        favoriteBarcodes.forEach(item => {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'favorite-item';

            const wordSpan = document.createElement('span');
            wordSpan.textContent = `${item.word} (${item.barcodeType})`;

            const dateSpan = document.createElement('span');
            dateSpan.textContent = new Date(item.timestamp).toLocaleString();

            const unfavoriteButton = document.createElement('button');
            unfavoriteButton.textContent = languages[currentLanguage].unfavoriteLabel;
            unfavoriteButton.onclick = () => {
                favoriteBarcodes = favoriteBarcodes.filter(fav => fav.word !== item.word);
                localStorage.setItem('favoriteBarcodes', JSON.stringify(favoriteBarcodes));
                createNotification(`${item.word} removed from favorites`, 'warning');
                updateHistoryAndFavorites(); // Actualiza el historial y los favoritos en la interfaz
            };

            const copyButton = document.createElement('button');
            copyButton.textContent = languages[currentLanguage].copyLabel;
            copyButton.onclick = () => copyToClipboard(item.word);

            const exportButton = document.createElement('button');
            exportButton.textContent = languages[currentLanguage].exportLabel;
            exportButton.onclick = () => exportBarcode(item.word, item.barcodeType);

            favoriteItem.appendChild(wordSpan);
            favoriteItem.appendChild(dateSpan);
            favoriteItem.appendChild(unfavoriteButton);
            favoriteItem.appendChild(copyButton);
            favoriteItem.appendChild(exportButton);
            favoritesContainer.appendChild(favoriteItem);
        });

        document.body.appendChild(favoritesContainer);
    }

    function updateHistoryAndFavorites() {
        const historyPanel = document.querySelector('.history-panel-container');
        const favoritesPanel = document.querySelector('.favorites-panel-container');
        if (historyPanel) {
            const historyContainer = historyPanel.parentElement;
            historyPanel.remove();
            viewBarcodeHistory();
            historyContainer.appendChild(document.querySelector('.history-panel-container'));
        }
        if (favoritesPanel) {
            const favoritesContainer = favoritesPanel.parentElement;
            favoritesPanel.remove();
            viewFavorites();
            favoritesContainer.appendChild(document.querySelector('.favorites-panel-container'));
        }
    }

    function copyToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        createNotification(`${text} copied to clipboard`, 'success');
    }

    function exportBarcode(word, type) {
        const exportCanvas = document.createElement('canvas');
        let canvasWidth, canvasHeight;
        if (type === 'QR') {
            canvasWidth = canvasHeight = 128 * barcodeSize;
        } else {
            canvasWidth = 200 * barcodeSize;
            canvasHeight = 40 * barcodeSize;
        }

        exportCanvas.width = canvasWidth;
        exportCanvas.height = canvasHeight;

        if (type === 'QR') {
            const qr = qrcode(0, 'H');
            qr.addData(word);
            qr.make();
            const ctx = exportCanvas.getContext('2d');
            ctx.fillStyle = isDarkMode ? "#333" : "white";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            const tileW = canvasWidth / qr.getModuleCount();
            const tileH = canvasHeight / qr.getModuleCount();
            for (let row = 0; row < qr.getModuleCount(); row++) {
                for (let col = 0; col < qr.getModuleCount(); col++) {
                    ctx.fillStyle = qr.isDark(row, col) ? 'black' : 'white';
                    ctx.fillRect(col * tileW, row * tileH, tileW, tileH);
                }
            }
        } else {
            JsBarcode(exportCanvas, word, {
                format: type,
                width: barcodeSize,
                height: 40 * barcodeSize,
                lineColor: isDarkMode ? "#fff" : "#000",
                background: isDarkMode ? "#333" : "white",
                font: "monospace",
                textAlign: "center",
                textMargin: 2,
                fontSize: 14 * barcodeSize,
            });
        }

        exportCanvas.toBlob(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${word}-${type}.png`;
            link.click();
            createNotification(`${languages[currentLanguage].exportLabel} ${word}-${type}.png`, 'success');
        });
    }

    function addPanelStyles() {
        const style = document.createElement("style");
        style.innerHTML = `
            .settings-panel-container {
                position: fixed;
                top: 100px;
                left: 160px;
                z-index: 10001;
                background-color: #f4f4f4;
                color: #333;
                padding: 15px;
                border-radius: 8px;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .settings-panel-container h3 {
                margin: 0 0 10px 0;
                font-size: 18px;
                color: #444;
            }
            .settings-panel-container label {
                display: block;
                margin: 10px 0 5px 0;
                font-weight: bold;
            }
            .settings-panel-container select,
            .settings-panel-container input[type="range"] {
                width: 100%;
                margin-bottom: 10px;
            }
            .settings-panel-container input[type="checkbox"] {
                margin-left: 10px;
                vertical-align: middle;
            }
        `;
        document.head.appendChild(style);
    }

    addAdvancedSettingsPanel();
    addBarcodeToggleSwitch();
})();
