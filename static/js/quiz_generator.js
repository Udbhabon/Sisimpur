// Disable Dropzone auto discover
Dropzone.autoDiscover = false;

document.addEventListener('DOMContentLoaded', function() {
    const processingStatus = document.getElementById('processing-status');
    const statusMessage = document.getElementById('status-message');
    const progressFill = document.getElementById('progress-fill');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = document.getElementById('btn-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    const apiLog = document.getElementById('api-log');
    const logContent = document.getElementById('log-content');
    const dropzoneElement = document.getElementById('document-dropzone');

    let uploadedFile = null;
    let logEntries = [];

    // Get quiz configuration values
    function getQuizConfig() {
        return {
            num_questions: document.getElementById('question-count').value,
            question_type: document.getElementById('question-type').value,
            language: document.getElementById('language').value
        };
    }

    // API Logging Functions
    function addLogEntry(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const entry = {
            timestamp,
            message,
            type
        };
        logEntries.push(entry);
        updateLogDisplay();
    }

    function updateLogDisplay() {
        logContent.innerHTML = logEntries.map(entry => {
            const icon = getLogIcon(entry.type);
            return `<div class="log-entry ${entry.type}">
                <span class="log-time">${entry.timestamp}</span>
                <span class="log-icon">${icon}</span>
                <span class="log-message">${entry.message}</span>
            </div>`;
        }).join('');
        
        // Auto-scroll to bottom
        logContent.scrollTop = logContent.scrollHeight;
    }

    function getLogIcon(type) {
        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'api': '🌐',
            'processing': '⚙️'
        };
        return icons[type] || 'ℹ️';
    }

    function clearLog() {
        logEntries = [];
        logContent.innerHTML = '';
    }

    // Initialize Dropzone (upload only, no auto-processing)
    const myDropzone = new Dropzone("#document-dropzone", {
        url: "#", // Dummy URL since we won't auto-upload
        autoProcessQueue: false, // Prevent auto-processing
        paramName: "document",
        maxFilesize: 10, // MB
        maxFiles: 1,
        acceptedFiles: ".pdf,.jpg,.jpeg,.png",
        addRemoveLinks: true,
        dictDefaultMessage: "Drop files here or click to upload",
        dictFallbackMessage: "Your browser does not support drag'n'drop file uploads.",
        dictFileTooBig: "File is too big ({{filesize}}MiB). Max filesize: {{maxFilesize}}MiB.",
        dictInvalidFileType: "You can't upload files of this type. Only PDF, JPG, and PNG files are allowed.",
        dictRemoveFile: "Remove file",

        init: function() {
            const dropzone = this;

            // Handle file added (but don't upload yet)
            this.on("addedfile", function(file) {
                uploadedFile = file;
                generateBtn.disabled = false;
                generateBtn.style.opacity = '1';
                addLogEntry(`📁 File uploaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 'success');
                console.log("File added:", file.name);
            });

            // Handle file removal
            this.on("removedfile", function(file) {
                uploadedFile = null;
                generateBtn.disabled = true;
                generateBtn.style.opacity = '0.6';
                hideProcessingStatus();
                clearLog();
            });

            // Handle processing when manually triggered
            this.on("sending", function(file, xhr, formData) {
                const csrfTokenInput = document.querySelector('[name=csrfmiddlewaretoken]');
                const csrfToken = csrfTokenInput ? csrfTokenInput.value : '';
                if (csrfToken) {
                    formData.append('csrfmiddlewaretoken', csrfToken);
                } else {
                    console.warn("CSRF token not found!");
                }

                // Add quiz configuration
                const config = getQuizConfig();
                Object.keys(config).forEach(key => {
                    if (config[key]) {
                        formData.append(key, config[key]);
                    }
                });

                // Show processing status and log API activity
                showProcessingStatus();
                addLogEntry('🚀 Starting API request to process document...', 'api');
                addLogEntry(`📤 Sending file: ${file.name}`, 'api');
                addLogEntry(`⚙️ Configuration: ${JSON.stringify(config)}`, 'info');
            });

            // Handle successful upload
            this.on("success", function(file, response) {
                if (response.success) {
                    addLogEntry('✅ API request successful!', 'success');
                    addLogEntry(`🎯 Generated ${response.qa_count || response.questions_generated || 0} questions`, 'success');
                    addLogEntry(`🔧 Processing method: ${response.processing_method || 'API'}`, 'info');
                    
                    // Show success message
                    showSuccessMessage(`Document processed successfully! Generated ${response.qa_count || response.questions_generated || 0} questions via API.`);

                    // Reload the current page after a short delay to show updated state
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                } else {
                    addLogEntry(`❌ API Error: ${response.error || 'Unknown error'}`, 'error');
                    showErrorMessage(response.error || 'Processing failed');
                    resetGenerateButton();
                }
            });

            // Handle upload errors
            this.on("error", function(file, errorMessage) {
                const error = typeof errorMessage === 'string' ? errorMessage : 'Processing failed';
                addLogEntry(`❌ Network Error: ${error}`, 'error');
                showErrorMessage(error);
                resetGenerateButton();
            });
        }
    });

    // Generate button click handler
    generateBtn.addEventListener('click', function() {
        if (!uploadedFile) {
            alert('Please upload a document first');
            return;
        }

        // Show loading state
        btnText.style.display = 'none';
        loadingSpinner.style.display = 'inline-block';
        generateBtn.disabled = true;

        // Set the correct URL and process the file
        const uploadUrl = dropzoneElement.dataset.uploadUrl;
        if (uploadUrl) {
            myDropzone.options.url = uploadUrl;
            myDropzone.processQueue();
        } else {
            console.error("Upload URL not found in data-upload-url attribute");
            alert("Configuration error: Upload URL missing.");
            resetGenerateButton();
        }
    });

    // Helper functions for UI updates
    function showProcessingStatus() {
        processingStatus.style.display = 'block';
        statusMessage.textContent = '🌐 Connecting to AI service...';
        progressFill.style.width = '20%';
        
        // Simulate progress updates
        setTimeout(() => {
            statusMessage.textContent = '📤 Uploading document to API...';
            progressFill.style.width = '40%';
            addLogEntry('📤 Uploading document to API...', 'api');
        }, 1000);
        
        setTimeout(() => {
            statusMessage.textContent = '⚙️ Processing document with AI...';
            progressFill.style.width = '70%';
            addLogEntry('⚙️ AI is processing your document...', 'processing');
        }, 2000);
    }

    function hideProcessingStatus() {
        processingStatus.style.display = 'none';
        progressFill.style.width = '0%';
    }

    function showSuccessMessage(message) {
        statusMessage.textContent = message;
        progressFill.style.width = '100%';

        // Change status icon to success
        const statusIcon = document.querySelector('.status-icon i');
        if (statusIcon) {
            statusIcon.className = 'ri-check-line';
            statusIcon.style.color = '#28a745';
            statusIcon.style.animation = 'none';
        }
        
        addLogEntry('🎉 Processing completed successfully!', 'success');
    }

    function showErrorMessage(message) {
        addLogEntry(`❌ Error: ${message}`, 'error');
        alert('Error: ' + message);
        hideProcessingStatus();
    }

    function resetGenerateButton() {
        btnText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
        generateBtn.disabled = uploadedFile ? false : true;
        hideProcessingStatus();
    }
});
