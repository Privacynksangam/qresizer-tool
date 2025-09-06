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
              let isProgrammaticChange = false;
              
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
              
              // =================================================================
              // === BUG FIX STARTS HERE / बग को यहाँ ठीक किया गया है ===
              // =================================================================
              ui.aspectRatioCheckboxInput.addEventListener('change', e => {
                  if (e.target.checked) {
                      // When the box is re-checked, restore the original dimensions
                      if (originalRawFile && sourceImageWidth > 0) {
                          updateUIDimensions(sourceImageWidth, sourceImageHeight);
                          currentAppliedAspectRatio = sourceImageAspectRatio;
                          // Visually reset the preset buttons
                          ui.presetButtons.forEach(btn => btn.classList.remove('active'));
                          const originalPresetButton = document.querySelector('.preset-button[data-ratio-value="original"]');
                          if (originalPresetButton) {
                              originalPresetButton.classList.add('active');
                          }
                      }
                  }
                  // This call is still useful to handle cases where a dimension might need recalculating
                  handleDimensionChange(e, false);
              });
              // =================================================================
              // === BUG FIX ENDS HERE / बग यहीं पर ठीक हो गया है ===
              // =================================================================

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

            function attachTextEventListeners(element) {
                const closeBtn = element.querySelector('.draggable-text-close');
                const resizer = element.querySelector('.draggable-text-resizer');
                closeBtn.addEventListener('click', (e) => { e.stopPropagation(); removeActiveText(true); });
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
                    e.stopPropagation();
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
                    document.addEventListener('mousemove', resizeMoveHandler);
                    document.addEventListener('touchmove', resizeMoveHandler, { passive: false });
                    document.addEventListener('mouseup', resizeEndHandler);
                    document.addEventListener('touchend', resizeEndHandler);
                };
                resizer.addEventListener('mousedown', resizeStartHandler);
                resizer.addEventListener('touchstart', resizeStartHandler, { passive: false });
            }

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

              function handleDpiChange() {
                debouncedUpdateEstimatedSize();
              }
              
              function handleUnitChange() {
                  const newUnit = ui.dimensionUnitSelect.value;
                  ui.dpiControlGroup.style.display = newUnit === 'px' ? 'none' : 'block';
                  if (newUnit === currentUnit) return;
                  const originalWidthValue = ui.targetWidthInput.value;
                  const originalHeightValue = ui.targetHeightInput.value;
                  if (!ui.aspectRatioCheckboxInput.checked) {
                      currentUnit = newUnit;
                  } else {
                      const widthPx = toPixels(originalWidthValue, currentUnit);
                      const heightPx = toPixels(originalHeightValue, currentUnit);
                      currentUnit = newUnit;
                      isProgrammaticChange = true;
                      ui.targetWidthInput.value = fromPixels(widthPx, newUnit) || '';
                      ui.targetHeightInput.value = fromPixels(heightPx, newUnit) || '';
                      isProgrammaticChange = false;
                  }
                  debouncedUpdateEstimatedSize();
              }
              
              function updateUIDimensions(width, height, size = null) {
                  isProgrammaticChange = true;
                  ui.targetWidthInput.value = fromPixels(width, currentUnit);
                  ui.targetHeightInput.value = fromPixels(height, currentUnit);
                  isProgrammaticChange = false;
                  if (size) {
                      ui.originalDimensionsSpan.textContent = `${width}x${height}`;
                      ui.originalTypeSpan.textContent = sourceImageType.replace('image/', '').toUpperCase();
                      ui.originalSizeSpan.textContent = formatBytes(size);
                  }
              }
              function handleDimensionChange(e, isManualInput) {
                  if (isProgrammaticChange) return;
                  if (isManualInput) { ui.presetButtons.forEach(btn => btn.classList.remove('active')); ui.togglePresetsButton.classList.remove('open'); ui.presetsGridContainer.style.display = 'none'; }
                  if (ui.aspectRatioCheckboxInput.checked && currentAppliedAspectRatio > 0 && e) {
                      const changedEl = e.target;
                      const isWidthChanged = changedEl.id === 'targetWidthInput';
                      const otherEl = isWidthChanged ? ui.targetHeightInput : ui.targetWidthInput;
                      const changedVal = toPixels(parseFloat(changedEl.value), currentUnit);
                      if (!isNaN(changedVal) && changedVal > 0) {
                          const otherVal = isWidthChanged ? changedVal / currentAppliedAspectRatio : changedVal * currentAppliedAspectRatio;
                          isProgrammaticChange = true;
                          otherEl.value = fromPixels(Math.round(otherVal), currentUnit);
                          isProgrammaticChange = false;
                      }
                  }
                  debouncedUpdateEstimatedSize();
              }
              
              function handleAspectRatioPresetClick(button) {
                  if (!originalRawFile || sourceImageWidth <= 0) {
                      showAppMessage("Please upload an image first.", "info");
                      return;
                  }
                  ui.presetButtons.forEach(btn => btn.classList.remove('active'));
                  button.classList.add('active');
                  ui.aspectRatioCheckboxInput.checked = true;
                  const ratioStr = button.dataset.ratioValue;
                  if (ratioStr === "original") {
                      currentAppliedAspectRatio = sourceImageAspectRatio;
                  } else {
                      const parts = ratioStr.split('/').map(Number);
                      if (parts.length === 2 && parts[1] !== 0) {
                          currentAppliedAspectRatio = parts[0] / parts[1];
                      } else {
                          currentAppliedAspectRatio = sourceImageAspectRatio;
                      }
                  }
                  let targetWidthPx = toPixels(ui.targetWidthInput.value, currentUnit);
                  let targetHeightPx = toPixels(ui.targetHeightInput.value, currentUnit);
                  if (targetWidthPx > 0) {
                      targetHeightPx = Math.round(targetWidthPx / currentAppliedAspectRatio);
                  } else if (targetHeightPx > 0) {
                      targetWidthPx = Math.round(targetHeightPx * currentAppliedAspectRatio);
                  } else {
                      targetWidthPx = sourceImageWidth;
                      targetHeightPx = Math.round(targetWidthPx / currentAppliedAspectRatio);
                  }
                  isProgrammaticChange = true;
                  ui.targetWidthInput.value = fromPixels(targetWidthPx, currentUnit) || '';
                  ui.targetHeightInput.value = fromPixels(targetHeightPx, currentUnit) || '';
                  isProgrammaticChange = false;
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
                  if (ui.aspectRatioCheckboxInput.checked && currentAppliedAspectRatio > 0) {
                      const wVal = ui.targetWidthInput.value.trim();
                      const hVal = ui.targetHeightInput.value.trim();
                      if (wVal && !hVal) { initialH = Math.round(initialW / currentAppliedAspectRatio); } 
                      else if (!wVal && hVal) { initialW = Math.round(initialH * currentAppliedAspectRatio); }
                  }
                  
                  const outputMimeType = ui.outputFormatSelectElement.value === 'source' ? sourceImageType : ui.outputFormatSelectElement.value;
                  let targetSizeInBytes = 0;
                  const targetSizeVal = parseFloat(ui.targetFileSizeInput.value);
                  if (!isNaN(targetSizeVal) && targetSizeVal > 0 && outputMimeType !== 'source') { targetSizeInBytes = (ui.fileSizeUnitSelectElement.value === 'MB' ? targetSizeVal * 1024 * 1024 : targetSizeVal * 1024); }
                  
                  try {
                      let resultBlob, resultWidth, resultHeight;
                      if (targetSizeInBytes > 0 && (outputMimeType === 'image/jpeg' || outputMimeType === 'image/webp')) {
                          // =================================================================
                          // === HYBRID LOGIC STARTS HERE / हाइब्रिड लॉजिक यहाँ से शुरू होता है ===
                          // =================================================================
                          if (currentUnit === 'px') {
                              const result = await processToTargetSize_ForPixels(initialW, initialH, targetSizeInBytes, outputMimeType);
                              resultBlob = result.blob; resultWidth = result.width; resultHeight = result.height;
                          } else {
                              const result = await processToTargetSize_ForPrint(initialW, initialH, targetSizeInBytes, outputMimeType);
                              resultBlob = result.blob; resultWidth = result.width; resultHeight = result.height;
                          }
                          // =================================================================
                          // === HYBRID LOGIC ENDS HERE / हाइब्रिड लॉजिक यहीं पर समाप्त होता है ===
                          // =================================================================
                      } else { 
                          const result = await processToDimensions(initialW, initialH, outputMimeType); 
                          resultBlob = result.blob; resultWidth = result.width; resultHeight = result.height; 
                      }
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
              
              async function processToTargetSize_ForPixels(initialW, initialH, targetSize, mimeType) {
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

              async function processToTargetSize_ForPrint(fixedW, fixedH, targetSize, mimeType) {
                  const tempCanvas = document.createElement('canvas');
                  const ctx = tempCanvas.getContext('2d');
                  ctx.imageSmoothingQuality = 'high';
                  tempCanvas.width = fixedW; tempCanvas.height = fixedH;
                  if (sourceImageType === 'image/png' && mimeType !== 'image/png') {
                      ctx.fillStyle = '#FFFFFF';
                      ctx.fillRect(0, 0, fixedW, fixedH);
                  }
                  ctx.drawImage(loadedSourceImageObject, 0, 0, fixedW, fixedH);
                  
                  let bestBlob = null;
                  let minQ = 0.01, maxQ = 1.0;

                  for (let i = 0; i < 8; i++) {
                      let currentQ = (minQ + maxQ) / 2;
                      const tempBlob = await new Promise(res => tempCanvas.toBlob(res, mimeType, currentQ));
                      if (!tempBlob) { maxQ = currentQ; continue; }

                      if (tempBlob.size <= targetSize) {
                          bestBlob = tempBlob;
                          minQ = currentQ;
                      } else {
                          maxQ = currentQ;
                      }
                  }

                  if (!bestBlob) {
                      const lowestQualityBlob = await new Promise(res => tempCanvas.toBlob(res, mimeType, 0.01));
                      if (lowestQualityBlob && lowestQualityBlob.size <= targetSize) {
                          bestBlob = lowestQualityBlob;
                      } else {
                          throw new Error(`Cannot meet target size. Smallest is ${formatBytes(lowestQualityBlob?.size || 0)}.`);
                      }
                  }
                  return { blob: bestBlob, width: fixedW, height: fixedH };
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