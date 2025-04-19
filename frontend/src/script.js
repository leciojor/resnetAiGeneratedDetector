document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const previewArea = document.getElementById('preview-area');
    const fileInput = document.getElementById('file-input');
    const selectFileBtn = document.getElementById('select-file-btn');
    const previewImage = document.getElementById('preview-image');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resetBtnSmall = document.getElementById('reset-btn-small');
    const loadingIndicator = document.getElementById('loading-indicator');
    const resultArea = document.getElementById('result-area');
    const errorMessage = document.getElementById('error-message');
    const analyzeControls = document.getElementById('analyze-controls');
    const scaleMarker = document.getElementById('scale-marker');
    const probabilityValue = document.getElementById('probability-value');
    const resultText = document.getElementById('result-text');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');

    let selectedFile = null;
    let isDarkMode = false;

    selectFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragging');
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect({ target: { files: e.dataTransfer.files } });
        }
    });

    analyzeBtn.addEventListener('click', analyzeImage);
    resetBtn.addEventListener('click', resetAnalysis);
    resetBtnSmall.addEventListener('click', resetAnalysis);
    themeToggleBtn.addEventListener('click', toggleTheme);

    initTheme();

    function handleFileSelect(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            if (!file.type.startsWith('image/')) {
                showError('Please select a valid image file.');
                return;
            }
            
            selectedFile = file;
            const imageUrl = URL.createObjectURL(file);
            previewImage.src = imageUrl;
            
            uploadArea.classList.add('hidden');
            previewArea.classList.remove('hidden');
            
            resultArea.classList.add('hidden');
            errorMessage.classList.add('hidden');
            analyzeControls.classList.remove('hidden');

            analyzeBtn.classList.add('pulse-animation');
        }
    }

    function analyzeImage() {
        if (!selectedFile) return;
        
        analyzeControls.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        errorMessage.classList.add('hidden');
                
        // setTimeout(() => {
        //     const probability = Math.random();
        //     displayResult(probability);
        //     loadingIndicator.classList.add('hidden');
        // }, analysisTime);

        const formData = new FormData();
        formData.append('image', selectedFile);

        fetch('http://18.205.114.19:5000/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const probability = data.probability;
            displayResult(probability);
        })
        .catch(error => {
            showError('Error analyzing image. Please try again.');
            analyzeControls.classList.remove('hidden');
        })
        .finally(() => {
            loadingIndicator.classList.add('hidden');
        });
    }

    function displayResult(probability) {
        const percentage = Math.round(probability * 100);
        const position = `${probability * 100}%`;
        
        scaleMarker.style.left = position;
        probabilityValue.style.left = position;
        probabilityValue.textContent = `${percentage}%`;
        
        if (probability > 0.7) {
            resultText.textContent = 'This image is very likely AI-generated';
            resultText.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        } else if (probability > 0.5) {
            resultText.textContent = 'This image is likely AI-generated';
            resultText.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
        } else if (probability > 0.3) {
            resultText.textContent = 'This image is likely not AI-generated';
            resultText.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        } else {
            resultText.textContent = 'This image is very likely not AI-generated';
            resultText.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
        }
        
        resultArea.classList.remove('hidden');
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function resetAnalysis() {
        selectedFile = null;
        fileInput.value = '';
        previewImage.src = '';
        
        uploadArea.classList.remove('hidden');
        previewArea.classList.add('hidden');
        resultArea.classList.add('hidden');
        errorMessage.classList.add('hidden');
        loadingIndicator.classList.add('hidden');
        analyzeControls.classList.remove('hidden');
    }

    function toggleTheme() {
        isDarkMode = !isDarkMode;
        
        if (isDarkMode) {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
        
        localStorage.setItem('darkMode', isDarkMode);
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('darkMode');
        
        if (savedTheme !== null) {
            isDarkMode = savedTheme === 'true';
            
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
            } else {
                document.body.classList.add('light-mode');
            }
        } else {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (prefersDarkMode) {
                isDarkMode = true;
                document.body.classList.add('dark-mode');
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
            } else {
                document.body.classList.add('light-mode');
            }
            
            localStorage.setItem('darkMode', isDarkMode);
        }
    }
});