const videoInput = document.getElementById('videoInput');
const imageInput = document.getElementById('imageInput');
const videoPreview = document.getElementById('videoPreview');
const imagePreview = document.getElementById('imagePreview');
const imageContainer = document.getElementById('imageContainer');
const indicator = document.querySelector('.indicator');
const hoverIndicator = document.querySelector('.hover-indicator'); // Hover indicator element
const durationInput = document.getElementById('durationInput'); // Input field for custom duration
const increaseDuration = document.getElementById('increaseDuration'); // Button to increase duration
const decreaseDuration = document.getElementById('decreaseDuration'); // Button to decrease duration

let videoDuration = 0;
let customDuration = 0; // Custom duration to be used for calculations
let imageWidth = 0;

// Percentage-based offsets for the indicator
const startOffsetPercentage = (88 / 2393) * 100; // Start at 88px based on the original image width
const endOffsetPercentage = (8 / 2393) * 100;    // End at 8px before the right edge based on the original image width

// Additional offset to move the hover and main indicator slightly to the right
const hoverOffset = 16; // X pixels to the right

// Helper function to convert seconds to MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
}

// Helper function to convert MM:SS format to seconds
function parseTime(timeString) {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return (minutes * 60) + seconds;
}

// Function to update duration input value based on a given number of seconds
function updateDurationInput(seconds) {
    customDuration = Math.max(0, customDuration + seconds); // Ensure customDuration is not negative
    durationInput.value = formatTime(customDuration);
}

// Handle video input
videoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const videoURL = URL.createObjectURL(file);
        videoPreview.src = videoURL;
        videoPreview.load();

        videoPreview.addEventListener('loadedmetadata', () => {
            videoDuration = videoPreview.duration;
            customDuration = videoDuration; // Default to loaded video duration

            // Set the input field value to the loaded video duration in MM:SS format
            durationInput.value = formatTime(customDuration);

            // Set the video width and sync with image container width
            const videoWidth = videoPreview.videoWidth;
            const videoDisplayWidth = Math.min(videoWidth, 1000); // Respect max-width
            videoPreview.style.width = videoDisplayWidth + 'px';
            imageContainer.style.width = videoDisplayWidth + 'px';
            imagePreview.style.width = videoDisplayWidth + 'px'; // Sync image width with video
            imageContainer.style.display = 'flex'; // Ensure container stays centered
        });
    }
});

// Handle duration input change
durationInput.addEventListener('input', () => {
    // Use custom duration if input is not empty and formatted correctly
    const inputDuration = parseTime(durationInput.value);
    if (inputDuration > 0) {
        customDuration = inputDuration;
    } else {
        customDuration = videoDuration; // Fall back to video duration
    }
});

// Handle increase and decrease duration buttons
increaseDuration.addEventListener('click', () => updateDurationInput(1)); // Increase by 10 seconds
decreaseDuration.addEventListener('click', () => updateDurationInput(-1)); // Decrease by 10 seconds

// Handle image input
imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const imageURL = URL.createObjectURL(file);
        imagePreview.src = imageURL;
        imagePreview.hidden = false; // Show image when loaded

        imagePreview.onload = () => {
            imageWidth = imagePreview.offsetWidth;

            // Adjust container width and height based on the image's natural dimensions
            imageContainer.style.width = '100%';
            imageContainer.style.maxWidth = '1000px'; // Maintain max width
            imageContainer.style.height = 'auto'; // Let height be auto
            imageContainer.style.backgroundColor = '#ffffff'; // Remove gray background

            // Center the image within the container
            imagePreview.style.margin = '0 auto';
            imagePreview.style.display = 'block';
        };
    }
});

// Update indicator position as the video plays
videoPreview.addEventListener('timeupdate', () => {
    if (customDuration > 0) {
        const currentTime = videoPreview.currentTime;
        const percentage = currentTime / customDuration; // Use custom duration

        // Calculate the new position of the indicator based on the video timeline
        const newLeftPosition = (startOffsetPercentage + percentage * (100 - startOffsetPercentage - endOffsetPercentage)) + '%';
        indicator.style.left = newLeftPosition;
    }
});

// Debounce function to limit the frequency of updates
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Handle hover on the image to show hover-indicator
const updateHoverIndicator = debounce((event) => {
    if (imageWidth > 0) {
        const mouseX = event.offsetX + hoverOffset; // Adding hover offset to move right

        // Calculate the percentage of the mouse position relative to the image width
        const relativeMousePosition = (mouseX / imageWidth) * 100;

        // Calculate the bounded position within the start and end offset percentages
        const boundedMousePosition = Math.max(startOffsetPercentage, Math.min(relativeMousePosition, 100 - endOffsetPercentage));

        // Show the hover indicator and align it with the mouse cursor
        hoverIndicator.style.left = boundedMousePosition + '%';
        hoverIndicator.style.display = 'block';
    }
}, 10); // Adjust the debounce wait time as necessary

// Apply the debounced function to the mousemove event
imageContainer.addEventListener('mousemove', updateHoverIndicator);

// Hide hover-indicator when mouse leaves the image area
imageContainer.addEventListener('mouseleave', () => {
    hoverIndicator.style.display = 'none';
});

// Handle click event on the image to jump to a specific time in the video
imageContainer.addEventListener('click', (event) => {
    if (customDuration > 0 && imageWidth > 0) {
        // Get the click position relative to the image
        const clickX = event.offsetX + hoverOffset; // Adding hover offset to main indicator

        // Calculate the percentage of the click position relative to the image width
        const relativeClickPosition = (clickX / imageWidth) * 100;

        // Calculate the bounded position within the start and end offset percentages
        const boundedClickPercentage = Math.max(startOffsetPercentage, Math.min(relativeClickPosition, 100 - endOffsetPercentage));

        // Calculate the percentage position within the clickable area
        const clickPercentage = (boundedClickPercentage - startOffsetPercentage) / (100 - startOffsetPercentage - endOffsetPercentage);

        // Map the click percentage to the custom duration
        const jumpToTime = customDuration * clickPercentage;

        // Set the video current time to the calculated time
        videoPreview.currentTime = jumpToTime;

        // Move the indicator to the corresponding position
        const newLeftPosition = (startOffsetPercentage + clickPercentage * (100 - startOffsetPercentage - endOffsetPercentage)) + '%';
        indicator.style.left = newLeftPosition;
    }
});