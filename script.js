// Enhanced script.js with phrase selection functionality
let lastSelectedWord = null;
let currentSelection = null;
let floatingButton = null;

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    const readingPane = document.getElementById('reading-pane');
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('close-btn');

    // File upload functionality
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    uploadArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Text selection functionality
    readingPane.addEventListener('mouseup', handleTextSelection);
    readingPane.addEventListener('click', handleWordClick);
    document.addEventListener('mousedown', handleDocumentClick);

    // Sidebar close functionality
    closeBtn.addEventListener('click', closeSidebar);

    // Initialize floating button
    createFloatingButton();

    function handleFileDrop(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    }

    function handleFile(file) {
        if (file.type !== 'text/plain') {
            alert('Please select a text file (.txt)');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            displayText(content);
            document.getElementById('upload-container').style.display = 'none';
            document.getElementById('reading-container').style.display = 'flex';
        };
        reader.readAsText(file, 'UTF-8');
    }

    function displayText(text) {
        const words = text.split(/(\s+|[.,!?;:"'()[\]{}—–-])/);
        const processedWords = words.map(word => {
            const trimmed = word.trim();
            if (trimmed && /[a-zA-ZàáâäçèéêëîïôöùúûüÿæœÀÁÂÄÇÈÉÊËÎÏÔÖÙÚÛÜŸÆŒ]/.test(trimmed)) {
                return `<span class="word" data-word="${trimmed.toLowerCase()}">${word}</span>`;
            }
            return word;
        });
        readingPane.innerHTML = processedWords.join('');
    }

    function handleTextSelection(e) {
        // Small delay to ensure selection is complete
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

            // Validate selection
            const validation = validateSelection(selectedText);
            if (!validation.valid) {
                hideFloatingButton();
                if (validation.error) {
                    showTooltip(validation.error, e.clientX, e.clientY);
                }
                return;
            }

            // Store current selection
            currentSelection = {
                text: validation.cleanText,
                range: selection.getRangeAt(0).cloneRange()
            };

            // Show floating button
            showFloatingButton(e.clientX, e.clientY);
        }, 10);
    }

    function validateSelection(text) {
        // Remove extra whitespace and clean up
        const cleanText = text.replace(/\s+/g, ' ').trim();
        
        // Count words (split by whitespace, filter empty strings)
        const words = cleanText.split(/\s+/).filter(word => word.length > 0);
        
        if (words.length === 0) {
            return { valid: false };
        }
        
        if (words.length > 8) {
            return { 
                valid: false, 
                error: 'Selection too long. Please select 8 words or fewer.' 
            };
        }

        // Check if contains French characters or common words
        const hasFrenchContent = /[àáâäçèéêëîïôöùúûüÿæœÀÁÂÄÇÈÉÊËÎÏÔÖÙÚÛÜŸÆŒ]/.test(cleanText) ||
                                /\b(le|la|les|un|une|de|du|des|et|ou|mais|donc|car|ni|or|ce|cette|ces|il|elle|ils|elles|nous|vous|je|tu|me|te|se|dans|sur|avec|pour|par|sans|sous|entre|chez|vers|depuis|pendant|avant|après|comme|plus|moins|très|bien|mal|tout|tous|toute|toutes|encore|déjà|jamais|toujours|parfois|souvent|quelquefois|peut|être|avoir|faire|aller|venir|voir|savoir|pouvoir|vouloir|devoir|dire|prendre|donner|mettre|porter|tenir|rester|partir|arriver|sortir|entrer|monter|descendre|passer|tourner|revenir|devenir|mourir|naître|vivre|aimer|détester|préférer|choisir|décider|essayer|réussir|échouer|commencer|finir|continuer|arrêter|oublier|se rappeler|se souvenir|apprendre|enseigner|étudier|travailler|jouer|dormir|manger|boire|acheter|vendre|payer|coûter|valoir|gagner|perdre|chercher|trouver|regarder|écouter|parler|répondre|demander|expliquer|comprendre|connaître|reconnaître|ouvrir|fermer|lire|écrire|compter|calculer|mesurer|peser|couper|casser|réparer|construire|détruire|nettoyer|salir|laver|sécher|cuisiner|servir|goûter|sentir|toucher|caresser|frapper|pousser|tirer|porter|poser|lever|baisser|incliner|pencher|plier|étendre|raccourcir|allonger|élargir|rétrécir|augmenter|diminuer|améliorer|empirer|changer|transformer|remplacer|échanger|comparer|ressembler|différer|égaler|dépasser|suivre|précéder|accompagner|guider|diriger|mener|conduire|emmener|amener|apporter|emporter|envoyer|recevoir|accepter|refuser|offrir|proposer|suggérer|conseiller|recommander|interdire|permettre|autoriser|défendre|protéger|attaquer|se battre|se disputer|se réconcilier|pardonner|excuser|remercier|féliciter|encourager|décourager|rassurer|inquiéter|surprendre|étonner|impressionner|décevoir|satisfaire|contenter|plaire|déplaire|intéresser|ennuyer|amuser|distraire|se reposer|se détendre|se dépêcher|se presser|attendre|patienter|hésiter|douter|croire|penser|réfléchir|se concentrer|se rappeler|imaginer|rêver|espérer|souhaiter|désirer|avoir envie|avoir besoin|avoir peur|avoir honte|être fier|être content|être triste|être en colère|être surpris|être déçu|être satisfait|se sentir|ressentir|éprouver|exprimer|montrer|cacher|révéler|découvrir|inventer|créer|produire|fabriquer|organiser|préparer|planifier|prévoir|programmer|réserver|annuler|confirmer|vérifier|contrôler|surveiller|observer|remarquer|noter|enregistrer|sauvegarder|effacer|supprimer|ajouter|enlever|retirer|garder|conserver|jeter|abandonner|laisser|quitter|partir|s'en aller|revenir|rentrer|retourner|repartir|se diriger|se rendre|aller chercher|ramener|rapporter|rendre|prêter|emprunter|voler|acheter|vendre|louer|posséder|appartenir|contenir|remplir|vider|verser|couler|tomber|chuter|glisser|trébucher|se relever|se lever|s'asseoir|s'allonger|se coucher|s'endormir|se réveiller|se lever|s'habiller|se déshabiller|se laver|se brosser|se peigner|se maquiller|se raser|se parfumer|sortir|rentrer|entrer|monter|descendre|grimper|sauter|courir|marcher|se promener|voyager|visiter|explorer|découvrir|se perdre|se retrouver|demander son chemin|indiquer le chemin|tourner|continuer tout droit|traverser|passer|dépasser|rattraper|rejoindre|rencontrer|voir|apercevoir|reconnaître|saluer|se présenter|faire connaissance|bavarder|discuter|parler|dire|raconter|expliquer|décrire|annoncer|déclarer|affirmer|nier|mentir|avouer|confesser|promettre|jurer|menacer|prévenir|avertir|informer|renseigner|se renseigner|demander|questionner|interroger|répondre|répliquer|objecter|protester|se plaindre|critiquer|féliciter|complimenter|insulter|se moquer|plaisanter|rigoler|rire|sourire|pleurer|sangloter|crier|chuchoter|murmurer|se taire|faire du bruit|faire silence|écouter|entendre|prêter l'oreille|tendre l'oreille|être sourd|être muet|être aveugle|voir|regarder|observer|examiner|surveiller|épier|guetter|apercevoir|distinguer|reconnaître|identifier|deviner|découvrir|révéler|cacher|dissimuler|montrer|présenter|exposer|exhiber|étaler|ranger|déranger|organiser|désorganiser|trier|classer|mélanger|séparer|diviser|partager|distribuer|donner|offrir|recevoir|prendre|saisir|attraper|lâcher|laisser tomber|ramasser|soulever|porter|poser|mettre|placer|installer|enlever|retirer|ôter|habiller|déshabiller|couvrir|découvrir|ouvrir|fermer|verrouiller|déverrouiller|allumer|éteindre|brancher|débrancher|appuyer|pousser|tirer|tourner|visser|dévisser|nouer|dénouer|attacher|détacher|lier|délier|serrer|desserrer|presser|relâcher|tenir|lâcher|garder|abandonner|jeter|lancer|rattraper|renvoyer|retourner|rendre|rapporter|ramener|emporter|emmener|accompagner|suivre|poursuivre|fuir|s'échapper|se sauver|se cacher|se réfugier|protéger|défendre|attaquer|se battre|lutter|résister|céder|abandonner|renoncer|persister|insister|continuer|persévérer|réussir|échouer|gagner|perdre|vaincre|être vaincu|dominer|être dominé|commander|obéir|diriger|suivre|mener|guider|conseiller|suggérer|proposer|recommander|interdire|défendre|permettre|autoriser|accepter|refuser|approuver|désapprouver|être d'accord|être en désaccord|discuter|débattre|se disputer|se quereller|se réconcilier|faire la paix|pardonner|excuser|s'excuser|remercier|féliciter|complimenter|critiquer|blâmer|accuser|défendre|justifier|expliquer|raison|tort|vrai|faux|juste|injuste|bon|mauvais|bien|mal|mieux|pire|meilleur|pire)\b/i.test(cleanText);

        if (!hasFrenchContent) {
            return {
                valid: false,
                error: 'Please select French text only.'
            };
        }

        return { valid: true, cleanText };
    }

    function createFloatingButton() {
        floatingButton = document.createElement('button');
        floatingButton.className = 'floating-translate-btn';
        floatingButton.innerHTML = '🔤 Translate';
        floatingButton.style.display = 'none';
        floatingButton.addEventListener('click', handlePhraseTranslation);
        document.body.appendChild(floatingButton);
    }

    function showFloatingButton(x, y) {
        if (!floatingButton) return;
        
        floatingButton.style.display = 'block';
        floatingButton.style.left = Math.min(x, window.innerWidth - 120) + 'px';
        floatingButton.style.top = Math.max(10, y - 40) + 'px';
    }

    function hideFloatingButton() {
        if (floatingButton) {
            floatingButton.style.display = 'none';
        }
        currentSelection = null;
    }

    function showTooltip(message, x, y) {
        const tooltip = document.createElement('div');
        tooltip.className = 'error-tooltip';
        tooltip.textContent = message;
        tooltip.style.left = Math.min(x, window.innerWidth - 200) + 'px';
        tooltip.style.top = Math.max(10, y - 30) + 'px';
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 3000);
    }

    function handlePhraseTranslation() {
        if (!currentSelection) return;

        hideFloatingButton();
        window.getSelection().removeAllRanges();
        
        showSidebar();
        displayLoadingState('phrase');
        
        fetchDefinition(currentSelection.text, true)
            .then(data => {
                displayPhraseTranslation(data);
            })
            .catch(error => {
                displayError('Failed to translate phrase: ' + error.message);
            });
    }

    function handleWordClick(e) {
        // Don't handle word clicks if there's an active selection
        if (currentSelection) return;

        if (e.target.classList.contains('word')) {
            const word = e.target.getAttribute('data-word');
            if (word && word !== lastSelectedWord) {
                lastSelectedWord = word;
                showSidebar();
                displayLoadingState('word');
                
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
        // Don't hide if clicking on the floating button or sidebar
        if (e.target === floatingButton || 
            e.target.closest('#sidebar') || 
            e.target.closest('.floating-translate-btn')) {
            return;
        }
        
        // Hide floating button if clicking elsewhere
        if (floatingButton && floatingButton.style.display === 'block') {
            hideFloatingButton();
        }
    }

    function showSidebar() {
        sidebar.classList.add('open');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        hideFloatingButton();
    }

    function displayLoadingState(type) {
        const content = sidebar.querySelector('.content');
        content.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Fetching ${type === 'phrase' ? 'translation' : 'definition'}...</p>
            </div>
        `;
    }

    function displayWordDefinition(data) {
        const content = sidebar.querySelector('.content');
        
        if (data.type === 'definition') {
            let html = `
                <div class="word-header">
                    <h2>${data.word}</h2>
                    ${data.pronunciation ? `<div class="pronunciation">${data.pronunciation}</div>` : ''}
                </div>
            `;
            
            if (data.definitions && data.definitions.length > 0) {
                html += '<div class="definitions">';
                data.definitions.forEach((def, index) => {
                    html += `
                        <div class="definition-item">
                            <span class="part-of-speech">${def.partOfSpeech}</span>
                            <p>${def.definition}</p>
                            ${def.example ? `<div class="example">"${def.example}"</div>` : ''}
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            content.innerHTML = html;
        } else {
            displayError('Unexpected response format for word definition.');
        }
    }

    function displayPhraseTranslation(data) {
        const content = sidebar.querySelector('.content');
        
        if (data.type === 'translation') {
            let html = `
                <div class="phrase-header">
                    <h2 class="phrase-title">Phrase Translation</h2>
                    <div class="original-phrase">"${data.phrase}"</div>
                </div>
                <div class="main-translation">
                    <h3>Translation</h3>
                    <p class="translation-text">${data.translation}</p>
                </div>
            `;
            
            if (data.context) {
                html += `
                    <div class="context-info">
                        <h3>Context</h3>
                        <p>${data.context}</p>
                    </div>
                `;
            }
            
            if (data.breakdown && data.breakdown.length > 0) {
                html += '<div class="word-breakdown">';
                html += '<h3>Word Breakdown</h3>';
                html += '<div class="breakdown-grid">';
                data.breakdown.forEach(item => {
                    html += `
                        <div class="breakdown-item">
                            <span class="original-word">${item.word}</span>
                            <span class="word-meaning">${item.meaning}</span>
                        </div>
                    `;
                });
                html += '</div></div>';
            }
            
            content.innerHTML = html;
        } else {
            displayError('Unexpected response format for phrase translation.');
        }
    }

    function displayError(message) {
        const content = sidebar.querySelector('.content');
        content.innerHTML = `
            <div class="error">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    async function fetchDefinition(text, isPhrase = false) {
        const response = await fetch('/fetch-definition', {
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }
});