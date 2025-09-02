#<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, user-scalable=no"
    />
    <title>Advanced Image Resizer (with DPI & Editor)</title>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css"
    />

    <style>
      :root {
          --primary-color: #3498db;
          --secondary-color: #2ecc71;
          --accent-color: #f39c12;
          --error-color: #e74c3c;
          --font-family: 'Roboto', 'Segoe UI', sans-serif;
          --border-radius: 10px;

          /* Light Mode Variables */
          --background-color-light: #ecf0f1;
          --card-background-color-light: #ffffff;
          --text-color-primary-light: #2c3e50;
          --text-color-secondary-light: #7f8c8d;
          --border-color-light: #bdc3c7;
          --preset-button-bg-light: #f8f9fa;
          --preset-button-border-light: #dee2e6;
          --preset-button-active-bg-light: #e9ecef;
          --preset-icon-color-light: #6c757d;

          /* Dark Mode Variables */
          --background-color-dark: #2c3e50;
          --card-background-color-dark: #34495e;
          --text-color-primary-dark: #ecf0f1;
          --text-color-secondary-dark: #95a5a6;
          --border-color-dark: #566573;
          --preset-button-bg-dark: #4a637c;
          --preset-button-border-dark: #566573;
          --preset-button-active-bg-dark: #2c3e50;
          --preset-icon-color-dark: #bdc3c7;

          /* Dynamic Variables */
          --background-color: var(--background-color-light);
          --card-background-color: var(--card-background-color-light);
          --text-color-primary: var(--text-color-primary-light);
          --text-color-secondary: var(--text-color-secondary-light);
          --border-color: var(--border-color-light);
          --box-shadow: 0 8px 25px rgba(44,62,80,0.1);
          --preset-button-bg: var(--preset-button-bg-light);
          --preset-button-border: var(--preset-button-border-light);
          --preset-button-active-bg: var(--preset-button-active-bg-light);
          --preset-icon-color: var(--preset-icon-color-light);
      }

      body.dark-mode {
          --background-color: var(--background-color-dark);
          --card-background-color: var(--card-background-color-dark);
          --text-color-primary: var(--text-color-primary-dark);
          --text-color-secondary: var(--text-color-secondary-dark);
          --border-color: var(--border-color-dark);
          --box-shadow: 0 8px 25px rgba(0,0,0,0.2);
          --preset-button-bg: var(--preset-button-bg-dark);
          --preset-button-border: var(--preset-button-border-dark);
          --preset-button-active-bg: var(--preset-button-active-bg-dark);
          --preset-icon-color: var(--preset-icon-color-dark);
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
          font-family: var(--font-family);
          background-color: var(--background-color);
          color: var(--text-color-primary);
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          padding: 20px 15px;
          line-height: 1.6;
          transition: background-color 0.3s, color 0.3s;
      }
      .resizer-container {
          width: 100%;
          max-width: 480px;
          background-color: var(--card-background-color);
          padding: 25px;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
          text-align: center;
          transition: background-color 0.3s;
      }
      .header-container { display: flex; justify-content: space-between; align-items: flex-start; }
      .resizer-header { flex-grow: 1; text-align: center; margin-left: 40px; }
      .resizer-header h1 { font-size: 1.7em; font-weight: 700; color: var(--text-color-primary); margin-bottom: 8px; }
      .resizer-header p { font-size: 0.9em; color: var(--text-color-secondary); margin-bottom: 25px; }

      #darkModeToggle { background: none; border: 1px solid var(--border-color); color: var(--text-color-secondary); width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.2em; transition: color 0.3s, background-color 0.3s; }
      #darkModeToggle:hover { background-color: var(--preset-button-active-bg); }

      .upload-area {
          border: 2.5px dashed var(--border-color);
          background-color: var(--preset-button-bg);
          padding: 35px 20px;
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
      }
      .upload-area:before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: 1;
      }
      .upload-area.dragging-over {
          border-color: var(--primary-color);
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(44,62,80,0.12);
      }
      body.dark-mode .upload-area.dragging-over {
          box-shadow: 0 12px 30px rgba(0,0,0,0.3);
      }
      .upload-area.dragging-over:before { opacity: 0.08; }
      .upload-area.has-error { border-color: var(--error-color); }

      .upload-area input[type="file"] { display: none; }
      .upload-area .upload-content { position: relative; z-index: 2; }
      .upload-area .upload-icon {
          font-size: 3.2em;
          color: var(--primary-color);
          margin-bottom: 15px;
          transition: transform 0.3s ease;
      }
      .upload-area:hover .upload-icon { transform: scale(1.1) rotate(-5deg); }
      .upload-area .upload-text { font-weight: 600; font-size: 1.15em; display: block; margin-bottom: 5px; }
      #fileNameDisplay { font-size: 0.8em; color: var(--text-color-secondary); word-break: break-all; margin-top: 8px; min-height: 1.2em; font-weight: 600; }

      .image-details { font-size: 0.85em; color: var(--text-color-secondary); margin-bottom: 20px; text-align: left; background: var(--preset-button-bg); padding: 8px; border-radius: 4px;}
      .controls-form { display: flex; flex-direction: column; gap: 18px; margin-bottom: 25px; }
      .control-group { text-align: left; }
      .control-group label { font-size: 0.9em; font-weight: 600; margin-bottom: 6px; display: block; }
      .control-group input, .control-group select { padding: 12px 15px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95em; width: 100%; background-color: var(--card-background-color); color: var(--text-color-primary); }
      body.dark-mode .control-group input, body.dark-mode .control-group select { background-color: var(--background-color); }
      .dimension-controls, .target-size-controls { display: flex; gap: 10px; align-items: flex-end; }
      .dimension-controls .control-group, .target-size-controls .control-group { flex: 1; }
      .dimension-controls .unit-selector { flex: 0 0 90px; }
      .target-size-controls .unit-selector { flex: 0 0 80px; }
      .checkbox-control { display: flex; align-items: center; text-align: left; margin-top: 5px; }
      .checkbox-control input { margin-right: 8px; transform: scale(1.2); }
      .checkbox-control label { margin-bottom: 0; }
      .info-text { font-size: 0.75em; text-align: left; margin-top: -10px; color: var(--text-color-secondary); }
      .action-button { width: 100%; padding: 14px; font-size: 1.1em; font-weight: 700; color: white; border: none; border-radius: var(--border-radius); cursor: pointer; transition: background-color 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
      #processImageButtonElement { background-color: var(--secondary-color); }
      #processImageButtonElement:hover:not(:disabled) { background-color: #27ae60; }
      .action-button:disabled { background-color: #95a5a6; cursor: not-allowed; }
      .preview-area { margin-top: 25px; }
      .preview-box { border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 10px; }
      .preview-box h3 { font-size: 1em; margin-bottom: 8px; color: var(--primary-color); }
      .preview-box canvas { max-width: 100%; max-height: 220px; display: block; margin: 0 auto 8px; }
      .app-message { text-align: center; margin-top: 15px; padding: 10px; font-size: 0.9em; border-radius: var(--border-radius); display: none; }
      .app-message.success { background-color: #e6f7ec; color: #239c48; border: 1px solid #a7d8b8;}
      .app-message.error { background-color: #fdecea; color: var(--error-color); border: 1px solid #f8c6c2;}
      .app-message.info { background-color: #eef5ff; color: var(--primary-color); border: 1px solid #a8caff;}

      #crop-preview-container { margin-bottom: 15px; }
      #openCropModalButton { background-color: var(--primary-color); }
      .image-preview-box { background: var(--preset-button-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 15px; text-align: center; }
      #cropPreviewImage { max-width: 100%; max-height: 250px; border-radius: 8px; }
      #downloadButtonElement { background-color: var(--accent-color); margin-top: 15px; }

      /* === MODAL STYLES === */
      .crop-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.85); display: none; justify-content: center; align-items: center; z-index: 1000; padding: 10px; }
      .crop-modal-overlay.visible { display: flex; }
      .crop-modal-content {
          position: relative;
          background-color: var(--card-background-color);
          color: var(--text-color-primary);
          padding: 20px;
          padding-top: 45px;
          border-radius: var(--border-radius);
          width: 100%;
          max-width: 1100px;
          height: 95%;
          text-align: center;
          display: flex;
          flex-direction: column;
      }
      #closeCropModalButton {
          position: absolute;
          top: 10px;
          right: 15px;
          background: none;
          border: none;
          font-size: 2.2em;
          color: var(--text-color-secondary);
          cursor: pointer;
          line-height: 1;
          padding: 5px;
          z-index: 1010;
      }
      .crop-modal-body { display: flex; gap: 20px; flex: 1; min-height: 0; }
      
      #cropImageContainer {
          position: relative;
          flex-basis: 70%;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          min-height: 300px;
          touch-action: none;
      }
      #textOverlayContainer {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none;
          overflow: visible;
      }
      .draggable-text {
          position: absolute;
          left: 0; top: 0;
          cursor: move;
          pointer-events: auto;
          padding: 2px 1px;
          border: 1px dashed rgba(127, 140, 141, 0.9);
          border-radius: 5px;
          white-space: nowrap;
          user-select: none;
          -webkit-user-select: none;
          display: inline-block;
          line-height: 1.2;
      }
      .draggable-text-content { outline: none; display: inline-block; }
      .draggable-text-close {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: sans-serif;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          color: white;
          background-color: var(--error-color);
          opacity: 0.8;
          transition: opacity 0.2s;
          z-index: 10;
      }
      .draggable-text-resizer {
          position: absolute;
          bottom: -8px;
          right: -8px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          cursor: nwse-resize;
          background-color: var(--primary-color);
          opacity: 0.8;
          transition: opacity 0.2s;
          z-index: 10;
      }
      .draggable-text:hover .draggable-text-close,
      .draggable-text:hover .draggable-text-resizer { opacity: 1; }
      
      #cropImageContainer img { max-width: 100%; max-height: 100%; }
      .crop-controls-panel {
          flex-basis: 30%;
          display: flex;
          flex-direction: column;
          text-align: left;
          min-height: 0;
      }
      .controls-scroller {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding: 5px 10px 5px 5px;
          margin-right: -10px;
      }
      
      .editor-tabs { display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 15px; }
      .tab-button {
          flex: 1;
          padding: 10px 15px;
          cursor: pointer;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 1em;
          font-weight: 600;
          color: var(--text-color-secondary);
          transition: all 0.2s ease-in-out;
      }
      .tab-button:hover { background-color: var(--preset-button-bg); }
      .tab-button.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
      .tab-pane { display: none; }
      .tab-pane.active { display: block; }

      .control-section { margin-bottom: 20px; }
      .control-section h4 { margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px; }
      .transform-buttons, .filter-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .control-section-button { background-color: var(--preset-button-bg); color: var(--text-color-primary); border: 1px solid var(--border-color); padding: 8px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; }
      
      .adjustment-slider .slider-label { display: flex; justify-content: space-between; font-size: 0.9em; }
      .text-controls .control-group { margin-bottom: 15px; }
      .text-controls .color-input-wrapper { display: flex; align-items: center; gap: 10px; }
      .text-controls input[type="color"] { padding: 0; height: 35px; width: 45px; border-radius: 5px;}
      
      .color-palette { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
      .color-swatch { width: 22px; height: 22px; border-radius: 50%; cursor: pointer; border: 2px solid var(--border-color); background-clip: content-box; padding: 2px; }
      .color-swatch.transparent { background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 10px 10px; background-position: 0 0, 0 5px, 5px -5px, -5px 0px; }

      input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: var(--preset-button-bg);
          border-radius: 5px;
          outline: none;
          padding: 0;
          margin: 0;
          border: none;
          cursor: pointer;
      }
      input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          background: var(--primary-color);
          cursor: pointer;
          border-radius: 50%;
          border: 3px solid var(--card-background-color);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      input[type="range"]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          background: var(--primary-color);
          cursor: pointer;
          border-radius: 50%;
          border: 3px solid var(--card-background-color);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .cropper-point { width: 14px; height: 14px; background-color: rgba(52, 152, 219, 0.9); border-radius: 50%; opacity: 1; }
      .cropper-point.point-se, .cropper-point.point-sw, .cropper-point.point-ne, .cropper-point.point-nw { width: 18px; height: 18px; }

      #togglePresetsButton { font-size: 0.9em; font-weight: 600; width: 100%; text-align: left; padding: 10px 15px; background: var(--preset-button-bg); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
      #togglePresetsButton .arrow-icon { transition: transform 0.3s ease; }
      #togglePresetsButton.open .arrow-icon { transform: rotate(180deg); }
      #presetsGridContainer { display: none; }
      .preset-buttons-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(70px, 1fr)); gap: 8px; margin-top: 8px; }
      .preset-button { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 5px; font-size: 0.75em; background-color: var(--preset-button-bg); border: 1.5px solid var(--preset-button-border); border-radius: calc(var(--border-radius) - 4px); cursor: pointer; transition: background-color 0.2s, border-color 0.2s; min-height: 65px; text-align: center; }
      .preset-button:hover { background-color: var(--preset-button-active-bg); border-color: #adb5bd; }
      .preset-button.active { border-color: var(--primary-color); background-color: rgba(52, 152, 219, 0.1); font-weight: 600; box-shadow: 0 0 0 1.5px var(--primary-color); }
      .preset-button .icon-shape { display: block; background-color: var(--preset-icon-color); margin-bottom: 4px; box-sizing: content-box; border-radius: 1px; }
      .preset-button.active .icon-shape { background-color: var(--primary-color); }
      .icon-shape.original-shape { width: 22px; height: 28px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='O O 24 24'%3E%3Cpath fill='%236c757d' d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7h-2v2h2v-2zm0-4h-2v2h2V7z'/%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: transparent;}
      body.dark-mode .preset-button:not(.active) .icon-shape.original-shape { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23bdc3c7' d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7h-2v2h2v-2zm0-4h-2v2h2V7z'/%3E%3C/svg%3E");}
      .preset-button.active .icon-shape.original-shape { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%233498db' d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7h-2v2h2v-2zm0-4h-2v2h2V7z'/%3E%3C/svg%3E");}
      .icon-shape.ratio-1-1 { width: 22px; height: 22px; } .icon-shape.ratio-16-9 { width: 28px; height: 16px; } .icon-shape.ratio-9-16 { width: 16px; height: 28px; }
      .icon-shape.ratio-4-3 { width: 24px; height: 18px; } .icon-shape.ratio-3-4 { width: 18px; height: 24px; } .icon-shape.ratio-3-2 { width: 27px; height: 18px; } .icon-shape.ratio-2-3 { width: 18px; height: 27px; }
      .preset-label { display: block; font-size: 1em; color: var(--text-color-primary); line-height: 1.2; }
      
      .modal-action-buttons {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: row;
          gap: 15px;
          justify-content: flex-end;
      }
      .modal-action-buttons .action-button { width: auto; padding: 10px 20px; font-size: 1em; }

      @media (max-width: 768px) {
          .crop-modal-body { flex-direction: column; }
          #cropImageContainer { min-height: 250px; flex-basis: 50%; }
          .crop-controls-panel { flex-basis: 50%; }
          .modal-action-buttons { justify-content: space-between; }
          .modal-action-buttons .action-button { flex-grow: 1; }
      }
    </style>
  </head>
  <body>
    <div class="resizer-container">
      <header class="header-container">
        <div class="resizer-header">
          <h1>Advanced Image Resizer</h1>
          <p>Optimize, crop, and resize your images with precision.</p>
        </div>
        <button id="darkModeToggle" title="Toggle Dark Mode">
          <i class="fa-solid fa-moon"></i>
        </button>
      </header>
      
      <div class="upload-area" id="uploadAreaElement">
        <input type="file" id="imageUploadInputElement">
        <div class="upload-content">
            <i class="fas fa-cloud-upload-alt upload-icon"></i>
            <span class="upload-text">Select or Drop Image Here</span>
            <div id="fileNameDisplay">Max 15MB. PNG, JPG, WEBP supported.</div>
        </div>
      </div>

      <div id="crop-preview-container" style="display: none;">
        <div class="image-preview-box">
          <h3>Image Preview</h3>
          <img id="cropPreviewImage" src="#" alt="Image Preview" />
        </div>
        <button
          class="action-button"
          id="openCropModalButton"
          style="margin-top: 15px;"
        >
          <i class="fas fa-edit"></i> Edit Image
        </button>
      </div>

      <div
        class="image-details"
        id="originalImageInfoElement"
        style="display: none;"
      >
        Original - Dimensions: <span id="originalDimensionsSpan"></span> | Type:
        <span id="originalTypeSpan"></span> | Size:
        <span id="originalSizeSpan"></span>
      </div>

      <div class="controls-form" id="controlsFormElement" style="display:none;">
        <div class="dimension-controls">
          <div class="control-group">
            <label for="targetWidthInput">Width</label
            ><input type="number" id="targetWidthInput" placeholder="Auto" />
          </div>
          <div class="control-group">
            <label for="targetHeightInput">Height</label
            ><input type="number" id="targetHeightInput" placeholder="Auto" />
          </div>
          <div class="control-group unit-selector">
            <label for="dimensionUnitSelect">Unit</label
            ><select id="dimensionUnitSelect">
              <option value="px" selected>px</option>
              <option value="in">in</option>
              <option value="cm">cm</option>
              <option value="mm">mm</option>
            </select>
          </div>
        </div>
        <div id="dpiControlGroup" class="control-group" style="display: none;">
          <label for="dpiInput">DPI</label
          ><input type="number" id="dpiInput" value="300" min="10" />
        </div>
        <div class="checkbox-control">
          <input type="checkbox" id="aspectRatioCheckboxInput" checked /><label
            for="aspectRatioCheckboxInput"
            >Maintain aspect ratio</label
          >
        </div>

        <div id="aspectRatioPresetsContainerElement" style="display: none;">
          <button id="togglePresetsButton">
            <span>Aspect Ratio Presets</span>
            <i class="fas fa-chevron-down arrow-icon"></i>
          </button>
          <div id="presetsGridContainer">
            <div class="preset-buttons-grid">
              <button
                type="button"
                class="preset-button"
                data-ratio-value="original"
              >
                <span class="icon-shape original-shape"></span
                ><span class="preset-label">Original</span>
              </button>
              <button
                type="button"
                class="preset-button"
                data-ratio-value="1/1"
              >
                <span class="icon-shape ratio-1-1"></span
                ><span class="preset-label">1:1</span>
              </button>
              <button
                type="button"
                class="preset-button"
                data-ratio-value="16/9"
              >
                <span class="icon-shape ratio-16-9"></span
                ><span class="preset-label">16:9</span>
              </button>
              <button
                type="button"
                class="preset-button"
                data-ratio-value="9/16"
              >
                <span class="icon-shape ratio-9-16"></span
                ><span class="preset-label">9:16</span>
              </button>
              <button
                type="button"
                class="preset-button"
                data-ratio-value="4/3"
              >
                <span class="icon-shape ratio-4-3"></span
                ><span class="preset-label">4:3</span>
              </button>
              <button
                type="button"
                class="preset-button"
                data-ratio-value="3/4"
              >
                <span class="icon-shape ratio-3-4"></span
                ><span class="preset-label">3:4</span>
              </button>
              <button
                type="button"
                class="preset-button"
                data-ratio-value="3/2"
              >
                <span class="icon-shape ratio-3-2"></span
                ><span class="preset-label">3:2</span>
              </button>
              <button
                type="button"
                class="preset-button"
                data-ratio-value="2/3"
              >
                <span class="icon-shape ratio-2-3"></span
                ><span class="preset-label">2:3</span>
              </button>
            </div>
          </div>
        </div>

        <hr
          style="border: none; border-top: 1px solid var(--border-color); margin: 5px 0;"
        />
        <div class="control-group">
          <label for="outputFormatSelectElement">Output Format</label
          ><select id="outputFormatSelectElement">
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WEBP</option>
            <option value="source">Keep Original</option>
          </select>
        </div>
        <div
          class="control-group quality-control"
          id="qualityControlGroupElement"
        >
          <label for="qualityRangeSliderElement"
            >Quality (for JPEG/WEBP):
            <span id="qualityValueSpanElement">100</span>
            <span id="estimatedSizeSpanElement" style="font-weight: normal; color: var(--text-color-secondary); margin-left: 10px;"></span>
          </label>
          <input
            type="range"
            id="qualityRangeSliderElement"
            min="1"
            max="100"
            step="1"
            value="100"
          />
        </div>
        <div class="target-size-controls" id="targetFileSizeGroupElement">
          <div class="control-group">
            <label for="targetFileSizeInput">Target File Size (Optional)</label
            ><input
              type="number"
              id="targetFileSizeInput"
              placeholder="e.g., 200"
            />
          </div>
          <div class="control-group unit-selector">
            <label>&nbsp;</label
            ><select id="fileSizeUnitSelectElement">
              <option value="KB">KB</option>
              <option value="MB">MB</option>
            </select>
          </div>
        </div>
        <div class="info-text">
          For PNG, only dimensions are reduced. For JPG/WEBP, quality and
          dimensions are adjusted.
        </div>
      </div>

      <button class="action-button" id="processImageButtonElement" disabled>
        <i class="fas fa-cogs"></i> Resize & Optimize
      </button>

      <div class="preview-area">
        <div
          class="preview-box"
          id="resizedPreviewBoxElement"
          style="display:none;"
        >
          <h3>Resized Preview</h3>
          <canvas id="previewCanvasElement"></canvas>
          <div id="resizedImageInfoElement" class="size-info"></div>
          <button
            class="action-button"
            id="downloadButtonElement"
            style="display: none;"
          >
            <i class="fas fa-download"></i> Download Image
          </button>
        </div>
      </div>
      <div id="appMessageElement" class="app-message"></div>
    </div>

    <div class="crop-modal-overlay" id="cropModal">
      <div class="crop-modal-content">
        <button id="closeCropModalButton">&times;</button>
        <div class="crop-modal-body">
          <div id="cropImageContainer">
            <img id="imageToCrop" src="" alt="Image to crop" />
            <div id="textOverlayContainer"></div>
          </div>
          <div class="crop-controls-panel">
            <div class="editor-tabs">
                <button class="tab-button active" data-tab="crop-tab"><i class="fas fa-crop-simple"></i> Crop</button>
                <button class="tab-button" data-tab="adjust-tab"><i class="fas fa-sliders"></i> Adjust</button>
                <button class="tab-button" data-tab="text-tab"><i class="fas fa-font"></i> Text</button>
            </div>
            <div class="controls-scroller">
                <div id="crop-tab" class="tab-pane active">
                    <div class="control-section">
                      <h4>Transform</h4>
                      <div class="transform-buttons">
                        <button id="rotateLeftButton" class="control-section-button">
                          <i class="fas fa-rotate-left"></i> Rotate Left
                        </button>
                        <button id="rotateRightButton" class="control-section-button">
                          <i class="fas fa-rotate-right"></i> Rotate Right
                        </button>
                        <button id="flipHorizontalButton" class="control-section-button">
                          <i class="fas fa-arrows-left-right"></i> Flip H
                        </button>
                        <button id="flipVerticalButton" class="control-section-button">
                          <i class="fas fa-arrows-up-down"></i> Flip V
                        </button>
                      </div>
                    </div>
                </div>

                <div id="adjust-tab" class="tab-pane">
                     <div class="control-section">
                      <h4>Adjustments</h4>
                      <div class="adjustment-slider">
                        <div class="slider-label">
                          <span>Brightness</span><span id="brightnessValue">100%</span>
                        </div>
                        <input
                          type="range"
                          id="brightnessSlider"
                          min="0"
                          max="200"
                          value="100"
                        />
                      </div>
                      <div class="adjustment-slider">
                        <div class="slider-label">
                          <span>Contrast</span><span id="contrastValue">100%</span>
                        </div>
                        <input
                          type="range"
                          id="contrastSlider"
                          min="0"
                          max="200"
                          value="100"
                        />
                      </div>
                      <div class="adjustment-slider">
                        <div class="slider-label">
                          <span>Saturation</span><span id="saturationValue">100%</span>
                        </div>
                        <input
                          type="range"
                          id="saturationSlider"
                          min="0"
                          max="200"
                          value="100"
                        />
                      </div>
                    </div>
                    <div class="control-section">
                      <h4>Filters</h4>
                      <div class="filter-buttons">
                        <button id="grayscaleButton" class="control-section-button">Grayscale</button>
                        <button id="sepiaButton" class="control-section-button">Sepia</button>
                      </div>
                    </div>
                </div>

                <div id="text-tab" class="tab-pane">
                    <div class="control-section text-controls">
                        <h4>Add Text to Image</h4>
                        <div class="control-group">
                            <label for="textInput">Text</label>
                            <input type="text" id="textInput" placeholder="Start typing here...">
                        </div>
                        <div class="control-group">
                            <label for="textColorInput">Text Color</label>
                            <div class="color-input-wrapper">
                               <input type="color" id="textColorInput" value="#FFFFFF">
                               <input type="text" id="textColorHex" value="#FFFFFF" style="flex:1;">
                            </div>
                            <div class="color-palette" id="textColorPalette"></div>
                        </div>
                        <div class="control-group">
                            <label for="textBgColorInput">Background Color</label>
                            <div class="color-input-wrapper">
                               <input type="color" id="textBgColorInput" value="#000000">
                               <input type="text" id="textBgColorHex" value="#000000" style="flex:1;">
                            </div>
                            <div class="color-palette" id="textBgColorPalette"></div>
                        </div>
                         <div class="control-group">
                            <label for="fontSizeInput">Font Size</label>
                            <input type="range" id="fontSizeInput" min="10" max="120" value="24">
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
        <div class="modal-action-buttons">
              <button id="resetAdjustmentsButton" class="action-button" style="background-color: var(--text-color-secondary);">
                <i class="fas fa-undo"></i> Reset
              </button>
              <button
                class="action-button"
                id="applyCropButton"
                style="background-color: var(--secondary-color);"
              >
                <i class="fas fa-check"></i> Apply Changes
              </button>
        </div>
      </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
              const ui = {};
              const mapUIElements = () => {
                  const ids = [
                      'imageUploadInputElement', 'uploadAreaElement', 'fileNameDisplay', 'originalImageInfoElement',
                      'originalDimensionsSpan', 'originalTypeSpan', 'originalSizeSpan', 'controlsFormElement',
                      'targetWidthInput', 'targetHeightInput', 'aspectRatioCheckboxInput', 'qualityControlGroupElement',
                      'qualityRangeSliderElement', 'qualityValueSpanElement', 'outputFormatSelectElement', 'estimatedSizeSpanElement',
                      'targetFileSizeInput', 'fileSizeUnitSelectElement', 'targetFileSizeGroupElement',
                      'processImageButtonElement', 'resizedPreviewBoxElement', 'previewCanvasElement',
                      'resizedImageInfoElement', 'appMessageElement', 'dimensionUnitSelect', 'dpiControlGroup',
                      'dpiInput', 'aspectRatioPresetsContainerElement', 'togglePresetsButton', 'presetsGridContainer',
                      'crop-preview-container', 'cropPreviewImage', 'openCropModalButton', 'cropModal', 'imageToCrop',
                      'applyCropButton', 'closeCropModalButton', 'downloadButtonElement',
                      'darkModeToggle', 'rotateLeftButton', 'rotateRightButton', 'flipHorizontalButton', 'flipVerticalButton',
                      'brightnessSlider', 'contrastSlider', 'saturationSlider', 'brightnessValue', 'contrastValue',
                      'saturationValue', 'grayscaleButton', 'sepiaButton', 'resetAdjustmentsButton',
                      'textOverlayContainer', 'textInput', 'textColorInput', 'textColorHex',
                      'textBgColorInput', 'textBgColorHex', 'fontSizeInput', 'textColorPalette', 'textBgColorPalette'
                  ];
                  ids.forEach(id => ui[id.replace(/-(\w)/g, (_, p1) => p1.toUpperCase())] = document.getElementById(id));
                  ui.presetButtons = document.querySelectorAll('.preset-button');
                  ui.tabButtons = document.querySelectorAll('.tab-button');
                  ui.tabPanes = document.querySelectorAll('.tab-pane');
                  return true;
              };
              if (!mapUIElements()) return;

              let loadedSourceImageObject = new Image();
              let originalRawFile = null, sourceImageWidth = 0, sourceImageHeight = 0, sourceImageType = '', sourceImageAspectRatio = 1, currentAppliedAspectRatio = 1;
              let cropper = null;
              let finalImageBlob = null, finalImageFilename = '';
              let currentUnit = 'px';
              let flipState = { h: 1, v: 1 };
              const defaultAdjustments = { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0 };
              let currentAdjustments = { ...defaultAdjustments };
              
              let editorState = { text: null };
              let editedImageWithoutText = null;

              const debounce = (func, delay) => { let timeoutId; return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => { func.apply(this, args); }, delay); }; };
              
              const rgbToHex = (rgb) => {
                  if (!rgb || typeof rgb !== 'string' || rgb.startsWith('#')) return rgb;
                  if (rgb === 'transparent') return 'transparent';
                  const result = rgb.match(/\d+/g);
                  if (!result || result.length < 3) return '#000000';
                  return '#' + result.slice(0, 3).map(x => {
                      const hexValue = parseInt(x).toString(16);
                      return hexValue.length === 1 ? '0' + hexValue : hexValue;
                  }).join('');
              };

              ui.tabButtons.forEach(button => {
                  button.addEventListener('click', () => {
                      ui.tabButtons.forEach(btn => btn.classList.remove('active'));
                      ui.tabPanes.forEach(pane => pane.classList.remove('active'));
                      button.classList.add('active');
                      document.getElementById(button.dataset.tab).classList.add('active');
                  });
              });

              const setupDarkMode = () => {
                  const darkModeIcon = ui.darkModeToggle.querySelector('i');
                  const applyDarkMode = (isDark) => { document.body.classList.toggle('dark-mode', isDark); darkModeIcon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'; localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled'); };
                  ui.darkModeToggle.addEventListener('click', () => applyDarkMode(!document.body.classList.contains('dark-mode')));
                  if (localStorage.getItem('darkMode') === 'enabled') applyDarkMode(true);
              };
              setupDarkMode();

              async function updateEstimatedSize() {
                  const format = ui.outputFormatSelectElement.value;
                  if (!originalRawFile || (format !== 'image/jpeg' && format !== 'image/webp')) {
                      ui.estimatedSizeSpanElement.textContent = '';
                      return;
                  }
                  ui.estimatedSizeSpanElement.textContent = '...';
                  try {
                      let width = toPixels(ui.targetWidthInput.value, currentUnit) || sourceImageWidth;
                      let height = toPixels(ui.targetHeightInput.value, currentUnit) || sourceImageHeight;
                      if (ui.aspectRatioCheckboxInput.checked && currentAppliedAspectRatio > 0) {
                          if (width > 0 && ui.targetWidthInput.value && !ui.targetHeightInput.value) height = Math.round(width / currentAppliedAspectRatio);
                          else if (height > 0 && ui.targetHeightInput.value && !ui.targetWidthInput.value) width = Math.round(height * currentAppliedAspectRatio);
                      }
                      const quality = parseFloat(ui.qualityRangeSliderElement.value) / 100;
                      const mimeType = format;
                      const tempCanvas = document.createElement('canvas');
                      tempCanvas.width = Math.max(width, 1); tempCanvas.height = Math.max(height, 1);
                      const ctx = tempCanvas.getContext('2d');
                      ctx.imageSmoothingQuality = 'high';
                      if (sourceImageType === 'image/png') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height); }
                      ctx.drawImage(loadedSourceImageObject, 0, 0, width, height);
                      const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, mimeType, quality));
                      if (blob) { ui.estimatedSizeSpanElement.textContent = `~ ${formatBytes(blob.size)}`; }
                      else { ui.estimatedSizeSpanElement.textContent = ''; }
                  } catch (error) { ui.estimatedSizeSpanElement.textContent = 'Error'; }
              }
              const debouncedUpdateEstimatedSize = debounce(updateEstimatedSize, 400);

              const preventDefaults = e => { e.preventDefault(); e.stopPropagation(); };
              ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => { document.body.addEventListener(evt, preventDefaults); ui.uploadAreaElement.addEventListener(evt, preventDefaults); });
              ui.uploadAreaElement.addEventListener('dragenter', () => ui.uploadAreaElement.classList.add('dragging-over'));
              ui.uploadAreaElement.addEventListener('dragleave', () => ui.uploadAreaElement.classList.remove('dragging-over'));
              ui.uploadAreaElement.addEventListener('drop', e => handleFileSelect(e.dataTransfer.files));
              ui.uploadAreaElement.addEventListener('click', () => ui.imageUploadInputElement.click());
              ui.imageUploadInputElement.addEventListener('change', e => handleFileSelect(e.target.files));
              ui.targetWidthInput.addEventListener('input', e => handleDimensionChange(e, true));
              ui.targetHeightInput.addEventListener('input', e => handleDimensionChange(e, true));
              ui.aspectRatioCheckboxInput.addEventListener('change', e => handleDimensionChange(e, false));
              ui.presetButtons.forEach(button => button.addEventListener('click', () => handleAspectRatioPresetClick(button)));
              ui.outputFormatSelectElement.addEventListener('change', handleFormatChange);

              const updateSliderTrack = (slider) => {
                  if (!slider) return;
                  const value = parseFloat(slider.value); const min = parseFloat(slider.min) || 0; const max = parseFloat(slider.max) || 100;
                  if (value === max) { slider.style.background = `var(--primary-color)`; }
                  else { const percentage = (value - min) / (max - min) * 100; slider.style.background = `linear-gradient(to right, var(--primary-color) ${percentage}%, var(--preset-button-bg) ${percentage}%)`; }
              };

              const allSliders = document.querySelectorAll('input[type="range"]');
              allSliders.forEach(slider => { slider.addEventListener('input', () => updateSliderTrack(slider)); updateSliderTrack(slider); });
              ui.qualityRangeSliderElement.addEventListener('input', () => { ui.qualityValueSpanElement.textContent = ui.qualityRangeSliderElement.value; debouncedUpdateEstimatedSize(); });

              ui.processImageButtonElement.addEventListener('click', processImage);
              ui.dimensionUnitSelect.addEventListener('change', handleUnitChange);
              ui.dpiInput.addEventListener('input', handleDpiChange);
              ui.openCropModalButton.addEventListener('click', openCropper);
              ui.closeCropModalButton.addEventListener('click', closeCropper);
              ui.applyCropButton.addEventListener('click', applyCropAndFilters);
              ui.downloadButtonElement.addEventListener('click', downloadFinalImage);

              ui.togglePresetsButton.addEventListener('click', () => {
                  const isOpen = ui.presetsGridContainer.style.display === 'block';
                  ui.presetsGridContainer.style.display = isOpen ? 'none' : 'block';
                  ui.togglePresetsButton.classList.toggle('open', !isOpen);
              });

              ui.rotateLeftButton.addEventListener('click', () => cropper?.rotate(-90));
              ui.rotateRightButton.addEventListener('click', () => cropper?.rotate(90));
              ui.flipHorizontalButton.addEventListener('click', () => { flipState.h *= -1; cropper?.scaleX(flipState.h); });
              ui.flipVerticalButton.addEventListener('click', () => { flipState.v *= -1; cropper?.scaleY(flipState.v); });
              ['brightness', 'contrast', 'saturation'].forEach(type => {
                  const slider = ui[`${type}Slider`];
                  slider.addEventListener('input', () => { currentAdjustments[type.replace('uration', 'urate')] = slider.value; updateLivePreviewFilters(); });
              });
              ui.grayscaleButton.addEventListener('click', () => { resetColorAdjustments(); currentAdjustments.grayscale = 100; updateLivePreviewFilters(); });
              ui.sepiaButton.addEventListener('click', () => { resetColorAdjustments(); currentAdjustments.sepia = 100; updateLivePreviewFilters(); });
              ui.resetAdjustmentsButton.addEventListener('click', () => {
                  cropper?.reset();
                  flipState = { h: 1, v: 1 }; cropper?.scaleX(1); cropper?.scaleY(1);
                  resetColorAdjustments(); updateLivePreviewFilters();
                  removeActiveText(true);
              });

              const removeActiveText = (resetState = false) => {
                  const activeTextElement = ui.textOverlayContainer.querySelector('.draggable-text');
                  if (activeTextElement) { activeTextElement.remove(); }
                  ui.textInput.value = '';
                  if(resetState) editorState.text = null;
              };
              
              const createOrUpdateText = (initialPos = null) => {
                const textValue = ui.textInput.value;
                let activeTextElement = ui.textOverlayContainer.querySelector('.draggable-text');
                
                if (!textValue && activeTextElement) {
                    removeActiveText(true);
                    return;
                }
                
                if (!activeTextElement && textValue) {
                    activeTextElement = document.createElement('div');
                    activeTextElement.className = 'draggable-text';
                    activeTextElement.innerHTML = `<span class="draggable-text-content">${textValue}</span>`;
                    
                    const closeBtn = document.createElement('div');
                    closeBtn.className = 'draggable-text-close';
                    closeBtn.innerHTML = '&times;';
                    
                    const resizer = document.createElement('div');
                    resizer.className = 'draggable-text-resizer';

                    activeTextElement.appendChild(closeBtn);
                    activeTextElement.appendChild(resizer);
                    ui.textOverlayContainer.appendChild(activeTextElement);
                    
                    setTimeout(() => {
                        if (initialPos && typeof initialPos.x !== 'undefined' && typeof initialPos.y !== 'undefined') {
                            activeTextElement.style.left = `${initialPos.x}px`;
                            activeTextElement.style.top = `${initialPos.y}px`;
                        } else {
                            const containerRect = ui.textOverlayContainer.getBoundingClientRect();
                            const textRect = activeTextElement.getBoundingClientRect();
                            activeTextElement.style.top = `${(containerRect.height / 2) - (textRect.height / 2)}px`;
                            activeTextElement.style.left = '10px';
                        }
                        updateEditorTextState();
                    }, 0);

                    attachTextEventListeners(activeTextElement);
                }
                
                if (activeTextElement) {
                    activeTextElement.querySelector('.draggable-text-content').textContent = textValue;
                    activeTextElement.style.fontSize = `${ui.fontSizeInput.value}px`;
                    activeTextElement.style.color = ui.textColorInput.value;
                    activeTextElement.style.backgroundColor = ui.textBgColorInput.dataset.isDefault === 'true' ? 'transparent' : ui.textBgColorInput.value;
                    updateEditorTextState();
                }
            };
            
            const updateEditorTextState = () => {
                 const activeTextElement = ui.textOverlayContainer.querySelector('.draggable-text');
                 if (!activeTextElement) {
                    editorState.text = null;
                    return;
                 }
                 const bgColor = activeTextElement.style.backgroundColor;
                 editorState.text = {
                     content: activeTextElement.querySelector('.draggable-text-content').textContent,
                     x: activeTextElement.offsetLeft,
                     y: activeTextElement.offsetTop,
                     fontSize: parseInt(activeTextElement.style.fontSize, 10),
                     color: rgbToHex(activeTextElement.style.color),
                     bgColor: (bgColor === 'transparent' || !bgColor) ? 'transparent' : rgbToHex(bgColor)
                 };
            };
              
            ui.textInput.addEventListener('input', () => createOrUpdateText());
            ui.fontSizeInput.addEventListener('input', () => createOrUpdateText());
              
            const setupColorInputs = (colorInput, hexInput, palette, isBg) => {
                colorInput.addEventListener('input', e => { hexInput.value = e.target.value; if(isBg) colorInput.dataset.isDefault = 'false'; createOrUpdateText(); });
                hexInput.addEventListener('input', e => { colorInput.value = e.target.value; if(isBg) colorInput.dataset.isDefault = 'false'; createOrUpdateText(); });
                
                const colors = isBg 
                    ? ['transparent', '#FFFFFF', '#000000', '#3498db', '#e74c3c', '#2ecc71', '#f1c40f']
                    : ['#FFFFFF', '#000000', '#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6'];

                palette.innerHTML = '';
                colors.forEach(color => {
                    const swatch = document.createElement('div');
                    swatch.className = 'color-swatch';
                    if (color === 'transparent') {
                        swatch.classList.add('transparent');
                    } else {
                        swatch.style.backgroundColor = color;
                    }
                    swatch.addEventListener('click', () => {
                        if (isBg) {
                            colorInput.dataset.isDefault = color === 'transparent' ? 'true' : 'false';
                        }
                        const targetColor = color === 'transparent' ? '#000000' : color;
                        colorInput.value = targetColor;
                        hexInput.value = targetColor;
                        createOrUpdateText();
                    });
                    palette.appendChild(swatch);
                });
            };
            
            setupColorInputs(ui.textColorInput, ui.textColorHex, ui.textColorPalette, false);
            setupColorInputs(ui.textBgColorInput, ui.textBgColorHex, ui.textBgColorPalette, true);


             // =================================================================
             // === BUG FIX STARTS HERE / बग को यहाँ ठीक किया गया है ===
             // =================================================================
             function attachTextEventListeners(element) {
                const closeBtn = element.querySelector('.draggable-text-close');
                const resizer = element.querySelector('.draggable-text-resizer');

                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeActiveText(true);
                });

                let dragStartHandler = (e) => {
                    if (e.target.className.includes('draggable-text-close') || e.target.className.includes('draggable-text-resizer')) return;
                    e.preventDefault();
                    
                    let initialX = (e.touches ? e.touches[0].clientX : e.clientX) - element.offsetLeft;
                    let initialY = (e.touches ? e.touches[0].clientY : e.clientY) - element.offsetTop;

                    let moveHandler = (moveEvent) => {
                        moveEvent.preventDefault();
                        let newX = (moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX) - initialX;
                        let newY = (moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY) - initialY;
                        
                        const containerRect = ui.textOverlayContainer.getBoundingClientRect();
                        newX = Math.max(0, Math.min(newX, containerRect.width - element.offsetWidth));
                        newY = Math.max(0, Math.min(newY, containerRect.height - element.offsetHeight));
                        
                        element.style.left = `${newX}px`;
                        element.style.top = `${newY}px`;
                    };

                    let endHandler = () => {
                        document.removeEventListener('mousemove', moveHandler);
                        document.removeEventListener('touchmove', moveHandler);
                        document.removeEventListener('mouseup', endHandler);
                        document.removeEventListener('touchend', endHandler);
                        updateEditorTextState();
                    };
                    
                    document.addEventListener('mousemove', moveHandler);
                    document.addEventListener('touchmove', moveHandler, { passive: false });
                    document.addEventListener('mouseup', endHandler);
                    document.addEventListener('touchend', endHandler);
                };
                
                element.addEventListener('mousedown', dragStartHandler);
                element.addEventListener('touchstart', dragStartHandler, { passive: false });
                
                let resizeStartHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Prevents event from causing other issues.
                    
                    let startX = e.touches ? e.touches[0].clientX : e.clientX;
                    let startSize = parseInt(window.getComputedStyle(element).fontSize, 10);
                    
                    let resizeMoveHandler = (moveEvent) => {
                        let currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
                        let dx = currentX - startX;
                        let newSize = Math.round(startSize + dx * 0.5);
                        newSize = Math.max(10, Math.min(newSize, 120));
                        ui.fontSizeInput.value = newSize;
                        element.style.fontSize = `${newSize}px`;
                        updateSliderTrack(ui.fontSizeInput);
                    };
                    
                    let resizeEndHandler = () => {
                        document.removeEventListener('mousemove', resizeMoveHandler);
                        document.removeEventListener('touchmove', resizeMoveHandler);
                        document.removeEventListener('mouseup', resizeEndHandler);
                        document.removeEventListener('touchend', resizeEndHandler);
                        updateEditorTextState();
                    };
                    
                    // Listen on the WHOLE DOCUMENT for move and up events.
                    document.addEventListener('mousemove', resizeMoveHandler);
                    document.addEventListener('touchmove', resizeMoveHandler, { passive: false });
                    document.addEventListener('mouseup', resizeEndHandler);
                    document.addEventListener('touchend', resizeEndHandler);
                };
                
                // The bug was caused by incorrect listeners being attached here.
                // This is the corrected version.
                resizer.addEventListener('mousedown', resizeStartHandler);
                resizer.addEventListener('touchstart', resizeStartHandler, { passive: false });
            }
            // =================================================================
            // === BUG FIX ENDS HERE / बग यहीं पर ठीक हो गया है ===
            // =================================================================


              async function handleFileSelect(files) {
                  if (!files?.[0]) return; const file = files[0];
                  
                  editorState = { text: null };
                  editedImageWithoutText = null;

                  const fNameLower = file.name.toLowerCase();
                  const allowedTypes = {'image/png':1, 'image/jpeg':1, 'image/webp':1};
                  const fileType = allowedTypes[file.type] ? file.type : (/\.(jpe?g)$/.test(fNameLower) ? 'image/jpeg' : (/\.png$/.test(fNameLower) ? 'image/png' : (/\.webp$/.test(fNameLower) ? 'image/webp' : null)));

                  if (!fileType) { showAppMessage("Unsupported file type.", "error"); return; }
                  if (file.size > 15 * 1024 * 1024) { showAppMessage("File too large (Max 15MB).", "error"); return; }

                  resetUIForNewUpload();
                  originalRawFile = file; sourceImageType = fileType;
                  ui.fileNameDisplay.textContent = file.name;

                  const reader = new FileReader();
                  reader.onload = e => {
                      loadedSourceImageObject.src = e.target.result;
                      ui.cropPreviewImage.src = e.target.result;
                      loadedSourceImageObject.onload = () => {
                          sourceImageWidth = loadedSourceImageObject.width;
                          sourceImageHeight = loadedSourceImageObject.height;
                          sourceImageAspectRatio = sourceImageWidth / sourceImageHeight;
                          currentAppliedAspectRatio = sourceImageAspectRatio;
                          updateUIDimensions(sourceImageWidth, sourceImageHeight, file.size);
                          ['originalImageInfoElement', 'controlsFormElement', 'cropPreviewContainer', 'aspectRatioPresetsContainerElement'].forEach(id => ui[id.replace(/-(\w)/g, (_, p1) => p1.toUpperCase())].style.display = id.includes('Form') ? 'flex' : 'block');
                          ui.processImageButtonElement.disabled = false;
                          document.querySelector('.preset-button[data-ratio-value="original"]')?.classList.add('active');
                          updateSliderTrack(ui.qualityRangeSliderElement);
                          updateEstimatedSize();
                      };
                  };
                  reader.readAsDataURL(file);
              }

              function getDPI() { const val = parseFloat(ui.dpiInput.value); return !isNaN(val) && val >= 10 ? val : 96; }
              function toPixels(val, unit) { if (String(val).trim() === '' || isNaN(parseFloat(val))) return 0; val = parseFloat(val); const dpi = getDPI(); switch(unit) { case 'in': return Math.round(val * dpi); case 'cm': return Math.round(val * dpi / 2.54); case 'mm': return Math.round(val * dpi / 25.4); default: return Math.round(val); } }
              function fromPixels(pixels, unit) { if (isNaN(parseFloat(pixels))) return ''; pixels = parseFloat(pixels); let val; const dpi = getDPI(); switch(unit) { case 'in': val = pixels / dpi; break; case 'cm': val = pixels * 2.54 / dpi; break; case 'mm': val = pixels * 25.4 / dpi; break; default: val = pixels; break; } return unit === 'px' ? Math.round(val) : parseFloat(val.toFixed(2)); }

              function handleDpiChange() { if (currentUnit !== 'px') handleDimensionChange(null, false); }
              function handleUnitChange() {
                  const newUnit = ui.dimensionUnitSelect.value;
                  ui.dpiControlGroup.style.display = newUnit === 'px' ? 'none' : 'block';
                  if (newUnit === currentUnit) return;
                  const widthPx = toPixels(ui.targetWidthInput.value, currentUnit);
                  const heightPx = toPixels(ui.targetHeightInput.value, currentUnit);
                  currentUnit = newUnit;
                  ui.targetWidthInput.value = fromPixels(widthPx, newUnit) || '';
                  ui.targetHeightInput.value = fromPixels(heightPx, newUnit) || '';
                  debouncedUpdateEstimatedSize();
              }
              function updateUIDimensions(width, height, size = null) {
                  ui.targetWidthInput.value = fromPixels(width, currentUnit);
                  ui.targetHeightInput.value = fromPixels(height, currentUnit);
                  if (size) {
                      ui.originalDimensionsSpan.textContent = `${width}x${height}`;
                      ui.originalTypeSpan.textContent = sourceImageType.replace('image/', '').toUpperCase();
                      ui.originalSizeSpan.textContent = formatBytes(size);
                  }
              }
              function handleDimensionChange(e, isManualInput) {
                  if (isManualInput) { ui.presetButtons.forEach(btn => btn.classList.remove('active')); ui.togglePresetsButton.classList.remove('open'); ui.presetsGridContainer.style.display = 'none'; }
                  if (ui.aspectRatioCheckboxInput.checked && currentAppliedAspectRatio > 0 && e) {
                      const changedEl = e.target;
                      const isWidthChanged = changedEl.id === 'targetWidthInput';
                      const otherEl = isWidthChanged ? ui.targetHeightInput : ui.targetWidthInput;
                      const changedVal = toPixels(parseFloat(changedEl.value), currentUnit);
                      if (!isNaN(changedVal) && changedVal > 0) { const otherVal = isWidthChanged ? changedVal / currentAppliedAspectRatio : changedVal * currentAppliedAspectRatio; otherEl.value = fromPixels(Math.round(otherVal), currentUnit); }
                  }
                  debouncedUpdateEstimatedSize();
              }
              function handleAspectRatioPresetClick(button) {
                  if (!originalRawFile || sourceImageWidth <= 0) { showAppMessage("Please upload an image first.", "info"); return; }
                  ui.presetButtons.forEach(btn => btn.classList.remove('active'));
                  button.classList.add('active'); ui.aspectRatioCheckboxInput.checked = true;
                  const ratioStr = button.dataset.ratioValue;
                  let targetWidthPx = toPixels(ui.targetWidthInput.value, currentUnit) || sourceImageWidth;
                  let targetHeightPx;
                  if (ratioStr === "original") { currentAppliedAspectRatio = sourceImageAspectRatio; }
                  else { const parts = ratioStr.split('/').map(Number); currentAppliedAspectRatio = parts.length === 2 && parts[1] !== 0 ? parts[0] / parts[1] : sourceImageAspectRatio; }
                  targetHeightPx = Math.round(targetWidthPx / currentAppliedAspectRatio);
                  ui.targetWidthInput.value = fromPixels(targetWidthPx, currentUnit);
                  ui.targetHeightInput.value = fromPixels(targetHeightPx, currentUnit);
                  debouncedUpdateEstimatedSize();
              }
              function updateLivePreviewFilters() {
                  const { brightness, contrast, saturate, grayscale, sepia } = currentAdjustments;
                  const filterValue = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) grayscale(${grayscale}%) sepia(${sepia}%)`;
                  const cropperViewBoxImage = document.querySelector('#cropImageContainer .cropper-view-box img');
                  if (cropperViewBoxImage) { cropperViewBoxImage.style.filter = filterValue; }
                  ui.brightnessValue.textContent = `${brightness}%`; ui.brightnessSlider.value = brightness;
                  ui.contrastValue.textContent = `${contrast}%`; ui.contrastSlider.value = contrast;
                  ui.saturationValue.textContent = `${saturate}%`; ui.saturationSlider.value = saturate;
                  allSliders.forEach(s => updateSliderTrack(s));
              }
              function resetColorAdjustments() { currentAdjustments = { ...defaultAdjustments }; }

              function openCropper() {
                  if (!loadedSourceImageObject.src || !window.Cropper) return;
                  ui.textBgColorInput.dataset.isDefault = 'true';
                  
                  ui.imageToCrop.src = editedImageWithoutText || loadedSourceImageObject.src;
                  
                  ui.cropModal.classList.add('visible');
                  if (cropper) cropper.destroy();
                  cropper = new Cropper(ui.imageToCrop, {
                      viewMode: 1, dragMode: 'move', background: false, autoCropArea: 1, responsive: true, cropBoxMovable: true, cropBoxResizable: true,
                      ready: function () {
                          resetColorAdjustments();
                          updateLivePreviewFilters();
                          const containerData = this.cropper.getContainerData();
                          ui.textOverlayContainer.style.width = containerData.width + 'px';
                          ui.textOverlayContainer.style.height = containerData.height + 'px';
                          
                          if (editorState.text) {
                            recreateTextFromState();
                          }
                      }
                  });
                  flipState = { h: 1, v: 1 };
              }
              
              function recreateTextFromState() {
                  if (!editorState.text) return;
                  ui.textInput.value = editorState.text.content;
                  ui.fontSizeInput.value = editorState.text.fontSize;
                  
                  ui.textColorInput.value = editorState.text.color;
                  ui.textColorHex.value = editorState.text.color;
                  
                  const isBgTransparent = editorState.text.bgColor === 'transparent';
                  ui.textBgColorInput.dataset.isDefault = isBgTransparent.toString();
                  const colorForPicker = isBgTransparent ? '#000000' : editorState.text.bgColor;
                  ui.textBgColorInput.value = colorForPicker;
                  ui.textBgColorHex.value = colorForPicker;

                  updateSliderTrack(ui.fontSizeInput);
                  
                  createOrUpdateText({ x: editorState.text.x, y: editorState.text.y });
              }

              function closeCropper() {
                  ui.cropModal.classList.remove('visible');
                  removeActiveText(false);
                  if (cropper) { cropper.destroy(); cropper = null; }
              }
              
              function applyCropAndFilters() {
                  if (!cropper) return;
                  const activeTextElement = ui.textOverlayContainer.querySelector('.draggable-text');
                  if (activeTextElement) updateEditorTextState();

                  const croppedCanvas = cropper.getCroppedCanvas({ imageSmoothingQuality: 'high' });
                  const finalCanvas = document.createElement('canvas');
                  const ctx = finalCanvas.getContext('2d');
                  finalCanvas.width = croppedCanvas.width;
                  finalCanvas.height = croppedCanvas.height;
                  const cropperViewBoxImage = document.querySelector('#cropImageContainer .cropper-view-box img');
                  if (cropperViewBoxImage && cropperViewBoxImage.style.filter) { ctx.filter = cropperViewBoxImage.style.filter; }
                  ctx.drawImage(croppedCanvas, 0, 0);
                  
                  editedImageWithoutText = finalCanvas.toDataURL(sourceImageType);

                  if (editorState.text && activeTextElement) {
                      const textState = editorState.text;
                      const cropBoxData = cropper.getCropBoxData();
                      const scale = croppedCanvas.width / cropBoxData.width;

                      ctx.filter = 'none';
                      const scaledFontSize = textState.fontSize * scale;
                      ctx.font = `${scaledFontSize}px ${getComputedStyle(document.body).fontFamily}`;
                      
                      const textMetrics = ctx.measureText(textState.content);
                      const horizontalPadding = 2 * scale;
                      const bgWidth = textMetrics.width + (horizontalPadding * 2);

                      const verticalPaddingRatio = 1.3;
                      const bgHeight = scaledFontSize * verticalPaddingRatio;

                      const originalDivCenterY = (textState.y + activeTextElement.offsetHeight / 2 - cropBoxData.top) * scale;
                      const originalDivCenterX = (textState.x + activeTextElement.offsetWidth / 2 - cropBoxData.left) * scale;
                      
                      const bgX = originalDivCenterX - (bgWidth / 2);
                      const bgY = originalDivCenterY - (bgHeight / 2);

                      if (textState.bgColor && textState.bgColor !== 'transparent') {
                          ctx.fillStyle = textState.bgColor;
                          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
                      }
                      
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      
                      const textDrawX = bgX + bgWidth / 2;
                      const textDrawY = bgY + bgHeight / 2 + (scaledFontSize * 0.1);

                      ctx.fillStyle = textState.color;
                      ctx.fillText(textState.content, textDrawX, textDrawY);
                  }
                  
                  loadedSourceImageObject.src = finalCanvas.toDataURL(sourceImageType);
                  ui.cropPreviewImage.src = loadedSourceImageObject.src;
                  loadedSourceImageObject.onload = () => {
                      sourceImageWidth = loadedSourceImageObject.width; sourceImageHeight = loadedSourceImageObject.height;
                      sourceImageAspectRatio = sourceImageWidth / sourceImageHeight; currentAppliedAspectRatio = sourceImageAspectRatio;
                      updateUIDimensions(sourceImageWidth, sourceImageHeight);
                      ui.presetButtons.forEach(btn => btn.classList.remove('active'));
                      document.querySelector('.preset-button[data-ratio-value="original"]')?.classList.add('active');
                      updateEstimatedSize();
                  };
                  closeCropper();
              }
              function handleFormatChange() {
                  const format = ui.outputFormatSelectElement.value;
                  ui.qualityControlGroupElement.style.display = (format === 'image/jpeg' || format === 'image/webp') ? 'block' : 'none';
                  ui.targetFileSizeGroupElement.style.display = (format === 'source') ? 'none' : 'flex';
                  updateEstimatedSize();
              }
              function resetUIForNewUpload() {
                  ui.processImageButtonElement.disabled = true;
                  ['controlsFormElement', 'originalImageInfoElement', 'cropPreviewContainer', 'resizedPreviewBoxElement', 'downloadButtonElement', 'aspectRatioPresetsContainerElement'].forEach(id => ui[id.replace(/-(\w)/g, (_, p1) => p1.toUpperCase())].style.display = 'none');
                  ui.presetButtons.forEach(btn => btn.classList.remove('active'));
                  ui.fileNameDisplay.textContent = "Max 15MB. PNG, JPG, WEBP supported.";
                  ui.targetWidthInput.value = ''; ui.targetHeightInput.value = '';
                  if (ui.estimatedSizeSpanElement) ui.estimatedSizeSpanElement.textContent = '';
                  showAppMessage("", "");
              }
              async function processImage() {
                  ui.processImageButtonElement.disabled = true;
                  ui.processImageButtonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                  showAppMessage("Resizing your image...", "info");
                  let initialW = toPixels(ui.targetWidthInput.value, currentUnit) || sourceImageWidth;
                  let initialH = toPixels(ui.targetHeightInput.value, currentUnit) || sourceImageHeight;
                  if (ui.aspectRatioCheckboxInput.checked && currentAppliedAspectRatio > 0) { if (initialW > 0) initialH = Math.round(initialW / currentAppliedAspectRatio); else if(initialH > 0) initialW = Math.round(initialH * currentAppliedAspectRatio); }
                  const outputMimeType = ui.outputFormatSelectElement.value === 'source' ? sourceImageType : ui.outputFormatSelectElement.value;
                  let targetSizeInBytes = 0;
                  const targetSizeVal = parseFloat(ui.targetFileSizeInput.value);
                  if (!isNaN(targetSizeVal) && targetSizeVal > 0 && outputMimeType !== 'source') { targetSizeInBytes = (ui.fileSizeUnitSelectElement.value === 'MB' ? targetSizeVal * 1024 * 1024 : targetSizeVal * 1024); }
                  try {
                      let resultBlob, resultWidth, resultHeight;
                      if (targetSizeInBytes > 0 && (outputMimeType === 'image/jpeg' || outputMimeType === 'image/webp')) { const result = await processToTargetSize(initialW, initialH, targetSizeInBytes, outputMimeType); resultBlob = result.blob; resultWidth = result.width; resultHeight = result.height; }
                      else { const result = await processToDimensions(initialW, initialH, outputMimeType); resultBlob = result.blob; resultWidth = result.width; resultHeight = result.height; }
                      finalImageBlob = resultBlob;
                      const fNameBase = originalRawFile.name.substring(0, originalRawFile.name.lastIndexOf('.')) || originalRawFile.name;
                      const ext = outputMimeType.split('/')[1].replace('jpeg', 'jpg');
                      finalImageFilename = `resized_${fNameBase}_${resultWidth}x${resultHeight}.${ext}`;
                      const previewCanvas = ui.previewCanvasElement; previewCanvas.width = resultWidth; previewCanvas.height = resultHeight;
                      const img = await createImageBitmap(finalImageBlob);
                      previewCanvas.getContext('2d').drawImage(img, 0, 0);
                      ui.resizedPreviewBoxElement.style.display = 'block';
                      ui.downloadButtonElement.style.display = 'flex';
                      ui.resizedImageInfoElement.textContent = `New Size: ${formatBytes(finalImageBlob.size)} (Dims: ${resultWidth}x${resultHeight})`;
                      showAppMessage("Image is ready to download.", "success");
                  } catch (e) {
                      showAppMessage("Error: " + e.message, "error");
                  } finally {
                      ui.processImageButtonElement.disabled = false;
                      ui.processImageButtonElement.innerHTML = '<i class="fas fa-cogs"></i> Resize & Optimize';
                  }
              }
              async function processToTargetSize(initialW, initialH, targetSize, mimeType) {
                  const tempCanvas = document.createElement('canvas'); const ctx = tempCanvas.getContext('2d');
                  ctx.imageSmoothingQuality = 'high'; const effectiveAspectRatio = currentAppliedAspectRatio || sourceImageAspectRatio;
                  let bestBlobOverall = null, dimsForBestBlob = { w: 0, h: 0 }; let currentW = initialW, currentH = initialH;
                  for (let dimAttempt = 0; dimAttempt < 10; dimAttempt++) {
                      if (currentW < 32 || currentH < 32) break;
                      tempCanvas.width = currentW; tempCanvas.height = currentH;
                      if (sourceImageType === 'image/png' && mimeType !== 'image/png') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, currentW, currentH); }
                      ctx.drawImage(loadedSourceImageObject, 0, 0, currentW, currentH);
                      let minQ = 0.05, maxQ = 1.0; let bestBlobThisDim = null;
                      for (let i = 0; i < 15; i++) {
                          let tryQ = (minQ + maxQ) / 2;
                          const tempBlob = await new Promise(res => tempCanvas.toBlob(res, mimeType, tryQ));
                          if (tempBlob && tempBlob.size <= targetSize) { if (!bestBlobThisDim || tempBlob.size > bestBlobThisDim.size) bestBlobThisDim = tempBlob; minQ = tryQ; } else { maxQ = tryQ; }
                          if (maxQ - minQ < 0.01) break;
                      }
                      if (bestBlobThisDim && (!bestBlobOverall || bestBlobThisDim.size > bestBlobOverall.size)) { bestBlobOverall = bestBlobThisDim; dimsForBestBlob = { w: currentW, h: currentH }; }
                      const newW = Math.max(32, Math.round(currentW * 0.9)); currentH = Math.max(32, Math.round(newW / effectiveAspectRatio)); currentW = newW;
                  }
                  if(!bestBlobOverall) throw new Error("Could not produce an image for the target size.");
                  return { blob: bestBlobOverall, width: dimsForBestBlob.w, height: dimsForBestBlob.h };
              }
              async function processToDimensions(width, height, mimeType) {
                  const tempCanvas = document.createElement('canvas'); tempCanvas.width = width; tempCanvas.height = height; const ctx = tempCanvas.getContext('2d');
                  ctx.imageSmoothingQuality = 'high'; const quality = (mimeType === 'image/jpeg' || mimeType === 'image/webp') ? (parseFloat(ui.qualityRangeSliderElement.value) / 100) : undefined;
                  if (sourceImageType === 'image/png' && (mimeType === 'image/jpeg' || mimeType === 'image/webp')) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height); }
                  ctx.drawImage(loadedSourceImageObject, 0, 0, width, height);
                  const blob = await new Promise(res => tempCanvas.toBlob(res, mimeType, quality));
                  return { blob, width, height };
              }
              function downloadFinalImage() {
                  if (!finalImageBlob || !finalImageFilename) return;
                  const url = URL.createObjectURL(finalImageBlob);
                  const a = document.createElement('a'); a.href = url; a.download = finalImageFilename;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
              }
              const formatBytes = (bytes, d = 2) => { if (!+bytes) return '0 Bytes'; const k = 1024, s = ['Bytes', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${s[i]}`; };
              const showAppMessage = (msg, type) => { ui.appMessageElement.textContent = msg; ui.appMessageElement.className = 'app-message'; if (msg && type) ui.appMessageElement.classList.add(type); ui.appMessageElement.style.display = msg ? 'block' : 'none'; };

              resetUIForNewUpload();
          });
    </script>
  </body>
</html>
