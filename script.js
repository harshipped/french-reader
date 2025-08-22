// Enhanced script.js with phrase selection functionality and FIXED PASTE BUTTON
let lastSelectedWord = null;
let currentSelection = null;
let floatingButton = null;

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-upload'); // Fixed ID
    const pasteTextBtn = document.getElementById('paste-text-btn'); // Add paste button reference
    const readingPane = document.getElementById('reading-pane');
    const sidebar = document.getElementById('sidebar');

    // File upload functionality
    const uploadFileBtn = document.getElementById('upload-file-btn');
    uploadFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // FIXED: Add paste button functionality
    pasteTextBtn.addEventListener('click', handlePasteText);

    // Text selection functionality
    readingPane.addEventListener('mouseup', handleTextSelection);
    readingPane.addEventListener('click', handleWordClick);
    document.addEventListener('mousedown', handleDocumentClick);

    // Initialize floating button
    createFloatingButton();

    // NEW: Handle paste text functionality
    function handlePasteText() {
        // Create a modal for pasting text
        const modal = createPasteModal();
        document.body.appendChild(modal);
        
        // Focus on the textarea
        const textarea = modal.querySelector('#paste-textarea');
        textarea.focus();
        
        // Try to paste from clipboard if available
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText()
                .then(text => {
                    if (text.trim()) {
                        textarea.value = text;
                    }
                })
                .catch(err => {
                    console.log('Could not read from clipboard:', err);
                });
        }
    }

    // NEW: Create paste modal
    function createPasteModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'paste-modal';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96">
                <div class="flex justify-between items-center p-6 border-b">
                    <h3 class="text-lg font-semibold">Paste French Text</h3>
                    <button id="close-paste-modal" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <textarea 
                        id="paste-textarea" 
                        class="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Paste your French text here... (Ctrl+V or Cmd+V)"
                    ></textarea>
                </div>
                <div class="flex justify-end space-x-3 p-6 border-t">
                    <button id="cancel-paste" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button id="confirm-paste" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Load Text
                    </button>
                </div>
            </div>
        `;

        // Add event listeners to modal
        modal.querySelector('#close-paste-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#cancel-paste').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#confirm-paste').addEventListener('click', () => {
            const textarea = modal.querySelector('#paste-textarea');
            const text = textarea.value.trim();
            
            if (text) {
                displayText(text);
                hideApplicationPlaceholder();
                document.getElementById('document-title').textContent = 'Pasted Text';
            }
            
            document.body.removeChild(modal);
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Handle escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape' && document.getElementById('paste-modal')) {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        });

        return modal;
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
        
        // ✅ Reset input so same file can be re-uploaded
        e.target.value = '';
}

    function handleFile(file) {
        const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid file (.txt, .pdf, or .docx)');
            return;
        }

        const reader = new FileReader();
        
        if (file.type === 'text/plain') {
            reader.onload = function(e) {
                const content = e.target.result;
                displayText(content);
                hideApplicationPlaceholder();
                document.getElementById('document-title').textContent = file.name;
            };
            reader.readAsText(file, 'UTF-8');
        } else if (file.type === 'application/pdf') {
            // Handle PDF files (requires PDF.js implementation)
            handlePDFFile(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Handle DOCX files (requires Mammoth.js implementation)
            handleDocxFile(file);
        }
    }

    // NEW: Hide the application placeholder
    function hideApplicationPlaceholder() {
        const placeholder = document.getElementById('placeholder-text');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }

    function handlePDFFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const typedArray = new Uint8Array(e.target.result);
            
            pdfjsLib.getDocument(typedArray).promise.then(pdf => {
                let textContent = '';
                const numPages = pdf.numPages;
                const promises = [];
                
                for (let i = 1; i <= numPages; i++) {
                    promises.push(
                        pdf.getPage(i).then(page => {
                            return page.getTextContent().then(content => {
                                return content.items.map(item => item.str).join(' ');
                            });
                        })
                    );
                }
                
                Promise.all(promises).then(pages => {
                    textContent = pages.join('\n\n');
                    displayText(textContent);
                    hideApplicationPlaceholder();
                    document.getElementById('document-title').textContent = file.name;
                });
            }).catch(error => {
                console.error('Error reading PDF:', error);
                alert('Error reading PDF file. Please try a different file.');
            });
        };
        reader.readAsArrayBuffer(file);
    }

    function handleDocxFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            mammoth.extractRawText({arrayBuffer: e.target.result})
                .then(result => {
                    displayText(result.value);
                    hideApplicationPlaceholder();
                    document.getElementById('document-title').textContent = file.name;
                })
                .catch(error => {
                    console.error('Error reading DOCX:', error);
                    alert('Error reading DOCX file. Please try a different file.');
                });
        };
        reader.readAsArrayBuffer(file);
    }

    function displayText(text) {
        const words = text.split(/(\s+|[.,!?;:"'()[\]{}—–-])/);
        const processedWords = words.map(word => {
            const trimmed = word.trim();
            if (trimmed && /[a-zA-ZàáâäçèéêëîïôöùúûüÿæœÀÁÂÄÇÈÉÊËÎÏÔÖÙÚÛÜŸÆŒ']/.test(trimmed)) {
                return `<span class="word hover:bg-blue-100 cursor-pointer transition-colors duration-150 rounded px-1" data-word="${trimmed.toLowerCase()}">${word}</span>`;
            }
            return word;
        });
        readingPane.innerHTML = processedWords.join('');
    }

    function handleTextSelection(e) {
        setTimeout(() => {
            const selection = window.getSelection();
            if (selection.rangeCount === 0 || selection.isCollapsed) {
                hideFloatingButton();
                return;
            }

            const selectedText = selection.toString().trim();
            if (!selectedText) {
                hideFloatingButton();
                return;
            }

            const validation = validateSelection(selectedText);
            if (!validation.valid) {
                hideFloatingButton();
                if (validation.error) {
                    showSelectionWarning(validation.error, e.clientX, e.clientY);
                }
                return;
            }

            currentSelection = {
                text: validation.cleanText,
                range: selection.getRangeAt(0).cloneRange()
            };

            showFloatingButton(e.clientX, e.clientY);
        }, 10);
    }

    function validateSelection(text) {
        const cleanText = text.replace(/\s+/g, ' ').trim();
        const words = cleanText.split(/\s+/).filter(word => word.length > 0);
        
        if (words.length === 0) {
            return { valid: false };
        }
        
        if (words.length > 8) {
            return { 
                valid: false, 
                error: 'Selection too long (max 8 words)' 
            };
        }

        const hasFrenchContent = /[àáâäçèéêëîïôöùúûüÿæœÀÁÂÄÇÈÉÊËÎÏÔÖÙÚÛÜŸÆŒ']/.test(cleanText) ||
                                /\b(le|la|les|un|une|de|du|des|et|ou|mais|donc|car|ni|or|ce|cette|ces|il|elle|ils|elles|nous|vous|je|tu|me|te|se|dans|sur|avec|pour|par|sans|sous|entre|chez|vers|depuis|pendant|avant|après|comme|plus|moins|très|bien|mal|tout|tous|toute|toutes|encore|déjà|jamais|toujours|parfois|souvent|quelquefois|peut|être|avoir|faire|aller|venir|voir|savoir|pouvoir|vouloir|devoir|dire|prendre|donner|mettre|porter|tenir|rester|partir|arriver|sortir|entrer|monter|descendre|passer|tourner|revenir|devenir|mourir|naître|vivre|aimer|détester|préférer|choisir|décider|essayer|réussir|échouer|commencer|finir|continuer|arrêter|oublier|se rappeler|se souvenir|apprendre|enseigner|étudier|travailler|jouer|dormir|manger|boire|acheter|vendre|payer|coûter|valoir|gagner|perdre|chercher|trouver|regarder|écouter|parler|répondre|demander|expliquer|comprendre|connaître|reconnaître|ouvrir|fermer|lire|écrire|compter|calculer|mesurer|peser|couper|casser|réparer|construire|détruire|nettoyer|salir|laver|sécher|cuisiner|servir|goûter|sentir|toucher|caresser|frapper|pousser|tirer|porter|poser|lever|baisser|incliner|pencher|plier|étendre|raccourcir|allonger|élargir|rétrécir|augmenter|diminuer|améliorer|empirer|changer|transformer|remplacer|échanger|comparer|ressembler|différer|égaler|dépasser|suivre|précéder|accompagner|guider|diriger|mener|conduire|emmener|amener|apporter|emporter|envoyer|recevoir|accepter|refuser|offrir|proposer|suggérer|conseiller|recommander|interdire|permettre|autoriser|défendre|protéger|attaquer|se battre|se disputer|se réconcilier|pardonner|excuser|remercier|féliciter|encourager|décourager|rassurer|inquiéter|surprendre|étonner|impressionner|décevoir|satisfaire|contenter|plaire|déplaire|intéresser|ennuyer|amuser|distraire|se reposer|se détendre|se dépêcher|se presser|attendre|patienter|hésiter|douter|croire|penser|réfléchir|se concentrer|se rappeler|imaginer|rêver|espérer|souhaiter|désirer|avoir envie|avoir besoin|avoir peur|avoir honte|être fier|être content|être triste|être en colère|être surpris|être déçu|être satisfait|se sentir|ressentir|éprouver|exprimer|montrer|cacher|révéler|découvrir|inventer|créer|produire|fabriquer|organiser|préparer|planifier|prévoir|programmer|réserver|annuler|confirmer|vérifier|contrôler|surveiller|observer|remarquer|noter|enregistrer|sauvegarder|effacer|supprimer|ajouter|enlever|retirer|garder|conserver|jeter|abandonner|laisser|quitter|partir|s'en aller|revenir|rentrer|retourner|repartir|se diriger|se rendre|aller chercher|ramener|rapporter|rendre|prêter|emprunter|voler|acheter|vendre|louer|posséder|appartenir|contenir|remplir|vider|verser|couler|tomber|chuter|glisser|trébucher|se relever|se lever|s'asseoir|s'allonger|se coucher|s'endormir|se réveiller|se lever|s'habiller|se déshabiller|se laver|se brosser|se peigner|se maquiller|se raser|se parfumer|sortir|rentrer|entrer|monter|descendre|grimper|sauter|courir|marcher|se promener|voyager|visiter|explorer|découvrir|se perdre|se retrouver|demander son chemin|indiquer le chemin|tourner|continuer tout droit|traverser|passer|dépasser|rattraper|rejoindre|rencontrer|voir|apercevoir|reconnaître|saluer|se présenter|faire connaissance|bavarder|discuter|parler|dire|raconter|expliquer|décrire|annoncer|déclarer|affirmer|nier|mentir|avouer|confesser|promettre|jurer|menacer|prévenir|avertir|informer|renseigner|se renseigner|demander|questionner|interroger|répondre|répliquer|objecter|protester|se plaindre|critiquer|féliciter|complimenter|insulter|se moquer|plaisanter|rigoler|rire|sourire|pleurer|sangloter|crier|chuchoter|murmurer|se taire|faire du bruit|faire silence|écouter|entendre|prêter l'oreille|tendre l'oreille|être sourd|être muet|être aveugle|voir|regarder|observer|examiner|surveiller|épier|guetter|apercevoir|distinguer|reconnaître|identifier|deviner|découvrir|révéler|cacher|dissimuler|montrer|présenter|exposer|exhiber|étaler|ranger|déranger|organiser|désorganiser|trier|classer|mélanger|séparer|diviser|partager|distribuer|donner|offrir|recevoir|prendre|saisir|attraper|lâcher|laisser tomber|ramasser|soulever|porter|poser|mettre|placer|installer|enlever|retirer|ôter|habiller|déshabiller|couvrir|découvrir|ouvrir|fermer|verrouiller|déverrouiller|allumer|éteindre|brancher|débrancher|appuyer|pousser|tirer|tourner|visser|dévisser|nouer|dénouer|attacher|détacher|lier|délier|serrer|desserrer|presser|relâcher|tenir|lâcher|garder|abandonner|jeter|lancer|rattraper|renvoyer|retourner|rendre|rapporter|ramener|emporter|emmener|accompagner|suivre|poursuivre|fuir|s'échapper|se sauver|se cacher|se réfugier|protéger|défendre|attaquer|se battre|lutter|résister|céder|abandonner|renoncer|persister|insister|continuer|persévérer|réussir|échouer|gagner|perdre|vaincre|être vaincu|dominer|être dominé|commander|obéir|diriger|suivre|mener|guider|conseiller|suggérer|proposer|recommander|interdire|défendre|permettre|autoriser|accepter|refuser|approuver|désapprouver|être d'accord|être en désaccord|discuter|débattre|se disputer|se quereller|se réconcilier|faire la paix|pardonner|excuser|s'excuser|remercier|féliciter|complimenter|critiquer|blâmer|accuser|défendre|justifier|expliquer|raison|tort|vrai|faux|juste|injuste|bon|mauvais|bien|mal|mieux|pire|meilleur|pire|bonjour|bonsoir|salut|merci|s'il vous plaît|excusez-moi|comment|qu'est-ce|où|quand|pourquoi|aujourd'hui|demain|hier|maintenant|plus tard|ici|là|dans)\b/i.test(cleanText);

        return { valid: true, cleanText };
    }

    function createFloatingButton() {
        floatingButton = document.getElementById('floating-translate-btn');
        if (!floatingButton) {
            // Create it if it doesn't exist
            floatingButton = document.createElement('button');
            floatingButton.id = 'floating-translate-btn';
            floatingButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M5 8l6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>
                Translate
            `;
            document.body.appendChild(floatingButton);
        }
        floatingButton.addEventListener('click', handlePhraseTranslation);
    }

    function showFloatingButton(x, y) {
        if (!floatingButton) return;
        
        floatingButton.classList.remove('hidden');
        floatingButton.style.left = Math.min(x, window.innerWidth - 120) + 'px';
        floatingButton.style.top = Math.max(10, y - 40) + 'px';
    }

    function hideFloatingButton() {
        if (floatingButton) {
            floatingButton.classList.add('hidden');
        }
        currentSelection = null;
    }

    function showSelectionWarning(message, x, y) {
        const warning = document.getElementById('selection-warning');
        if (warning) {
            warning.textContent = message;
            warning.classList.remove('hidden');
            warning.style.left = Math.min(x, window.innerWidth - 200) + 'px';
            warning.style.top = Math.max(10, y - 30) + 'px';
            
            setTimeout(() => {
                warning.classList.add('hidden');
            }, 3000);
        }
    }

    function handlePhraseTranslation() {
        if (!currentSelection) return;

        hideFloatingButton();
        window.getSelection().removeAllRanges();
        
        showLoadingState();
        
        fetchDefinition(currentSelection.text, true)
            .then(data => {
                displayPhraseTranslation(data);
            })
            .catch(error => {
                displayError('Failed to translate phrase: ' + error.message);
            });
    }

    function handleWordClick(e) {
        if (currentSelection) return;

        if (e.target.classList.contains('word')) {
            const word = e.target.getAttribute('data-word');
            if (word && word !== lastSelectedWord) {
                lastSelectedWord = word;
                showLoadingState();
                
                fetchDefinition(word, false)
                    .then(data => {
                        displayWordDefinition(data);
                    })
                    .catch(error => {
                        displayError('Failed to fetch definition: ' + error.message);
                    });
            }
        }
    }

    function handleDocumentClick(e) {
        if (e.target === floatingButton || 
            e.target.closest('#sidebar') || 
            e.target.closest('#floating-translate-btn') ||
            e.target.closest('#paste-modal')) {
            return;
        }
        
        if (floatingButton && !floatingButton.classList.contains('hidden')) {
            hideFloatingButton();
        }
    }

    function showLoadingState() {
        const toolPlaceholder = document.getElementById('tool-placeholder');
        const loaderPlaceholder = document.getElementById('loader-placeholder');
        const wordDetails = document.getElementById('word-details');

        toolPlaceholder?.classList.add('hidden');
        wordDetails?.classList.add('hidden');
        loaderPlaceholder?.classList.remove('hidden');
}

    function displayWordDefinition(data) {
        const toolPlaceholder = document.getElementById('tool-placeholder');
        const loaderPlaceholder = document.getElementById('loader-placeholder');
        const wordDetails = document.getElementById('word-details');

        toolPlaceholder?.classList.add('hidden');
        loaderPlaceholder?.classList.add('hidden');
        wordDetails?.classList.remove('hidden');
        
        if (data.type === 'definition') {
            document.getElementById('selected-word').textContent = data.word || 'Unknown';
            document.getElementById('word-phonetic').textContent = data.phonetic || '';
            document.getElementById('content-type-indicator').textContent = 'WORD';
            
            const definitionsContainer = document.getElementById('definitions-container');
            definitionsContainer.innerHTML = '';
            
            if (data.definitions && data.definitions.length > 0) {
                data.definitions.forEach((def) => {
                    const definitionBlock = document.createElement('div');
                    definitionBlock.className = 'bg-white p-4 rounded-lg border border-slate-200';
                    definitionBlock.innerHTML = `
                        <div class="flex items-center gap-2 mb-2">
                            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">${def.partOfSpeech || 'unknown'}</span>
                        </div>
                        <p class="text-slate-700 mb-3">${def.definition}</p>
                        ${def.example ? `<div class="text-slate-500 italic text-sm">"${def.example}"</div>` : ''}
                    `;
                    definitionsContainer.appendChild(definitionBlock);
                });
            }
            
            // Hide phrase breakdown
            document.getElementById('phrase-breakdown').classList.add('hidden');
            
            wordDetails.classList.remove('hidden');
        } else {
            displayError('Unexpected response format for word definition.');
        }
    }

    function displayPhraseTranslation(data) {
    const toolPlaceholder = document.getElementById('tool-placeholder');
    const loaderPlaceholder = document.getElementById('loader-placeholder');
    const wordDetails = document.getElementById('word-details');

    toolPlaceholder?.classList.add('hidden');
    loaderPlaceholder?.classList.add('hidden');
    wordDetails?.classList.remove('hidden');

    if (data.type === 'translation') {
        // Show main translation
        document.getElementById('selected-word').textContent = `"${data.phrase}"`;
        document.getElementById('word-phonetic').textContent = data.translation;
        document.getElementById('content-type-indicator').textContent = 'PHRASE';

        const definitionsContainer = document.getElementById('definitions-container');
        definitionsContainer.innerHTML = '';

        // Main translation block
        const translationBlock = document.createElement('div');
        translationBlock.className = 'bg-white p-4 rounded-lg border border-slate-200';
        translationBlock.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Translation</span>
                ${data.context ? `<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">${data.context}</span>` : ''}
            </div>
            <p class="text-slate-700 font-medium text-lg">${data.translation}</p>
        `;
        definitionsContainer.appendChild(translationBlock);

        // Handle phrase breakdown
        const phraseBreakdown = document.getElementById('phrase-breakdown');
        const breakdownContainer = document.getElementById('breakdown-container');

        if (data.breakdown && data.breakdown.length > 0) {
            // ✅ Show breakdown if available
            breakdownContainer.innerHTML = '';
            data.breakdown.forEach(item => {
                const breakdownItem = document.createElement('div');
                breakdownItem.className = 'flex justify-between items-center py-2 px-3 bg-slate-50 rounded text-sm';
                breakdownItem.innerHTML = `
                    <span class="font-medium text-slate-700">${item.word}</span>
                    <span class="text-slate-600">${item.meaning}</span>
                `;
                breakdownContainer.appendChild(breakdownItem);
            });
            phraseBreakdown.classList.remove('hidden');
        } else {
            // 🚀 Show placeholder instead of hiding
            breakdownContainer.innerHTML = `
                <div class="text-slate-400 italic text-sm">Breakdown loading…</div>
            `;
            phraseBreakdown.classList.remove('hidden');
        }

        wordDetails.classList.remove('hidden');
    } else {
        displayError('Unexpected response format for phrase translation.');
    }
}


    function displayError(message) {
        const toolPlaceholder = document.getElementById('tool-placeholder');
        const loaderPlaceholder = document.getElementById('loader-placeholder');
        const wordDetails = document.getElementById('word-details');
        
        if (loaderPlaceholder) loaderPlaceholder.classList.add('hidden');
        if (wordDetails) wordDetails.classList.add('hidden');
        
        if (toolPlaceholder) {
            toolPlaceholder.style.display = 'block';
            toolPlaceholder.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4 text-red-500"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <p class="font-medium text-red-600">Error</p>
                <p class="text-sm text-slate-500 mt-2">${message}</p>
            `;
        }
    }

    async function fetchDefinition(text, isPhrase = false) {
        const response = await fetch('/.netlify/functions/fetch-definition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                text: text,
                isPhrase: isPhrase 
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }

    // Add pronounce button functionality
    document.getElementById('pronounce-btn').addEventListener('click', function() {
        const word = document.getElementById('selected-word').textContent.replace(/["""]/g, '');
        if (word && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'fr-FR';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    });
});