/* Initialize global variables */
let originalDescription;
$(document).ready(function() {
    /* Store original EZLYNK content for dynamic mode switching */
    const ezlynkSections = [
        'ezlynkWifiIssueContent', 'ezlynkConnectionIssueContent', 'ezlynkEcmBootContent',
        'ezlynkFirmwareUpdateContent', 'ezlynkTuneInstallContent', 'ezlynkTechnicianLinkContent'
    ];
    const originalEzlynkContent = {};
    ezlynkSections.forEach(section => {
        originalEzlynkContent[section] = $(`#${section}`).html();
    });
    /* Set original description for mode restoration */
    originalDescription = $('.description').length ? $('.description').html() : "Resolve EFILive errors efficiently—enter your code, access expert solutions, and download files to maintain peak performance for your truck. Developed by PPEI’s experienced professionals.";
    console.log("Original description initialized:", originalDescription);
    /* Initialize normal mode */
    $('body').removeClass('asshole-mode');
    /* Define expandable sections for toggling */
    const expandableSections = [
        { parent: 'efiErrorCodes', header: '#efiErrorCodes > h3', content: 'efiContent' },
        { parent: 'additionalInfo', header: '#additionalInfo > h3', content: 'additionalContent' },
        { parent: 'ezlynkInfo', header: '#ezlynkInfo > h3', content: 'ezlynkContent' },
        { parent: 'truckBox', header: '#truckBox > h3', content: 'truckInfo' },
        { parent: 'additionalResourcesEFI', header: '#additionalResourcesEFI > h4', content: 'resourcesContentEFI' },
        { parent: 'additionalResourcesHP', header: '#additionalResourcesHP > h4', content: 'resourcesContentHP' },
        { parent: 'ezlynkWifiIssue', header: '#ezlynkWifiIssue > h4', content: 'ezlynkWifiIssueContent' },
        { parent: 'ezlynkConnectionIssue', header: '#ezlynkConnectionIssue > h4', content: 'ezlynkConnectionIssueContent' },
        { parent: 'ezlynkEcmBoot', header: '#ezlynkEcmBoot > h4', content: 'ezlynkEcmBootContent' },
        { parent: 'ezlynkFirmwareUpdate', header: '#ezlynkFirmwareUpdate > h4', content: 'ezlynkFirmwareUpdateContent' },
        { parent: 'ezlynkTuneInstall', header: '#ezlynkTuneInstall > h4', content: 'ezlynkTuneInstallContent' },
        { parent: 'ezlynkTechnicianLink', header: '#ezlynkTechnicianLink > h4', content: 'ezlynkTechnicianLinkContent' },
        { parent: 'powervisionTuning', header: '#powervisionTuning > h4', content: 'tuningContentPV3' },
        { parent: 'powervisionAdditional', header: '#powervisionAdditional > h4', content: 'dynoGraphsPV3' }
    ];

    /* Bind click events for expandable sections */
    expandableSections.forEach(({ parent, header, content }) => {
        $(header).off('click');
        $(header).click((event) => {
            event.stopPropagation();
            toggleSection(parent, content);
            $(header).attr('aria-expanded', $(`#${content}`).hasClass('expanded'));
            console.log(`Clicked ${header} for ${parent}`);
        });
        // Prevent link clicks from closing the dropdown
        $(`#${content} a`).click((event) => {
            event.stopPropagation();
            console.log(`Link clicked in ${content}, preventing dropdown close`);
        });
    });

    /* Validate error code format (4 hex digits) */
    const validateErrorCode = (code) => /^[0-9A-Fa-f]{4}$/.test(code.trim().toUpperCase());
    /* Validate license number (alphanumeric, 1-12 chars) */
    const validateLicenseNumber = (license) => /^[A-Za-z0-9]{1,12}$/.test(license.trim());
    /* Error code form submission */
$('#errorForm').submit(function(event) {
    event.preventDefault();
    const code = $('#error_code').val().trim();
    const $efiSection = $('#efiErrorCodes');
    const $resultContainer = $('#resultContainer');

    if (code.toLowerCase() === 'fuck you' || code.toLowerCase() === 'sorry') {
        // Proceed without validation
    } else if (!/^[0-9A-Fa-f]{4}$/.test(code.trim().toUpperCase())) {
        $resultContainer.html('<p class="error">Invalid error code. Use 4 hexadecimal digits (0-9, A-F).</p>');
        if (!$efiSection.find('.efi-content').hasClass('expanded')) {
            toggleSection('efiErrorCodes', 'efiContent');
            $('#efiErrorCodesHeading').attr('aria-expanded', true);
        }
        return;
    }

    console.log("Form submitted with code:", code);

    if (!$efiSection.find('.efi-content').hasClass('expanded')) {
        toggleSection('efiErrorCodes', 'efiContent');
        $('#efiErrorCodesHeading').attr('aria-expanded', true);
    }

    $.post('/submit', { error_code: code }, function(data) {
        console.log("AJAX success, response:", data);
        $('#error_code').val(data.error_code.replace('$', ''));
        $resultContainer.empty();
        if (data.asshole_mode) {
            console.log("Switching to or maintaining asshole mode");
            $('body').addClass('asshole-mode');
        } else {
            console.log("Switching to normal mode");
            $('body').removeClass('asshole-mode');
        }
        if (data.result) {
            console.log("Rendering result:", data.result);
            const fileDisplayNames = $('body').hasClass('asshole-mode') ? {
                "18-21 Cummins Bypass Install Instructions.pdf": "Bypass cable crap",
                "PPEI_BBX.bbx": "PPEI BBX Shit",
                "program autocal step by step.pdf": "AutoCal Fix Guide",
                "https://youtu.be/1s3yqm-zAgw?si=QlFq8De5Npggs31o": "Watch This, Idiot!",
                "lb7 and lly's.docx": "LB7/LLY Fuse Bullshit"
            } : {
                "18-21 Cummins Bypass Install Instructions.pdf": "Bypass cable instructions",
                "PPEI_BBX.bbx": "PPEI BBX File",
                "program autocal step by step.pdf": "Program AutoCal Guide",
                "https://youtu.be/1s3yqm-zAgw?si=QlFq8De5Npggs31o": "YouTube Tutorial",
                "lb7 and lly's.docx": "LB7/LLY Fuse Guide"
            };
            const filesHtml = data.result.files && data.result.files.length
                ? '<ul>' + data.result.files.map(file =>
                    file.startsWith('http')
                        ? `<li><a href="${file}" target="_blank" rel="noopener">${fileDisplayNames[file] || 'YouTube Tutorial'}</a></li>`
                        : `<li><a href="/download/Files/${file}" title="${file}">${fileDisplayNames[file] || file}</a></li>`
                  ).join('') + '</ul>'
                : $('body').hasClass('asshole-mode') ? 'None, you’re screwed' : 'None';
            $resultContainer.html(`
                <div class="result">
                    <h2>Error: ${data.error_code}</h2>
                    <p><strong>Description:</strong> ${data.result.description}</p>
                    <p><strong>Cause:</strong> ${data.result.cause}</p>
                    <p><strong>Action:</strong> ${data.result.action.replace(/\n/g, '<br>')}</p>
                    <p><strong>Files:</strong> ${filesHtml}</p>
                    ${data.result.grok_note ? `<p><em>${data.result.grok_note}</em></p>` : ''}
                </div>
            `);
        } else {
            console.log("No result found, displaying message:", data.message);
            const errorMessage = data.message || 'Error: Something went wrong. Try again, genius.';
            $resultContainer.html(`
                <div class="result">
                    <p class="error">${errorMessage}</p>
                </div>
            `);
        }
        $('#supportLink').attr('href', `mailto:zach@ppei.com?subject=PPEI%20Error%20Code%20Help&body=Hi%20PPEI%20team,%20I%20can’t%20find%20my%20error%20code%20(${data.error_code}).%20Can%20you%20help${$('body').hasClass('asshole-mode') ? ', assholes?' : '?'}`);
        try {
            updateAppMode(data.asshole_mode);
            console.log("Description after update:", $('.description').html());
        } catch (e) {
            console.error("Error in updateAppMode:", e);
        }
        preserveExpandedStates();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown) {
        console.log("AJAX failed, error:", textStatus, errorThrown);
        $resultContainer.html($('body').hasClass('asshole-mode') ? '<p class="error">Error loading result, you incompetent!</p>' : '<p class="error">Error loading result. Try again!</p>');
        if (!$efiSection.find('.efi-content').hasClass('expanded')) {
            toggleSection('efiErrorCodes', 'efiContent');
            $('#efiErrorCodesHeading').attr('aria-expanded', true);
        }
        preserveExpandedStates();
    });
});
    /* Unlink form submission */
    $('#unlinkForm').submit(function(event) {
        event.preventDefault();
        const licenseNumber = $('#license_number').val().trim();
        const unknownTunerLicense = $('#unknown_tuner_license').val().trim();
        const $resultContainer = $('#unlinkResult');
        const $loadingOverlay = $('#loadingOverlay');
        if (!validateLicenseNumber(licenseNumber) || (unknownTunerLicense && !validateLicenseNumber(unknownTunerLicense))) {
            $resultContainer.html($('body').hasClass('asshole-mode') ?
                '<p class="error">Invalid license number, alphanumeric up to 12 chars, dumbass!</p>' :
                '<p class="error">Invalid license number. Use alphanumeric characters, max 12.</p>');
            return;
        }
        const humorText = $('body').hasClass('asshole-mode') ? [
            "Processing your shitty request... Hold on!",
            "Sorting your mess... This’ll take a sec!",
            "Dealing with your crap... Lucky I’m here!"
        ] : [
            "Processing request... Stay tuned!",
            "Sending to PPEI... Almost there!",
            "Handling your AutoCal... Hang tight!"
        ];
        $('.loading-text').text(humorText[Math.floor(Math.random() * humorText.length)]);
        $loadingOverlay.addClass('active');
        let dotCount = 0;
        const dotInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            $('.loading-text').text(humorText[Math.floor(Math.random() * humorText.length)] + '.'.repeat(dotCount));
        }, 1000);
        setTimeout(() => {
            clearInterval(dotInterval);
            $.post('/unlink_request', {
                license_number: licenseNumber,
                unknown_tuner_license: unknownTunerLicense
            }, function(data) {
                $loadingOverlay.addClass('exiting');
                setTimeout(() => {
                    $loadingOverlay.removeClass('active exiting');
                    $resultContainer.empty();
                    if (data.success) {
                        $resultContainer.html(`<p class="success">${data.message}</p>`);
                    } else {
                        $resultContainer.html(`<p class="error">${data.message}</p>`);
                    }
                }, 500);
            }, 'json').fail(function(jqXHR, textStatus, errorThrown) {
                $loadingOverlay.addClass('exiting');
                setTimeout(() => {
                    $loadingOverlay.removeClass('active exiting');
                    $resultContainer.html($('body').hasClass('asshole-mode') ? '<p class="error">Request failed, you incompetent!</p>' : '<p class="error">Request failed. Try again!</p>');
                }, 500);
            });
        }, 3000);
    });
    /* Chatbot Functionality */
    const chatbox = document.getElementById('chatbox');
    const chatboxHeader = document.getElementById('chatbox-header');
    const chatboxMessages = document.getElementById('chatbox-messages');
    const chatboxInput = document.getElementById('chatbox-input');
    const sendBtn = document.getElementById('send-btn');
    const minimizeBtn = document.getElementById('minimize-btn');
    /* Display welcome message on load */
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'message bot-message';
    welcomeMessage.innerHTML = "Chatbot coming soon! Stay tuned for updates.<br>";
    chatboxMessages.appendChild(welcomeMessage);
    chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
    let isDragging = false;
    let currentX, currentY;
    let isMinimized = false;
    /* Dragging functionality */
    chatboxHeader.addEventListener('mousedown', (e) => {
        if (!isMinimized) {
            isDragging = true;
            const rect = chatbox.getBoundingClientRect();
            currentX = e.clientX - rect.left;
            currentY = e.clientY - rect.top;
            chatbox.style.transition = 'none';
            e.preventDefault();
        }
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            chatbox.style.left = (e.clientX - currentX) + 'px';
            chatbox.style.top = (e.clientY - currentY) + 'px';
        }
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
        chatbox.style.transition = 'all 0.3s ease';
    });
    /* Minimize/Maximize functionality */
    minimizeBtn.addEventListener('click', (e) => {
        isMinimized = !isMinimized;
        if (isMinimized) {
            chatbox.classList.add('chatbox-minimized');
            minimizeBtn.textContent = '+';
            chatboxHeader.style.cursor = 'pointer';
        } else {
            chatbox.classList.remove('chatbox-minimized');
            minimizeBtn.textContent = '−';
            chatboxHeader.style.cursor = 'move';
        }
        minimizeBtn.setAttribute('aria-label', isMinimized ? 'Maximize chat' : 'Minimize chat');
        e.stopPropagation();
    });
    /* Allow clicking header to maximize when minimized */
    chatboxHeader.addEventListener('click', (e) => {
        if (isMinimized) {
            isMinimized = false;
            chatbox.classList.remove('chatbox-minimized');
            minimizeBtn.textContent = '−';
            chatboxHeader.style.cursor = 'move';
            minimizeBtn.setAttribute('aria-label', 'Minimize chat');
            e.preventDefault();
        }
    });
    /* Disable send message functionality */
    sendBtn.addEventListener('click', sendMessage);
    chatboxInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    function sendMessage() {
        const message = chatboxInput.value.trim();
        if (message) {
            const userMessage = document.createElement('div');
            userMessage.className = 'message user-message';
            userMessage.innerHTML = `${message}<br>`;
            chatboxMessages.appendChild(userMessage);
            chatboxInput.value = '';
            const typingBubble = document.createElement('div');
            typingBubble.className = 'typing-bubble';
            typingBubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
            chatboxMessages.appendChild(typingBubble);
            chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
            console.log("Sending chat request:", message);
            fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            })
            .then(response => {
                console.log("Chat response status:", response.status);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                typingBubble.remove();
                const botMessage = document.createElement('div');
                botMessage.className = 'message bot-message';
                botMessage.innerHTML = `${data.response}<br>`;
                chatboxMessages.appendChild(botMessage);
                chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
            })
            .catch(error => {
                console.error('Error:', error);
                typingBubble.remove();
                const botMessage = document.createElement('div');
                botMessage.className = 'message bot-message';
                botMessage.innerHTML = 'Chatbot coming soon! Stay tuned for updates.<br>';
                chatboxMessages.appendChild(botMessage);
                chatboxMessages.scrollTop = chatboxMessages.scrollHeight;
            });
        }
    }
});

