document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const readingPane = document.getElementById('reading-pane');
    const placeholderText = document.getElementById('placeholder-text');
    const documentTitle = document.getElementById('document-title');
    const fileUpload = document.getElementById('file-upload');
    const toolPlaceholder = document.getElementById('tool-placeholder');
    const loaderPlaceholder = document.getElementById('loader-placeholder');
    const wordDetails = document.getElementById('word-details');
    const selectedWordEl = document.getElementById('selected-word');
    const pronounceBtn = document.getElementById('pronounce-btn');
    const wordPhoneticEl = document.getElementById('word-phonetic');
    const definitionsContainer = document.getElementById('definitions-container');

    // --- APP STATE ---
    let currentSelectedWordSpan = null;

    // --- CORE FUNCTIONS ---

    /**
     * Resets the entire reader UI to its initial state.
     */
    function resetReader() {
        if (currentSelectedWordSpan) {
            currentSelectedWordSpan.classList.remove('selected');
            currentSelectedWordSpan = null;
        }
        wordDetails.classList.add('hidden');
        loaderPlaceholder.classList.add('hidden');
        toolPlaceholder.style.display = 'block';
        toolPlaceholder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg><p class="font-medium">Click on a word in the text to see its definition.</p>`;
    }

    /**
     * Processes raw text and injects it into the reading pane.
     * @param {string} text - The text to process.
     */
    function loadText(text) {
        placeholderText.style.display = 'none';
        readingPane.innerHTML = '';
        const words = text.split(/(\s+)/);
        words.forEach(word => {
            if (word.trim().length > 0) {
                const span = document.createElement('span');
                span.textContent = word;
                span.className = 'word';
                readingPane.appendChild(span);
            } else {
                readingPane.appendChild(document.createTextNode(word));
            }
        });
        resetReader();
    }

    /**
     * Fetches word definition by calling our own serverless function.
     * @param {string} word - The word to look up.
     */
    async function showWordDetails(word) {
        const cleanedWord = word.toLowerCase().replace(/[.,«»"';:()]/g, '').trim();
        if (!cleanedWord) return;
        
        // Reset the UI
        toolPlaceholder.style.display = 'none';
        wordDetails.classList.add('hidden');
        loaderPlaceholder.classList.remove('hidden');

        // Call the Netlify function
        const endpoint = `/api/fetch-definition?word=${cleanedWord}`;

        try {
            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();

            // --- Handle the successful response ---
            // The data structure now matches the format returned by our corrected index.js
            selectedWordEl.textContent = data.results[0].word;
            wordPhoneticEl.textContent = ''; // Our local dict doesn't have phonetic data

            // Hide the pronounce button since we don't have audio
            pronounceBtn.style.display = 'none';

            // Clear previous definitions
            definitionsContainer.innerHTML = '';

            // Add the definition from our local dictionary
            const definition = data.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0];
            const example = data.results[0].lexicalEntries[0].entries[0].senses[0].examples[0]?.text || 'No example available.';

            const defBlock = document.createElement('div');
            defBlock.innerHTML = `
                <h3 class="font-semibold text-slate-600 mb-1">noun</h3> <!-- A generic fallback -->
                <p class="bg-white p-3 rounded-lg border border-slate-200">${definition}</p>
                <p class="text-slate-500 text-sm mt-2 italic">e.g., "${example}"</p>
            `;
            definitionsContainer.appendChild(defBlock);

            // Show the word details
            wordDetails.classList.remove('hidden');

        } catch (error) {
            // --- Handle errors (404, network issues, etc.) ---
            console.error("Fetch Error:", error);
            toolPlaceholder.innerHTML = `
                <p class="font-medium text-red-500">No definition found for "${cleanedWord}".</p>
                <p class="text-sm text-slate-400 mt-2">The word may not be in the dictionary, or it could be a conjugated form.</p>`;
            toolPlaceholder.style.display = 'block';
        } finally {
            // Always hide the loader
            loaderPlaceholder.classList.add('hidden');
        }
    }

    /**
     * Plays the audio for the current word.
     * This is a fallback using the browser's speech synthesis.
     */
    function pronounceWord() {
        const wordToPronounce = selectedWordEl.textContent;
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(wordToPronounce);
            utterance.lang = 'fr-FR'; // Set language to French
            utterance.rate = 0.8; // Slightly slower for clarity
            window.speechSynthesis.speak(utterance);
        } else {
            console.error("Speech Synthesis not supported in this browser.");
        }
    }

    // --- EVENT LISTENERS ---

    // Click on a word in the text
    readingPane.addEventListener('click', (e) => {
        if (e.target.classList.contains('word')) {
            // Deselect the previously selected word
            if (currentSelectedWordSpan) {
                currentSelectedWordSpan.classList.remove('selected');
            }
            // Select the new word
            e.target.classList.add('selected');
            currentSelectedWordSpan = e.target;
            
            // Look up the definition
            const word = e.target.textContent;
            showWordDetails(word);
        }
    });

    // Click on the speaker button
    pronounceBtn.addEventListener('click', pronounceWord);

    // Upload a new document
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        documentTitle.textContent = file.name;
        placeholderText.style.display = 'none';
        readingPane.innerHTML = '<div class="loader mx-auto mt-20"></div><p class="text-center mt-4">Loading document...</p>';

        const reader = new FileReader();
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'txt') {
            reader.onload = (event) => loadText(event.target.result);
            reader.readAsText(file);
        } else if (fileExtension === 'pdf') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
            reader.onload = (event) => {
                const loadingTask = pdfjsLib.getDocument({ data: event.target.result });
                loadingTask.promise.then(pdf => {
                    let fullText = '';
                    const pagePromises = [];
                    for (let i = 1; i <= pdf.numPages; i++) {
                        pagePromises.push(pdf.getPage(i).then(page => page.getTextContent()));
                    }
                    Promise.all(pagePromises).then(textContents => {
                        textContents.forEach(textContent => {
                            textContent.items.forEach(item => {
                                fullText += item.str + ' ';
                            });
                            fullText += '\n';
                        });
                        loadText(fullText);
                    });
                }).catch(err => {
                    console.error("Error loading PDF:", err);
                    readingPane.innerHTML = `<p class="text-red-500 text-center">Error: Could not read the PDF file.</p>`;
                });
            };
            reader.readAsArrayBuffer(file);
        } else if (fileExtension === 'docx') {
            reader.onload = (event) => {
                mammoth.extractRawText({ arrayBuffer: event.target.result })
                    .then(result => loadText(result.value))
                    .catch(err => {
                        console.error("Error reading .docx file:", err);
                        readingPane.innerHTML = `<p class="text-red-500 text-center">Error: Could not read the .docx file.</p>`;
                    });
            };
            reader.readAsArrayBuffer(file);
        } else {
            readingPane.innerHTML = `<p class="text-red-500 text-center">Error: Unsupported file type. Please upload a .txt, .pdf, or .docx file.</p>`;
        }
    });
});