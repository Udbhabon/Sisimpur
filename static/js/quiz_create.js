// Disable Dropzone auto discover
Dropzone.autoDiscover = false;

document.addEventListener('DOMContentLoaded', function() {
    const processingStatus = document.getElementById('processing-status');
    const statusMessage = document.getElementById('status-message');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = document.getElementById('btn-text');
    const loadingSpinner = document.getElementById('loading-spinner');

    let uploadedFile = null;

    // Initialize progress ring
    const progressCircle = document.getElementById('progress-circle');
    if (progressCircle) {
        const circumference = 2 * Math.PI * 50;
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference;
    }

    // Get quiz configuration values
    function getQuizConfig() {
        return {
            num_questions: document.getElementById('question-count').value,
            question_type: document.getElementById('question-type').value,
            language: document.getElementById('language').value
        };
    }

    // Custom Dropzone preview template (only remove button, modern look)
    const customPreviewTemplate = `
      <div class="dz-preview dz-file-preview modern-preview">
        <div class="dz-details">
          <div class="dz-filename"><span data-dz-name></span></div>
          <div class="dz-size" data-dz-size></div>
        </div>
        <div class="dz-remove-btn">
          <a class="dz-remove" href="javascript:undefined;" data-dz-remove>
            <i class="ri-close-line"></i> Remove file
          </a>
        </div>
      </div>
    `;

    // Initialize Dropzone (upload only, no auto-processing)
    const myDropzone = new Dropzone("#document-dropzone", {
        url: "#", // Dummy URL since we won't auto-upload
        autoProcessQueue: false,
        paramName: "document",
        maxFilesize: 10, // MB
        maxFiles: 1,
        acceptedFiles: ".jpg,.jpeg,.png,.pdf,.txt",
        dictDefaultMessage: "Drop files here or click to upload",
        dictFallbackMessage: "Your browser does not support drag'n'drop file uploads.",
        dictFileTooBig: "File is too big ({{filesize}}MiB). Max filesize: {{maxFilesize}}MiB.",
        dictInvalidFileType: "You can't upload files of this type. Only PDF, JPG, PNG, and TXT files are allowed.",
        dictRemoveFile: "Remove file",
        previewTemplate: customPreviewTemplate, // Use the modern template

        init: function() {
            const dropzone = this;

            // Only allow one file at a time, replace if new one is added
            this.on("addedfile", function(file) {
                if (this.files.length > 1) {
                    this.removeFile(this.files[0]);
                }
                uploadedFile = file;
                generateBtn.disabled = false;
                generateBtn.style.opacity = '1';
                console.log("File added:", file.name);
            });

            // Handle file removal
            this.on("removedfile", function(file) {
                uploadedFile = null;
                generateBtn.disabled = true;
                generateBtn.style.opacity = '0.6';
                hideProcessingStatus();
            });

            // Handle processing when manually triggered
            this.on("sending", function(file, xhr, formData) {
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                formData.append('csrfmiddlewaretoken', csrfToken);

                // Add quiz configuration
                const config = getQuizConfig();
                Object.keys(config).forEach(key => {
                    if (config[key]) {
                        formData.append(key, config[key]);
                    }
                });

                // Show processing status
                // showProcessingStatus();
            });

            // Handle successful upload
            this.on("success", function(file, response) {
                console.log("Dropzone success response:", response);
                if (response.success) {
                    const generatedCount = response.qa_count || response.questions_generated || 0;
                    // Show success message
                    showNotification(`Document processed successfully! Generated ${generatedCount} questions.`, 'success');

                    // Reload the current page after a short delay to show updated quiz list
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    showErrorMessage(response.error || 'Processing failed');
                    resetGenerateButton();
                }
            });

            // Handle upload errors
            this.on("error", function(file, errorMessage, xhr) {
                console.error("Dropzone error:", errorMessage, xhr);
                showErrorMessage(typeof errorMessage === 'string' ? errorMessage : 'Processing failed');
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
        // showProcessingStatus(); // Ensure processing status is shown immediately

        // Set the correct URL and process the file
        // Use the global variable defined in the template or data attribute
        let uploadUrl = typeof processDocumentUrl !== 'undefined' ? processDocumentUrl : null;
        
        if (!uploadUrl) {
             const container = document.querySelector('.quiz-section') || document.body;
             uploadUrl = container.dataset.processUrl;
        }

        if (uploadUrl) {
            myDropzone.options.url = uploadUrl;
        } else {
            console.error("processDocumentUrl is not defined");
            alert("Configuration error: Process URL missing");
            resetGenerateButton();
            return;
        }
        
        myDropzone.processQueue();
    });

    // Modern Processing Animation Functions
    let currentStage = 0;
    let progressInterval;
    let currentProgress = 0;

    function showProcessingStatus() {
        processingStatus.style.display = 'block';
        currentStage = 0;
        currentProgress = 0;

        // Reset all stages
        document.querySelectorAll('.stage').forEach(stage => {
            stage.classList.remove('active', 'completed');
        });

        // Start the processing animation
        startProcessingAnimation();

        // Simulate real-time progress with enhanced timing
        enhancedSimulateProgress();
    }

    function hideProcessingStatus() {
        processingStatus.style.display = 'none';
        if (progressInterval) {
            clearInterval(progressInterval);
        }
        currentProgress = 0;
        updateProgressRing(0);
    }

    function startProcessingAnimation() {
        // Add entrance animation
        const container = document.querySelector('.processing-container');
        container.style.opacity = '0';
        container.style.transform = 'scale(0.9)';

        setTimeout(() => {
            container.style.transition = 'all 0.5s ease';
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
        }, 100);

        // Start particles animation
        createProcessingParticles();
    }

    function simulateProgress() {
        const stages = [
            { name: 'upload', title: 'Uploading Document', message: 'Securely uploading your file...', progress: 25, time: '30 seconds' },
            { name: 'analyze', title: 'Analyzing Content', message: 'AI is reading and understanding your document...', progress: 50, time: '45 seconds' },
            { name: 'generate', title: 'Generating Questions', message: 'Creating intelligent questions from your content...', progress: 85, time: '15 seconds' }
        ];

        let stageIndex = 0;

        function nextStage() {
            if (stageIndex < stages.length) {
                const stage = stages[stageIndex];
                updateProcessingStage(stage);
                stageIndex++;

                // Move to next stage after delay
                setTimeout(nextStage, 2000 + Math.random() * 3000); // 2-5 seconds per stage
            }
        }

        nextStage();
    }

    function updateProcessingStage(stage) {
        // Update stage indicators
        const stageElement = document.getElementById(`stage-${stage.name}`);
        if (stageElement) {
            // Mark previous stages as completed
            document.querySelectorAll('.stage').forEach((el, index) => {
                if (index < currentStage) {
                    el.classList.add('completed');
                    el.classList.remove('active');
                }
            });

            // Mark current stage as active
            stageElement.classList.add('active');
            currentStage++;
        }

        // Update text content
        document.getElementById('status-title').textContent = stage.title;
        document.getElementById('status-message').textContent = stage.message;
        document.getElementById('estimated-time').textContent = stage.time;

        // Update progress ring
        animateProgressTo(stage.progress);

        // Update icon based on stage
        const iconElement = document.getElementById('progress-icon').querySelector('i');
        const iconMap = {
            'upload': 'ri-upload-cloud-line',
            'analyze': 'ri-search-eye-line',
            'generate': 'ri-magic-line',
            'complete': 'ri-check-line'
        };
        iconElement.className = iconMap[stage.name] || 'ri-file-text-line';
    }

    function animateProgressTo(targetProgress) {
        const progressCircle = document.getElementById('progress-circle');
        const progressPercentage = document.getElementById('progress-percentage');
        const circumference = 2 * Math.PI * 50; // radius = 50

        const animateStep = () => {
            if (currentProgress < targetProgress) {
                currentProgress += 1;
                updateProgressRing(currentProgress);
                requestAnimationFrame(animateStep);
            }
        };

        animateStep();
    }

    function updateProgressRing(progress) {
        const progressCircle = document.getElementById('progress-circle');
        const progressPercentage = document.getElementById('progress-percentage');
        const circumference = 2 * Math.PI * 50;

        const offset = circumference - (progress / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
        progressPercentage.textContent = `${Math.round(progress)}%`;
    }

    function createProcessingParticles() {
        const particlesContainer = document.querySelector('.processing-particles');
        particlesContainer.innerHTML = '';

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 3 + 's';
            particle.style.animationDuration = (3 + Math.random() * 2) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    function showSuccessMessage(message) {
        // Complete all stages
        document.querySelectorAll('.stage').forEach(stage => {
            stage.classList.add('completed');
            stage.classList.remove('active');
        });

        // Update to success state
        document.getElementById('status-title').textContent = 'Success!';
        document.getElementById('status-message').textContent = message;
        document.getElementById('estimated-time').textContent = 'Complete!';

        // Final progress animation
        animateProgressTo(100);

        // Success icon
        const iconElement = document.getElementById('progress-icon').querySelector('i');
        iconElement.className = 'ri-check-line';

        // Add success glow effect
        const progressRing = document.querySelector('.progress-ring-container');
        progressRing.classList.add('success');

        // Add celebration particles
        createCelebrationParticles();
    }

    function createCelebrationParticles() {
        const container = document.querySelector('.processing-container');

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.background = `hsl(${Math.random() * 60 + 280}, 70%, 60%)`;
            particle.style.borderRadius = '50%';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';

            const angle = (Math.PI * 2 * i) / 30;
            const velocity = 100 + Math.random() * 100;
            const lifetime = 1000 + Math.random() * 1000;

            container.appendChild(particle);

            let startTime = Date.now();
            function animateParticle() {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / lifetime;

                if (progress < 1) {
                    const x = Math.cos(angle) * velocity * progress;
                    const y = Math.sin(angle) * velocity * progress - (progress * progress * 200);
                    const opacity = 1 - progress;

                    particle.style.transform = `translate(${x}px, ${y}px)`;
                    particle.style.opacity = opacity;

                    requestAnimationFrame(animateParticle);
                } else {
                    container.removeChild(particle);
                }
            }

            requestAnimationFrame(animateParticle);
        }
    }

    // Enhanced progress tracking with more realistic timing
    function enhancedSimulateProgress() {
        const stages = [
            {
                name: 'upload',
                title: 'Uploading Document',
                message: 'Securely uploading your file...',
                progress: 15,
                time: '20-30 seconds',
                duration: 3000
            },
            {
                name: 'analyze',
                title: 'Analyzing Content',
                message: 'AI is reading and understanding your document...',
                progress: 45,
                time: '30-60 seconds',
                duration: 5000
            },
            {
                name: 'generate',
                title: 'Generating Questions',
                message: 'Creating intelligent questions from your content...',
                progress: 85,
                time: '10-20 seconds',
                duration: 4000
            }
        ];

        let stageIndex = 0;

        function nextStage() {
            if (stageIndex < stages.length) {
                const stage = stages[stageIndex];
                updateProcessingStage(stage);
                stageIndex++;

                // Use stage-specific duration
                setTimeout(nextStage, stage.duration);
            }
        }

        nextStage();
    }

    function showErrorMessage(message) {
        alert('Error: ' + message);
        hideProcessingStatus();
    }

    function resetGenerateButton() {
        btnText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
        generateBtn.disabled = uploadedFile ? false : true;
        hideProcessingStatus();
    }

    // Auto-refresh recent jobs if there are processing ones
    const processingJobs = document.querySelectorAll('.status-processing, .status-pending');
    if (processingJobs.length > 0) {
        setTimeout(() => {
            location.reload();
        }, 10000); // Refresh every 10 seconds
    }

    // Camera Upload for Mobile
    const cameraBtn = document.getElementById('camera-upload-btn');
    const cameraInput = document.getElementById('camera-file-input');
    if (cameraBtn && cameraInput) {
      // Only show on mobile
      function toggleCameraBtn() {
        if (window.innerWidth <= 768) {
          cameraBtn.style.display = 'block';
        } else {
          cameraBtn.style.display = 'none';
        }
      }
      toggleCameraBtn();
      window.addEventListener('resize', toggleCameraBtn);
      cameraBtn.addEventListener('click', function() {
        cameraInput.click();
      });
      cameraInput.addEventListener('change', function(e) {
        if (cameraInput.files && cameraInput.files[0]) {
          // Add the captured file to Dropzone
          myDropzone.removeAllFiles();
          myDropzone.addFile(cameraInput.files[0]);
        }
      });
    }
});

// Demo function for testing the animation
function demoProcessingAnimation() {
    const processingStatus = document.getElementById('processing-status');
    processingStatus.style.display = 'block';

    // Reset and start animation
    document.querySelectorAll('.stage').forEach(stage => {
        stage.classList.remove('active', 'completed');
    });

    // Initialize progress ring
    const progressCircle = document.getElementById('progress-circle');
    if (progressCircle) {
        const circumference = 2 * Math.PI * 50;
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference;
    }

    // Start demo animation
    const container = document.querySelector('.processing-container');
    container.style.opacity = '0';
    container.style.transform = 'scale(0.9)';

    setTimeout(() => {
        container.style.transition = 'all 0.5s ease';
        container.style.opacity = '1';
        container.style.transform = 'scale(1)';
    }, 100);

    // Create particles
    const particlesContainer = document.querySelector('.processing-particles');
    particlesContainer.innerHTML = '';

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (3 + Math.random() * 2) + 's';
        particlesContainer.appendChild(particle);
    }

    // Run demo stages
    const stages = [
        { name: 'upload', title: 'Demo: Uploading', message: 'Simulating file upload...', progress: 25, time: '5 seconds' },
        { name: 'analyze', title: 'Demo: Analyzing', message: 'Simulating content analysis...', progress: 50, time: '3 seconds' },
        { name: 'generate', title: 'Demo: Generating', message: 'Simulating question generation...', progress: 85, time: '2 seconds' }
    ];

    let stageIndex = 0;
    let currentProgress = 0;

    function nextDemoStage() {
        if (stageIndex < stages.length) {
            const stage = stages[stageIndex];

            // Update stage indicators
            const stageElement = document.getElementById(`stage-${stage.name}`);
            if (stageElement) {
                document.querySelectorAll('.stage').forEach((el, index) => {
                    if (index < stageIndex) {
                        el.classList.add('completed');
                        el.classList.remove('active');
                    }
                });
                stageElement.classList.add('active');
            }

            // Update text content
            document.getElementById('status-title').textContent = stage.title;
            document.getElementById('status-message').textContent = stage.message;
            document.getElementById('estimated-time').textContent = stage.time;

            // Animate progress
            const targetProgress = stage.progress;
            const animateStep = () => {
                if (currentProgress < targetProgress) {
                    currentProgress += 2;
                    const progressCircle = document.getElementById('progress-circle');
                    const progressPercentage = document.getElementById('progress-percentage');
                    const circumference = 2 * Math.PI * 50;

                    const offset = circumference - (currentProgress / 100) * circumference;
                    progressCircle.style.strokeDashoffset = offset;
                    progressPercentage.textContent = `${Math.round(currentProgress)}%`;

                    requestAnimationFrame(animateStep);
                }
            };
            animateStep();

            stageIndex++;

            if (stageIndex < stages.length) {
                setTimeout(nextDemoStage, 2000);
            } else {
                // Demo complete - add celebration
                setTimeout(() => {
                    const progressRing = document.querySelector('.progress-ring-container');
                    progressRing.classList.add('success');

                    // Add celebration particles
                    const container = document.querySelector('.processing-container');
                    for (let i = 0; i < 30; i++) {
                        const particle = document.createElement('div');
                        particle.style.position = 'absolute';
                        particle.style.width = '6px';
                        particle.style.height = '6px';
                        particle.style.background = `hsl(${Math.random() * 60 + 280}, 70%, 60%)`;
                        particle.style.borderRadius = '50%';
                        particle.style.left = '50%';
                        particle.style.top = '50%';
                        particle.style.pointerEvents = 'none';
                        particle.style.zIndex = '1000';

                        const angle = (Math.PI * 2 * i) / 30;
                        const velocity = 100 + Math.random() * 100;
                        const lifetime = 1000 + Math.random() * 1000;

                        container.appendChild(particle);

                        let startTime = Date.now();
                        function animateParticle() {
                            const elapsed = Date.now() - startTime;
                            const progress = elapsed / lifetime;

                            if (progress < 1) {
                                const x = Math.cos(angle) * velocity * progress;
                                const y = Math.sin(angle) * velocity * progress - (progress * progress * 200);
                                const opacity = 1 - progress;

                                particle.style.transform = `translate(${x}px, ${y}px)`;
                                particle.style.opacity = opacity;

                                requestAnimationFrame(animateParticle);
                            } else {
                                container.removeChild(particle);
                            }
                        }

                        requestAnimationFrame(animateParticle);
                    }

                    // Auto-hide after 3 seconds
                    setTimeout(() => {
                        processingStatus.style.display = 'none';
                        progressRing.classList.remove('success');
                    }, 3000);
                }, 1000);
            }
        }
    }

    nextDemoStage();
}

// Global function for canceling processing
function cancelProcessing() {
    if (confirm('Are you sure you want to cancel the processing? This will stop the current operation.')) {
        // Hide processing status
        const processingStatus = document.getElementById('processing-status');
        processingStatus.style.display = 'none';

        // Reset generate button
        const generateBtn = document.getElementById('generate-btn');
        const btnText = document.getElementById('btn-text');
        const loadingSpinner = document.getElementById('loading-spinner');

        btnText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
        generateBtn.disabled = false;

        // Show notification
        showNotification('Processing cancelled', 'info');

        // Clear any ongoing intervals
        if (window.progressInterval) {
            clearInterval(window.progressInterval);
        }
    }
}

// Global function for deleting quizzes
function deleteQuiz(jobId, documentName) {
    if (confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
        // Show loading state
        const deleteBtn = event.target.closest('button');
        const originalContent = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<i class="ri-loader-4-line"></i>';
        deleteBtn.disabled = true;

        // Send delete request
        fetch(`/api/brain/jobs/${jobId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // Remove the job item from the DOM
                const jobItem = deleteBtn.closest('.job-item');
                jobItem.style.transition = 'opacity 0.3s ease';
                jobItem.style.opacity = '0';
                setTimeout(() => {
                    jobItem.remove();

                    // Check if no jobs left
                    const jobsList = document.querySelector('.jobs-list');
                    if (jobsList && jobsList.children.length === 0) {
                        const recentJobs = document.querySelector('.recent-jobs');
                        if (recentJobs) {
                            recentJobs.style.display = 'none';
                        }
                    }
                }, 300);

                // Show success message
                showNotification('Quiz deleted successfully', 'success');
            } else {
                throw new Error('Failed to delete quiz');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Restore button state
            deleteBtn.innerHTML = originalContent;
            deleteBtn.disabled = false;
            showNotification('Failed to delete quiz. Please try again.', 'error');
        });
    }
}

// Function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="ri-${type === 'success' ? 'check' : 'error-warning'}-line"></i>
            <span>${message}</span>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