/* Toggle section */
function toggleSection(sectionId, contentId) {
    const $section = $(`#${sectionId}`);
    const $content = $(`#${contentId}`);
    const isExpanded = $content.hasClass('expanded');
    if (isExpanded) {
        $content.removeClass('expanded').css('max-height', '0').css('opacity', '0');
        $section.find('h3, h4').first().removeClass('expanded');
    } else {
        $content.addClass('expanded').css('max-height', '10000px').css('opacity', '1');
        $section.find('h3, h4').first().addClass('expanded');
    }
    console.log(`Toggled ${sectionId}, content: ${contentId}, expanded: ${$content.hasClass('expanded')}`);
}

/* Preserve expanded states */
function preserveExpandedStates() {
    $('.efi-content.expanded, .additional-content.expanded, .truck-info.expanded, .resources-content.expanded')
        .css('max-height', '10000px').css('opacity', '1');
}

/* Update app mode */
function updateAppMode(isAssholeMode) {
    console.log("Updating app mode, mode:", isAssholeMode ? "asshole" : "normal");
    const description = $('.description');
    const currentDescription = description.html();
    console.log("Current description before update:", currentDescription);
    console.log("Original description value:", originalDescription);
    const updates = isAssholeMode ? {
        '#ezlynkWifiIssueContent': `
            <p><strong>Issue:</strong> Your shitty EZLYNK isn’t broadcasting WiFi—big surprise.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Unplug the damn thing, wait a minute, then plug it back in.</li>
                <li>Check for a blue light—if it’s dead, you’re screwed.</li>
                <li>Look at the OBD-II port for bent pins or debris.</li>
                <li>Still fucked? Contact EZLYNK support for a replacement.</li>
            </ul>
        `,
        '#ezlynkConnectionIssueContent': `
            <p><strong>Issue:</strong> You see "EZLYNK_XX" but can’t connect—pathetic.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Ignore the "No Internet" warning—it’s for your truck, not social media.</li>
                <li>Restart your phone and the EZLYNK device.</li>
                <li>Get closer to the truck—no signal through walls.</li>
                <li>Still nothing? Update the app.</li>
            </ul>
        `,
        '#ezlynkEcmBootContent': `
            <p><strong>Issue:</strong> "Can’t talk to ECM"—boo-hoo.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Turn the key to "Run" first—ECM needs to wake up.</li>
                <li>Ensure the EZLYNK is securely plugged into the OBD-II port.</li>
                <li>Check for loose cables.</li>
                <li>Still dead? ECM might be locked—contact your tech.</li>
            </ul>
        `,
        '#ezlynkFirmwareUpdateContent': `
            <p><strong>Issue:</strong> Firmware update failed—shocker.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Unplug the EZLYNK, wait 30 seconds, then plug it back in.</li>
                <li>Check the firmware version in the app under "About" in "Settings".</li>
                <li>If it’s still old, get a stable internet connection and retry.</li>
                <li>Still broken? Contact EZLYNK support.</li>
            </ul>
        `,
        '#ezlynkTuneInstallContent': `
            <p><strong>Issue:</strong> Tune install stuck at 0%—typical.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Your cell data’s probably to blame.</li>
                <li>Unplug the EZLYNK, use WiFi, and grab the tune again from the "Cloud" button.</li>
                <li>Plug it back in and retry.</li>
                <li>Charge your battery—low volts mess this up.</li>
            </ul>
        `,
        '#ezlynkTechnicianLinkContent': `
            <p><strong>Issue:</strong> Can’t link to a tech—poor you.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Get internet or data.</li>
                <li>In the app, go to "Vehicle," pick your truck, hit "Technicians," then "Lynk."</li>
                <li>Type the tech’s email—your dealer gave it—and list your mods.</li>
                <li>No email? Contact your EZLYNK dealer.</li>
            </ul>
        `
    } : {
        '#ezlynkWifiIssueContent': `
            <p><strong>Issue:</strong> The EZLYNK device isn’t broadcasting a WiFi signal (e.g., "EZLYNK_XX"), so you can’t connect via the app.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Unplug the EZLYNK device from the OBD-II port, wait 60 seconds, then plug it back in.</li>
                <li>Check for a blue light on the device—if it’s not lit, the device may be faulty.</li>
                <li>Inspect the OBD-II port for bent pins or debris that might prevent a proper connection.</li>
                <li>If the issue persists, contact EZLYNK support for a potential firmware update or device replacement.</li>
            </ul>
        `,
        '#ezlynkConnectionIssueContent': `
            <p><strong>Issue:</strong> You see "EZLYNK_XX" network but can’t connect, or it says "Unable to connect."</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Ignore the "No Internet Connection" message on your phone—it’s normal since the EZLYNK network connects to the vehicle, not the internet.</li>
                <li>Restart your phone and the EZLYNK device (unplug and replug into the OBD-II port).</li>
                <li>Ensure you’re within WiFi range (close to the vehicle) and there’s no interference from other networks.</li>
                <li>If the issue persists, update the EZLYNK app to the latest version and retry.</li>
            </ul>
        `,
        '#ezlynkEcmBootContent': `
            <p><strong>Issue:</strong> The EZLYNK app shows "Unable to communicate with your vehicle" when trying to stream data or tune.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Turn the vehicle’s key to the "Run" position (without starting the engine) to boot the ECM before connecting the EZLYNK device.</li>
                <li>Ensure the EZLYNK device is securely plugged into the OBD-II port.</li>
                <li>Check for any loose connections or damaged cables between the device and the port.</li>
                <li>If the issue continues, verify the ECM is not locked (e.g., similar to \`$0333\`) and contact your technician.</li>
            </ul>
        `,
        '#ezlynkFirmwareUpdateContent': `
            <p><strong>Issue:</strong> The EZLYNK device disconnects during a firmware update, leaving it in an unstable state.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Unplug the EZLYNK device from the OBD-II port, wait 30 seconds, then plug it back in.</li>
                <li>Connect to the EZLYNK app and check the firmware version under the "About" page in the "Settings" tab.</li>
                <li>If the firmware didn’t update, ensure a stable internet connection and retry the update.</li>
                <li>Contact EZLYNK support if the device remains unresponsive.</li>
            </ul>
        `,
        '#ezlynkTuneInstallContent': `
            <p><strong>Issue:</strong> When installing a tune via the EZLYNK app, the progress bar stalls at 0%.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>This often happens due to incomplete data downloads over cell data or unstable networks.</li>
                <li>Unplug the EZLYNK device, connect your phone to a stable WiFi network, and fetch the tune profile again via the "Cloud" button in the app.</li>
                <li>Plug the device back in and retry the installation.</li>
                <li>Ensure your vehicle’s battery is charged or connected to a charger, as low voltage can interrupt the process.</li>
            </ul>
        `,
        '#ezlynkTechnicianLinkContent': `
            <p><strong>Issue:</strong> The EZLYNK app fails to link your vehicle with a technician for tune updates or diagnostics.</p>
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Ensure you’re connected to the internet or mobile data.</li>
                <li>In the EZLYNK app, go to the "Vehicle" tab, select your vehicle, tap "Technicians," and choose "Lynk."</li>
                <li>Enter the technician’s email address (provided by your dealer) and describe any vehicle modifications.</li>
                <li>If you don’t have the technician’s email, contact your EZLYNK dealer for assistance.</li>
            </ul>
        `
    };
    Object.entries(updates).forEach(([selector, html]) => {
        $(selector).html(html);
        console.log(`Updated ${selector} content`);
    });
    if (isAssholeMode) {
        description.html("Get your pathetic EFILive errors sorted, dipshit—just shove your dumbass code in, snag PPEI’s top-notch fixes, and download what you need to keep your shitty truck from totally fucking up. PPEI’s elite pros built this, because we’re the best—unlike your sorry ass.");
        console.log("Set description to asshole mode text");
    } else {
        const normalDescription = originalDescription || "Resolve EFILive errors efficiently—enter your code, access expert solutions, and download files to maintain peak performance for your truck. Developed by PPEI’s experienced professionals.";
        description.html(normalDescription);
        console.log("Restored description to:", normalDescription);
    }
}

window.onload = function() {
    if ($('.result').length) {
        toggleSection('efiErrorCodes', 'efiContent');
        $('#efiErrorCodesHeading').attr('aria-expanded', true);
    }
};